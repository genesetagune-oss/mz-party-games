import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { playSound } from "../utils/sound";

export default function SporcleMZOnline({ onBack, room, roomCode, gamePublic, gamePrivate, onSwitchGame }) {
  const me          = room?.players?.find(p => p.id === socket.id);
  const isHost      = !!me?.isHost;
  const playerCount = room?.players?.length ?? 0;

  const phase       = gamePublic?.phase    ?? "lobby";
  const mode        = gamePublic?.mode     ?? "individual";
  const qIdx        = gamePublic?.qIdx     ?? 0;
  const totalQ      = gamePublic?.totalQ   ?? 5;
  const timeLeft    = gamePublic?.timeLeft ?? 0;
  const scores      = gamePublic?.scores   ?? [];
  const teamRanking = gamePublic?.teamRanking ?? [];
  const equipas     = gamePublic?.equipas  ?? [];
  const question    = gamePublic?.question ?? null;
  const playerCounts           = gamePublic?.playerCounts           ?? {};
  const teamCounts             = gamePublic?.teamCounts             ?? {};
  const answeredShortCount     = gamePublic?.answeredShortCount     ?? 0;
  const answeredShortTeamsCount = gamePublic?.answeredShortTeamsCount ?? 0;

  const myAcertadas   = new Set(gamePrivate?.myAcertadas   ?? []);
  const teamAcertadas = new Set(gamePrivate?.teamAcertadas ?? []);
  const answeredShort = gamePrivate?.answeredShort ?? false;
  const teamAnswered  = gamePrivate?.teamAnswered  ?? false;
  const isCaptain     = gamePrivate?.isCaptain     ?? false;
  const myTeamId      = gamePrivate?.myTeamId      ?? null;

  const [input, setInput]                 = useState("");
  const [feedback, setFeedback]           = useState(null);
  const [passPhoneOpen, setPassPhoneOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const inputRef        = useRef(null);
  const fbTimRef        = useRef(null);
  const teamNameInputRef = useRef(null);

  useEffect(() => {
    if (editingTeamId) setTimeout(() => teamNameInputRef.current?.focus(), 30);
  }, [editingTeamId]);

  function submitTeamRename() {
    const draft = teamNameDraft.trim();
    if (draft.length >= 2 && draft.length <= 20) {
      socket.emit("game:command", { type: "RENAME_TEAM", name: draft });
    }
    setEditingTeamId(null);
  }

  const prevPhaseRefSp = useRef(phase);
  useEffect(() => {
    if (prevPhaseRefSp.current !== "finished" && phase === "finished") playSound("win");
    prevPhaseRefSp.current = phase;
  }, [phase]);

  const leaveToMenu = () => { socket.emit("room:leave"); onBack?.(); };

  const myTeam    = equipas.find(t => t.id === myTeamId) ?? null;
  const captain   = myTeam ? room?.players?.find(p => p.id === myTeam.currentCaptainId) : null;

  const timerPct   = question ? (timeLeft / question.tempo) * 100 : 0;
  const timerColor = timeLeft > (question?.tempo ?? 15) * 0.5
    ? "#00e5b0" : timeLeft > (question?.tempo ?? 15) * 0.2
    ? "#f97316" : "#ef4444";

  // ── effects ──────────────────────────────────────────────

  useEffect(() => {
    if (!feedback) return;
    if (fbTimRef.current) clearTimeout(fbTimRef.current);
    const delay = feedback.tipo === "quase" ? 2500 : 1000;
    fbTimRef.current = setTimeout(() => setFeedback(null), delay);
    return () => clearTimeout(fbTimRef.current);
  }, [feedback]);

  useEffect(() => {
    if (phase === "question") {
      setInput("");
      setFeedback(null);
      setPassPhoneOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase, qIdx]);

  useEffect(() => {
    const handle = (evt) => {
      if (evt.type === "ANSWER_RESULT") {
        const msgs = {
          acerto:    { tipo: "acerto",    msg: "✅ Correcto!" },
          quase:     { tipo: "quase",     msg: evt.sugestao ? `🤔 Quase! Talvez "${evt.sugestao}"?` : "🤔 Quase!" },
          erro:      { tipo: "erro",      msg: "❌ Errado" },
          duplicado: { tipo: "duplicado", msg: "Já disseste!" },
        };
        setFeedback(msgs[evt.resultado] ?? null);
        if (evt.resultado === "acerto" || evt.resultado === "erro") setInput("");
      } else if (evt.type === "PHONE_RECEIVED") {
        setFeedback({ tipo: "acerto", msg: "📲 Passaram-te o telemóvel! É a tua vez!" });
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (evt.type === "PHONE_PASSED") {
        setFeedback({ tipo: "duplicado", msg: "📲 Telemóvel passado!" });
        setPassPhoneOpen(false);
      }
    };
    socket.on("game:event", handle);
    return () => socket.off("game:event", handle);
  }, []);

  // ── share ─────────────────────────────────────────────────
  const [shareFeedback, setShareFeedback] = useState("");
  async function handleShare() {
    const url  = `https://mz-party-games.onrender.com/?join=${roomCode}`;
    const text = `🎮 Joga Sporcle MZ comigo!\nEntra → ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "MZ Party Games", text, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); } catch { window.prompt("Copia o link:", url); }
    }
    setShareFeedback("Copiado! ✓");
    setTimeout(() => setShareFeedback(""), 2500);
  }

  // ── helpers ───────────────────────────────────────────────

  const isAnswerBlocked = mode === "equipas"
    ? (!isCaptain || (question?.tipo === "resposta_curta" && teamAnswered))
    : (question?.tipo === "resposta_curta" && answeredShort);

  function submitAnswer() {
    if (!input.trim() || phase !== "question" || isAnswerBlocked) return;
    socket.emit("game:command", { type: "ANSWER", answer: input.trim() });
    if (question?.tipo === "resposta_curta") setInput("");
  }

  const handleKey   = (e) => { if (e.key === "Enter") { e.preventDefault(); submitAnswer(); } };
  const handlePaste = (e) => e.preventDefault();

  // ── LOBBY ─────────────────────────────────────────────────
  if (phase === "lobby") {
    const assignedIds         = new Set(equipas.flatMap(t => t.members.map(m => m.id)));
    const unassigned          = room?.players?.filter(p => !assignedIds.has(p.id)) ?? [];
    const allTeamsHaveMembers = equipas.every(t => t.members.length > 0);
    const canStart = playerCount >= 2 &&
      (mode !== "equipas" || (unassigned.length === 0 && allTeamsHaveMembers));

    const disabledReason = !canStart
      ? playerCount < 2
        ? `Faltam ${2 - playerCount} jogador${2 - playerCount !== 1 ? "es" : ""} para começar`
        : mode === "equipas" && unassigned.length > 0
          ? `${unassigned.length} jogador${unassigned.length !== 1 ? "es" : ""} ainda sem equipa`
          : mode === "equipas" && !allTeamsHaveMembers
            ? "Alguma equipa está vazia"
            : null
      : null;

    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ · {mode === "equipas" ? "Equipas" : "Individual"}</div>
              <div style={{ opacity: .6, fontSize: 11, marginTop: 2 }}>
                Sala: <b>{roomCode}</b> · {playerCount} jogador{playerCount !== 1 ? "es" : ""}
              </div>
            </div>
            <div className="timerPill">🧩</div>
          </header>

          <main className="gameMain" style={{ gap: 14 }}>

            {/* ── Share code ── */}
            <button className="lobbyCodeCard" onClick={handleShare} type="button">
              <div className="lobbyCodeLabel">{shareFeedback || "SHARE CODE"}</div>
              <div className="lobbyCodeRow">
                <div className="lobbyCodeValue">{roomCode.match(/.{1,3}/g)?.join(" ")}</div>
                <div className="lobbyShareBtn">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 11, opacity: .50, marginTop: 6 }}>
                Toca para partilhar · WhatsApp, Instagram, SMS…
              </div>
            </button>

            {/* ── INDIVIDUAL ── */}
            {mode === "individual" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {room?.players?.map(p => (
                  <div key={p.id} style={{
                    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 12, padding: "10px 16px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 16 }}>{p.isHost ? "👑" : "🎮"}</span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                    {p.id === socket.id && <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>(tu)</span>}
                  </div>
                ))}
              </div>
            )}

            {/* ── EQUIPAS ── */}
            {mode === "equipas" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>

                {/* Por atribuir */}
                {unassigned.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 6 }}>
                      Por atribuir
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {unassigned.map(p => (
                        <div key={p.id} style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.15)",
                          color: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", gap: 5,
                        }}>
                          {p.name}
                          {p.id === socket.id && <span style={{ opacity: .4 }}>(tu)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team slots */}
                {equipas.map(team => {
                  const isMyTeamSlot = myTeamId === team.id;
                  const canEditName  = isMyTeamSlot && !isHost;
                  const isEditing    = editingTeamId === team.id;
                  return (
                    <div key={team.id} style={{
                      border: `1.5px solid ${team.color}40`, background: `${team.color}0d`,
                      borderRadius: 14, padding: "10px 14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: team.members.length > 0 ? 8 : 0 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: team.color, flexShrink: 0 }} />

                        {/* Team name — inline edit for own team members */}
                        {isEditing ? (
                          <input
                            ref={teamNameInputRef}
                            value={teamNameDraft}
                            onChange={e => setTeamNameDraft(e.target.value)}
                            onBlur={submitTeamRename}
                            onKeyDown={e => {
                              if (e.key === "Enter") { e.preventDefault(); submitTeamRename(); }
                              if (e.key === "Escape") setEditingTeamId(null);
                            }}
                            maxLength={20}
                            style={{
                              flex: 1, background: "transparent", border: "none",
                              borderBottom: `1.5px solid ${team.color}`,
                              color: team.color, fontWeight: 900, fontSize: 13,
                              outline: "none", padding: "0 2px",
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: 900, fontSize: 13, color: team.color, flex: 1 }}>
                            {team.name}
                          </span>
                        )}

                        {/* Edit pencil — only for own team members, not host */}
                        {canEditName && !isEditing && (
                          <button
                            type="button"
                            onClick={() => { setEditingTeamId(team.id); setTeamNameDraft(team.name); }}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              fontSize: 13, opacity: .45, padding: "0 2px", lineHeight: 1,
                            }}
                            title="Renomear equipa"
                          >✏️</button>
                        )}

                        <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", flexShrink: 0 }}>
                          {team.members.length} jogador{team.members.length !== 1 ? "es" : ""}
                        </span>
                      </div>
                      {team.members.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {team.members.map(m => (
                            <div key={m.id} style={{
                              padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                              background: "rgba(255,255,255,.08)", color: "#fff",
                              display: "flex", alignItems: "center", gap: 5,
                            }}>
                              {m.name}
                              {m.id === socket.id && <span style={{ opacity: .5 }}>(tu)</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Self-assign buttons (every player, including host) */}
                {equipas.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
                      {myTeamId ? "Mudar de equipa:" : "Escolhe a tua equipa:"}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {equipas.map(t => {
                        const isMyTeam = myTeamId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            disabled={isMyTeam}
                            onClick={() => socket.emit("game:command", { type: "JOIN_TEAM", teamId: t.id })}
                            style={{
                              flex: 1, minWidth: 80, padding: "10px 6px", borderRadius: 12,
                              fontWeight: 800, fontSize: 12,
                              border: `2px solid ${isMyTeam ? t.color : `${t.color}60`}`,
                              background: isMyTeam ? `${t.color}25` : "rgba(255,255,255,.04)",
                              color: isMyTeam ? t.color : "rgba(255,255,255,.55)",
                              cursor: isMyTeam ? "default" : "pointer",
                            }}
                          >
                            {isMyTeam ? "✓ " : ""}{t.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Start / waiting ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
              {isHost ? (
                <>
                  <button
                    className="btnPrimary"
                    disabled={!canStart}
                    onClick={() => socket.emit("game:start")}
                    type="button"
                    style={{ width: "100%", opacity: canStart ? 1 : 0.55 }}
                  >
                    {canStart ? "▶ Começar Jogo" : "Aguarda…"}
                  </button>
                  {disabledReason && (
                    <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                      {disabledReason}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", textAlign: "center" }}>
                  Aguardando o host iniciar…
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────
  if (phase === "finished") {
    const isTeams = mode === "equipas";

    if (isTeams) {
      const myTeamRank = teamRanking.findIndex(t => t.id === myTeamId);
      const topTeam    = teamRanking[0];
      return (
        <div className="appBg">
          <div className="shell shellGame">
            <header className="gameHeader">
              <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
              <div className="headerTitleBlock">
                <div className="h1Brand">MZ Party Games</div>
                <div className="h2Game">Sporcle MZ · Resultado</div>
              </div>
              <div className="timerPill">🏆</div>
            </header>
            <main className="gameMain" style={{ gap: 16 }}>
              <div style={{ textAlign: "center", paddingTop: 8 }}>
                <div style={{ fontSize: 48 }}>🏆</div>
                <div style={{ fontWeight: 900, fontSize: 20, marginTop: 8, color: topTeam?.color }}>
                  {topTeam?.name} venceram!
                </div>
                {myTeamId && (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                    A tua equipa ficou em {myTeamRank + 1}º lugar
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {teamRanking.map((t, i) => (
                  <div key={t.id} style={{
                    background: `${t.color}1a`,
                    border: `1.5px solid ${t.color}50`,
                    borderRadius: 14, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                    </span>
                    <span style={{ flex: 1, fontWeight: 800, color: t.color }}>{t.name}</span>
                    {t.id === myTeamId && <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>(tu)</span>}
                    <span style={{ fontWeight: 900, fontSize: 18, color: "#00e5b0" }}>{t.score} pts</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 6 }}>
                  Jogadores
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {scores.map((s, i) => {
                    const playerTeam = equipas.find(t => t.members.some(m => m.id === s.id));
                    const isMe = s.id === socket.id;
                    return (
                      <div key={s.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        opacity: isMe ? 1 : 0.7,
                      }}>
                        <span style={{ width: 20, fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.35)" }}>{i + 1}º</span>
                        {playerTeam && <div style={{ width: 8, height: 8, borderRadius: "50%", background: playerTeam.color, flexShrink: 0 }} />}
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{s.name}{isMe ? " (tu)" : ""}</span>
                        <span style={{ fontWeight: 800, color: "#00e5b0", fontSize: 13 }}>{s.score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
                {isHost ? (
                  <>
                    <button className="btnPrimary" onClick={() => socket.emit("game:restart")} type="button">🔁 Jogar outra vez</button>
                    <button className="btnPrimary" onClick={onSwitchGame} type="button">🎮 Mudar Jogo</button>
                  </>
                ) : (
                  <div className="waitingHostMsg"><div className="waitingHostDot" />Host a decidir próximo passo...</div>
                )}
                <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
              </div>
            </main>
          </div>
        </div>
      );
    }

    // Individual finished
    const winner   = scores[0];
    const myRank   = scores.findIndex(s => s.id === socket.id);
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ · Resultado</div>
            </div>
            <div className="timerPill">🏆</div>
          </header>
          <main className="gameMain" style={{ gap: 16 }}>
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <div style={{ fontSize: 48 }}>🏆</div>
              <div style={{ fontWeight: 900, fontSize: 20, marginTop: 8 }}>{winner?.name} venceu!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                Tu ficaste em {myRank + 1}º lugar {myRank === 0 ? "🥇" : myRank === 1 ? "🥈" : myRank === 2 ? "🥉" : "🎮"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {scores.map((s, i) => {
                const isMe = s.id === socket.id;
                return (
                  <div key={s.id} style={{
                    background: i === 0 ? "rgba(255,215,0,.1)" : isMe ? "rgba(124,93,250,.1)" : "rgba(255,255,255,.04)",
                    border: `1px solid ${i === 0 ? "rgba(255,215,0,.3)" : isMe ? "rgba(124,93,250,.3)" : "rgba(255,255,255,.08)"}`,
                    borderRadius: 14, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                    </span>
                    <span style={{ flex: 1, fontWeight: 700 }}>{s.name}{isMe ? " (tu)" : ""}</span>
                    <span style={{ fontWeight: 900, fontSize: 18, color: "#00e5b0" }}>{s.score} pts</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {isHost ? (
                <>
                  <button className="btnPrimary" onClick={() => socket.emit("game:restart")} type="button">🔁 Jogar outra vez</button>
                  <button className="btnPrimary" onClick={onSwitchGame} type="button">🎮 Mudar Jogo</button>
                </>
              ) : (
                <div className="waitingHostMsg"><div className="waitingHostDot" />Host a decidir próximo passo...</div>
              )}
              <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── QUESTION / REVEAL ────────────────────────────────────
  const isTeams     = mode === "equipas";
  const isLista     = question?.tipo === "lista";
  const qTotal      = question?.total ?? 0;
  const myCount     = isTeams ? teamAcertadas.size : myAcertadas.size;
  const isRevealing = phase === "reveal";

  // For pass-phone: teammates excluding self
  const teammates = myTeam
    ? myTeam.members.filter(m => m.id !== socket.id)
    : [];

  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game" style={isTeams && myTeam ? { color: myTeam.color } : undefined}>
              {isTeams && myTeam ? myTeam.name : "Sporcle MZ · Online"}
            </div>
          </div>
          <div className="timerPill" style={{ color: phase === "question" ? timerColor : undefined }}>
            {phase === "question" ? `${timeLeft}s` : "✓"}
          </div>
        </header>

        <main className="gameMain" style={{ gap: 10 }}>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
            {Array.from({ length: totalQ }, (_, i) => (
              <div key={i} style={{
                width: 32, height: 5, borderRadius: 99,
                background: i < qIdx ? "#7c5dfa" : i === qIdx ? "#00e5b0" : "rgba(255,255,255,.12)",
                transition: "background .3s",
              }} />
            ))}
          </div>

          {/* Timer bar */}
          {phase === "question" && (
            <div style={{ height: 3, background: "rgba(255,255,255,.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, width: `${timerPct}%`,
                background: timerColor, transition: "width 1s linear, background .4s",
              }} />
            </div>
          )}

          {/* Team progress bars (lista, equipas) */}
          {isTeams && isLista && phase === "question" && equipas.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {equipas.map(t => {
                const cnt = teamCounts[t.id] ?? 0;
                const pct = qTotal > 0 ? (cnt / qTotal) * 100 : 0;
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: t.color, width: 60, flexShrink: 0 }}>{t.name}</span>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.08)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: t.color, borderRadius: 99, transition: "width .4s" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", width: 30, textAlign: "right" }}>{cnt}/{qTotal}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Question card */}
          {question && (
            <div style={{
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 16, padding: "16px 14px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 6 }}>
                {isLista ? `📋 Lista — acerta ${qTotal}` : "❓ Resposta Curta"}
              </div>
              <div style={{ fontSize: "clamp(14px,3.5vw,18px)", fontWeight: 800, lineHeight: 1.4 }}>
                {question.pergunta}
              </div>

              {/* Lista answer slots */}
              {isLista && phase === "question" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                  {Array.from({ length: qTotal }, (_, i) => {
                    const filled = i < myCount;
                    return (
                      <div key={i} style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: filled ? "rgba(0,229,176,.18)" : "rgba(255,255,255,.06)",
                        border: `1.5px solid ${filled ? "rgba(0,229,176,.5)" : "rgba(255,255,255,.12)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13,
                      }}>
                        {filled ? "✓" : ""}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reveal: correct answers */}
              {isRevealing && question.respostas_aceites && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {question.respostas_aceites.map((grupo, i) => {
                    const acertadasSet = isTeams ? teamAcertadas : myAcertadas;
                    const gotIt = acertadasSet.has(`grupo_${i}`);
                    return (
                      <span key={i} style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: gotIt ? "rgba(0,200,100,.18)" : "rgba(255,255,255,.07)",
                        border: `1px solid ${gotIt ? "rgba(0,200,100,.4)" : "rgba(255,255,255,.12)"}`,
                        color: gotIt ? "#4ade80" : "rgba(255,255,255,.5)",
                      }}>
                        {gotIt ? "✓ " : ""}{grupo[0]}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Captain indicator (equipas, question phase) */}
          {isTeams && phase === "question" && myTeam && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
              background: `${myTeam.color}15`, border: `1px solid ${myTeam.color}40`,
              borderRadius: 10, fontSize: 12,
            }}>
              <span>👑</span>
              <span style={{ flex: 1, color: "rgba(255,255,255,.7)" }}>
                {isCaptain
                  ? <b style={{ color: myTeam.color }}>És o capitão — responde!</b>
                  : <span><b style={{ color: myTeam.color }}>{captain?.name ?? "?"}</b> está a responder</span>
                }
              </span>
            </div>
          )}

          {/* Answer counter */}
          {phase === "question" && (
            <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>
              {isLista
                ? isTeams
                  ? `${Object.values(teamCounts).reduce((a, b) => a + b, 0)} respostas da equipa`
                  : `${Object.values(playerCounts).reduce((a, b) => a + b, 0)} respostas enviadas`
                : isTeams
                  ? `${answeredShortTeamsCount} / ${equipas.length} equipas responderam`
                  : `${answeredShortCount} / ${playerCount} responderam`
              }
            </div>
          )}

          {/* Feedback banner */}
          {feedback && (
            <div style={{
              padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 800, textAlign: "center",
              background: { acerto: "rgba(0,200,100,.15)", quase: "rgba(251,191,36,.12)", erro: "rgba(220,50,50,.12)", duplicado: "rgba(100,100,100,.12)" }[feedback.tipo],
              border: `1px solid ${{ acerto: "rgba(0,200,100,.4)", quase: "rgba(251,191,36,.4)", erro: "rgba(220,50,50,.4)", duplicado: "rgba(100,100,100,.4)" }[feedback.tipo]}`,
              color: { acerto: "#4ade80", quase: "#fbbf24", erro: "#f87171", duplicado: "#9ca3af" }[feedback.tipo],
            }}>
              {feedback.msg}
            </div>
          )}

          {/* Input area */}
          {phase === "question" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  onPaste={handlePaste}
                  placeholder={
                    isTeams
                      ? isCaptain
                        ? isLista ? `Acerta ${qTotal - myCount} restante${qTotal - myCount !== 1 ? "s" : ""}…` : teamAnswered ? "A equipa já respondeu!" : "Escreve a resposta…"
                        : "Aguarda o capitão…"
                      : isLista
                        ? `Acerta ${qTotal - myCount} restante${qTotal - myCount !== 1 ? "s" : ""}…`
                        : answeredShort ? "Aguarda o próximo…" : "Escreve a resposta…"
                  }
                  disabled={isAnswerBlocked}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  aria-label="Campo de resposta"
                  className="niceInput"
                  style={{ flex: 1, fontSize: 16, opacity: isAnswerBlocked ? 0.45 : 1 }}
                />
                <button
                  onClick={submitAnswer}
                  type="button"
                  disabled={isAnswerBlocked}
                  aria-label="Enviar resposta"
                  style={{
                    background: "#7c5dfa", border: "none", borderRadius: 12,
                    padding: "0 18px", color: "#fff", fontWeight: 900, fontSize: 18,
                    cursor: isAnswerBlocked ? "not-allowed" : "pointer", flexShrink: 0,
                    opacity: isAnswerBlocked ? 0.4 : 1,
                  }}
                >↵</button>
              </div>

              {/* Pass phone button (captain, equipas, lista with teammates) */}
              {isTeams && isCaptain && teammates.length > 0 && (
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setPassPhoneOpen(v => !v)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 10, fontWeight: 700, fontSize: 12,
                      border: "1.5px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.05)",
                      color: "rgba(255,255,255,.6)", cursor: "pointer",
                    }}
                  >📲 Passar telemóvel</button>

                  {passPhoneOpen && (
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0,
                      background: "#1a1a2e", border: "1px solid rgba(255,255,255,.15)",
                      borderRadius: 12, padding: 8, zIndex: 10,
                      display: "flex", flexDirection: "column", gap: 4,
                    }}>
                      {teammates.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            socket.emit("game:command", { type: "PASS_PHONE", toPlayerId: m.id });
                            setPassPhoneOpen(false);
                          }}
                          style={{
                            padding: "8px 12px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                            border: "none", background: "rgba(255,255,255,.07)",
                            color: "#fff", cursor: "pointer", textAlign: "left",
                          }}
                        >📲 {m.name}</button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPassPhoneOpen(false)}
                        style={{
                          padding: "6px", borderRadius: 8, fontSize: 11,
                          border: "none", background: "transparent",
                          color: "rgba(255,255,255,.35)", cursor: "pointer",
                        }}
                      >Cancelar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Waiting messages */}
          {phase === "question" && !isLista && !isTeams && answeredShort && (
            <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.45)" }}>
              ✓ Resposta enviada · aguarda os outros…
            </div>
          )}
          {phase === "question" && !isLista && isTeams && !isCaptain && (
            <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.45)" }}>
              Aguarda o capitão da tua equipa responder…
            </div>
          )}
          {phase === "question" && !isLista && isTeams && isCaptain && teamAnswered && (
            <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.45)" }}>
              ✓ Equipa respondeu · aguarda as outras…
            </div>
          )}

          {/* Mini leaderboard during reveal */}
          {phase === "reveal" && (
            <div style={{ marginTop: "auto", paddingTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
                {isTeams ? "Equipas" : "Pontuação"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {isTeams
                  ? teamRanking.map((t, i) => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: t.id === myTeamId ? 1 : 0.65 }}>
                        <span style={{ width: 20, fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.4)" }}>{i + 1}º</span>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: t.color }}>{t.name}</span>
                        <span style={{ fontWeight: 900, color: "#00e5b0", fontSize: 13 }}>{t.score} pts</span>
                      </div>
                    ))
                  : scores.slice(0, 5).map((s, i) => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: s.id === socket.id ? 1 : 0.65 }}>
                        <span style={{ width: 20, fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.4)" }}>{i + 1}º</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{s.name}{s.id === socket.id ? " (tu)" : ""}</span>
                        <span style={{ fontWeight: 900, color: "#00e5b0", fontSize: 13 }}>{s.score} pts</span>
                      </div>
                    ))
                }
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
