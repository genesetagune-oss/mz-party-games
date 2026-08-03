import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { playSound } from "../utils/sound";

const DIFF_LABEL = { facil: "😌 Fácil", media: "🤔 Média", dificil: "🔥 Difícil" };
const DIFF_DESC  = {
  facil:   "Pergunta de resposta curta",
  media:   "Lista pequena (até 4 respostas)",
  dificil: "Lista grande (5+ respostas)",
};

const PLAYER_COLORS = [
  "#7c5dfa","#00D4B4","#f97316","#ef4444","#3b82f6",
  "#a855f7","#10b981","#f59e0b","#ec4899","#06b6d4",
  "#84cc16","#6366f1","#14b8a6","#fb923c","#f43f5e",
  "#8b5cf6","#22c55e","#eab308","#0ea5e9","#d946ef",
];

export default function SporcleMZOnline({ onBack, room, roomCode, gamePublic, gamePrivate, onSwitchGame }) {
  const me          = room?.players?.find(p => p.id === socket.id);
  const isHost      = !!me?.isHost;
  const playerCount = (room?.players ?? []).filter(p => p.connected !== false).length;

  const phase          = gamePublic?.phase           ?? "lobby";
  const qIdx           = gamePublic?.qIdx            ?? 0;
  const totalQ         = gamePublic?.totalQ          ?? 11;
  const timeLeft       = gamePublic?.timeLeft        ?? 0;
  const wagerTimer     = gamePublic?.wagerTimer      ?? 0;
  const voteTimer      = gamePublic?.voteTimer       ?? 0;
  const wagersIn       = gamePublic?.wagersIn        ?? 0;
  const totalWagerers  = gamePublic?.totalWagerers   ?? 0;
  const finalVoteCount = gamePublic?.finalVoteCount  ?? 0;
  const finalDifficulty = gamePublic?.finalDifficulty ?? null;
  const isFinalRound   = gamePublic?.isFinalRound    ?? false;
  const wagerResults   = gamePublic?.wagerResults    ?? null;
  const scores         = gamePublic?.scores          ?? [];
  const question       = gamePublic?.question        ?? null;
  const playerCounts   = gamePublic?.playerCounts    ?? {};
  const answeredShortCount = gamePublic?.answeredShortCount ?? 0;

  const myAcertadas   = new Set(gamePrivate?.myAcertadas  ?? []);
  const answeredShort = gamePrivate?.answeredShort ?? false;
  const myWager       = gamePrivate?.myWager       ?? null;
  const myWagersUsed  = gamePrivate?.myWagersUsed  ?? [];
  const myVote        = gamePrivate?.myVote        ?? null;
  const wagerMode     = !!gamePublic?.wagerMode;

  const [input, setInput]       = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef(null);
  const fbTimRef = useRef(null);

  const leaveToMenu = () => { socket.emit("room:leave"); onBack?.(); };

  const timerPct   = question ? (timeLeft / question.tempo) * 100 : 0;
  const timerColor = timeLeft > (question?.tempo ?? 15) * 0.5
    ? "#00e5b0" : timeLeft > (question?.tempo ?? 15) * 0.2
    ? "#f97316" : "#ef4444";

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
        if (evt.resultado === "acerto") playSound("correct");
        else if (evt.resultado === "erro") playSound("wrong");
      }
    };
    socket.on("game:event", handle);
    return () => socket.off("game:event", handle);
  }, []);

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

  const roundLabel = isFinalRound ? "Ronda Final 🏆" : `Ronda ${qIdx + 1} / ${totalQ}`;

  // ── LOBBY ─────────────────────────────────────────────────
  if (phase === "lobby") {
    const canStart = playerCount >= 2;
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ</div>
              <div style={{ opacity: .6, fontSize: 11, marginTop: 2 }}>
                Sala: <b>{roomCode}</b> · {playerCount} jogador{playerCount !== 1 ? "es" : ""}
              </div>
            </div>
            <button onClick={() => setShowSettings(s => !s)} type="button"
              style={{ background: showSettings ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${showSettings ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.13)"}`, borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 16, cursor: "pointer" }}>
              ⚙️
            </button>
          </header>

          <main className="gameMain" style={{ gap: 14 }}>
            {showSettings && (
              <div style={{
                background: "linear-gradient(180deg, rgba(20,22,36,0.94) 0%, rgba(14,16,28,0.94) 100%)",
                border: "1px solid rgba(124,93,250,0.28)",
                borderRadius: 18, padding: "16px 16px 14px", marginBottom: 4,
                boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 22 }}>⚙️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 15 }}>Definições</div>
                    <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 600 }}>
                      {isHost ? "Configura a partida" : "O host controla estas definições"}
                    </div>
                  </div>
                </div>
                <div style={{ opacity: (!isHost) ? 0.6 : 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>Modo apostas</div>
                  <div style={{ fontSize: 11.5, opacity: 0.55, marginBottom: 10, lineHeight: 1.45 }}>
                    Aposta pontos antes de cada pergunta. Certo = ganhas a aposta · errado = perdes.
                    Sem apostas, cada resposta certa vale 1 ponto.
                  </div>
                  <label style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12, padding: "8px 12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, cursor: isHost ? "pointer" : "not-allowed",
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: wagerMode ? "#fff" : "rgba(234,236,244,0.6)" }}>
                      {wagerMode ? "Activado" : "Desactivado"}
                    </span>
                    <span
                      role="switch" aria-checked={wagerMode}
                      onClick={(e) => { e.preventDefault(); if (isHost) socket.emit("game:setSettings", { wagerMode: !wagerMode }); }}
                      style={{
                        position: "relative", width: 44, height: 24, borderRadius: 999,
                        background: wagerMode ? "linear-gradient(135deg,#00D4B4,#7c5dfa)" : "rgba(255,255,255,0.12)",
                        border: `1px solid ${wagerMode ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)"}`,
                        transition: "background 180ms ease",
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 2, left: wagerMode ? 22 : 2,
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                        transition: "left 180ms ease",
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            )}
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
              <div style={{ fontSize: 11, opacity: .50, marginTop: 6 }}>Toca para partilhar</div>
            </button>

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
                JOGADORES {playerCount}/20
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(room?.players ?? []).map((p, i) => {
                  const color   = PLAYER_COLORS[i % PLAYER_COLORS.length];
                  const initial = (p.name || "?")[0].toUpperCase();
                  const isMe    = p.id === socket.id;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,.04)", borderRadius: 12, border: `1px solid ${isMe ? "rgba(255,255,255,.12)" : "transparent"}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color, flexShrink: 0 }}>
                        {initial}
                      </div>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{p.name}{isMe ? " (tu)" : ""}</span>
                      {p.isHost && <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".06em", color: "#7c5dfa", background: "rgba(124,93,250,.15)", border: "1px solid rgba(124,93,250,.4)", borderRadius: 6, padding: "2px 7px" }}>HOST</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
              {isHost ? (
                <>
                  <button className="btnPrimary" disabled={!canStart} onClick={() => socket.emit("game:start")} type="button" style={{ width: "100%", opacity: canStart ? 1 : 0.55 }}>
                    {canStart ? "▶ Começar Jogo" : "Aguarda mais jogadores…"}
                  </button>
                  {!canStart && (
                    <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                      Falta {2 - playerCount} jogador{2 - playerCount !== 1 ? "es" : ""} para começar
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", textAlign: "center" }}>Aguardando o host iniciar…</div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── WAGER PHASE ───────────────────────────────────────────
  if (phase === "wager" || phase === "finalWager") {
    const isFinal = phase === "finalWager";
    const options = isFinal ? [0, 10, 20] : [1,2,3,4,5,6,7,8,9,10];

    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ</div>
              <div style={{ opacity: .6, fontSize: 11, marginTop: 2 }}>{roundLabel}</div>
            </div>
            <div className="timerPill" style={{ color: wagerTimer <= 3 ? "#ef4444" : "#f97316" }}>{wagerTimer}s</div>
          </header>

          <main className="gameMain" style={{ gap: 16 }}>
            <div style={{ textAlign: "center", paddingTop: 4 }}>
              <div style={{ fontSize: 28 }}>💰</div>
              <div style={{ fontWeight: 900, fontSize: 20, marginTop: 6 }}>
                {isFinal ? "Aposta final!" : "Aposta os teus pontos"}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                {isFinal ? "Escolhe 0, 10 ou 20 pontos" : "Cada valor só pode ser usado uma vez por jogo"}
              </div>
            </div>

            {myWager !== null ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: "#00e5b0", lineHeight: 1 }}>{myWager}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.45)", marginTop: 8 }}>pontos apostados ✓</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 4 }}>A aguardar os outros…</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isFinal ? "repeat(3,1fr)" : "repeat(5,1fr)", gap: 8 }}>
                {options.map(v => {
                  const used = !isFinal && myWagersUsed.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={used}
                      onClick={() => socket.emit("game:command", { type: "WAGER", value: v })}
                      style={{
                        padding: isFinal ? "18px 0" : "14px 0",
                        borderRadius: 12, fontWeight: 900,
                        fontSize: isFinal ? 22 : 18,
                        border: used ? "1.5px solid rgba(255,255,255,.08)" : "1.5px solid rgba(124,93,250,.5)",
                        background: used ? "rgba(255,255,255,.03)" : "rgba(124,93,250,.15)",
                        color: used ? "rgba(255,255,255,.18)" : "#fff",
                        cursor: used ? "not-allowed" : "pointer",
                        textDecoration: used ? "line-through" : "none",
                        transition: "background .15s",
                      }}
                    >{v}</button>
                  );
                })}
              </div>
            )}

            <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.35)" }}>
              {wagersIn} / {totalWagerers} jogadores prontos
            </div>

            <div style={{ marginTop: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 6 }}>Pontuação</div>
              {scores.slice(0, 5).map((s, i) => {
                const isMe = s.id === socket.id;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, opacity: isMe ? 1 : 0.6 }}>
                    <span style={{ width: 20, fontSize: 11, color: "rgba(255,255,255,.4)" }}>{i + 1}º</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{s.name}{isMe ? " (tu)" : ""}</span>
                    <span style={{ fontWeight: 900, color: s.score < 0 ? "#ef4444" : "#00e5b0", fontSize: 13 }}>{s.score > 0 ? "+" : ""}{s.score}</span>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── FINAL VOTE ────────────────────────────────────────────
  if (phase === "finalVote") {
    if (finalDifficulty) {
      return (
        <div className="appBg">
          <div className="shell shellGame" style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 64 }}>{{ facil: "😌", media: "🤔", dificil: "🔥" }[finalDifficulty]}</div>
              <div style={{ fontWeight: 900, fontSize: 26, marginTop: 16 }}>
                {{ facil: "Fácil!", media: "Média!", dificil: "Difícil!" }[finalDifficulty]}
              </div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 14, marginTop: 8 }}>A preparar a ronda final…</div>
            </div>
          </div>
        </div>
      );
    }

    const diffOptions = [
      { key: "facil",   label: DIFF_LABEL.facil,   desc: DIFF_DESC.facil },
      { key: "media",   label: DIFF_LABEL.media,   desc: DIFF_DESC.media },
      { key: "dificil", label: DIFF_LABEL.dificil, desc: DIFF_DESC.dificil },
    ];

    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">🏆 Ronda Final!</div>
            </div>
            <div className="timerPill" style={{ color: voteTimer <= 5 ? "#ef4444" : "#f97316" }}>{voteTimer}s</div>
          </header>

          <main className="gameMain" style={{ gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>🗳️</div>
              <div style={{ fontWeight: 900, fontSize: 20, marginTop: 8 }}>Escolhe a dificuldade!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                A maioria decide · {finalVoteCount} / {playerCount} votaram
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {diffOptions.map(opt => {
                const voted = myVote === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={myVote !== null}
                    onClick={() => socket.emit("game:command", { type: "VOTE_DIFFICULTY", vote: opt.key })}
                    style={{
                      padding: "16px 20px", borderRadius: 14, textAlign: "left",
                      cursor: myVote ? "default" : "pointer",
                      border: voted ? "2px solid #7c5dfa" : "1.5px solid rgba(255,255,255,.1)",
                      background: voted ? "rgba(124,93,250,.2)" : "rgba(255,255,255,.04)",
                      color: "#eaeaf4", opacity: myVote && !voted ? 0.45 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{opt.label} {voted ? "✓" : ""}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 2 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>

            {myVote && (
              <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.45)" }}>
                Votaste! A aguardar os outros…
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────
  if (phase === "finished") {
    const winner = scores[0];
    const myRank = scores.findIndex(s => s.id === socket.id);
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
                    borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}</span>
                    <span style={{ flex: 1, fontWeight: 700 }}>{s.name}{isMe ? " (tu)" : ""}</span>
                    <span style={{ fontWeight: 900, fontSize: 18, color: s.score < 0 ? "#ef4444" : "#00e5b0" }}>{s.score > 0 ? "+" : ""}{s.score} pts</span>
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
  const isLista     = question?.tipo === "lista";
  const qTotal      = question?.total ?? 0;
  const myCount     = myAcertadas.size;
  const isRevealing = phase === "reveal";

  const isAnswerBlocked = question?.tipo === "resposta_curta" && answeredShort;

  function submitAnswer() {
    if (!input.trim() || phase !== "question" || isAnswerBlocked) return;
    socket.emit("game:command", { type: "ANSWER", answer: input.trim() });
    if (question?.tipo === "resposta_curta") setInput("");
  }

  const handleKey   = (e) => { if (e.key === "Enter") { e.preventDefault(); submitAnswer(); } };
  const handlePaste = (e) => e.preventDefault();

  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Sporcle MZ · Online</div>
            <div style={{ opacity: .6, fontSize: 11, marginTop: 2 }}>{roundLabel}</div>
          </div>
          <div className="timerPill" style={{ color: phase === "question" ? timerColor : undefined }}>
            {phase === "question" ? `${timeLeft}s` : "✓"}
          </div>
        </header>

        <main className="gameMain" style={{ gap: 10 }}>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
            {Array.from({ length: totalQ }, (_, i) => {
              const isCurrent = isFinalRound ? i === totalQ - 1 : i === qIdx;
              const isDone    = isFinalRound ? i < totalQ - 1 : i < qIdx;
              return (
                <div key={i} style={{
                  width: i === totalQ - 1 ? 20 : 14, height: 5, borderRadius: 99,
                  background: isDone ? "#7c5dfa" : isCurrent ? "#00e5b0" : "rgba(255,255,255,.12)",
                  transition: "background .3s",
                }} />
              );
            })}
          </div>

          {/* Timer bar */}
          {phase === "question" && (
            <div style={{ height: 3, background: "rgba(255,255,255,.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, width: `${timerPct}%`, background: timerColor, transition: "width 1s linear, background .4s" }} />
            </div>
          )}

          {/* Question card */}
          {question && (
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "16px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 6 }}>
                {isFinalRound ? "🏆 Ronda Final" : isLista ? `📋 Lista — acerta ${qTotal}` : "❓ Resposta Curta"}
              </div>
              <div style={{ fontSize: "clamp(14px,3.5vw,18px)", fontWeight: 800, lineHeight: 1.4 }}>{question.pergunta}</div>

              {isLista && phase === "question" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                  {Array.from({ length: qTotal }, (_, i) => {
                    const filled = i < myCount;
                    return (
                      <div key={i} style={{ width: 28, height: 28, borderRadius: 7, background: filled ? "rgba(0,229,176,.18)" : "rgba(255,255,255,.06)", border: `1.5px solid ${filled ? "rgba(0,229,176,.5)" : "rgba(255,255,255,.12)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                        {filled ? "✓" : ""}
                      </div>
                    );
                  })}
                </div>
              )}

              {isRevealing && question.respostas_aceites && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {question.respostas_aceites.map((grupo, i) => {
                    const gotIt = myAcertadas.has(`grupo_${i}`);
                    return (
                      <span key={i} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: gotIt ? "rgba(0,200,100,.18)" : "rgba(255,255,255,.07)", border: `1px solid ${gotIt ? "rgba(0,200,100,.4)" : "rgba(255,255,255,.12)"}`, color: gotIt ? "#4ade80" : "rgba(255,255,255,.5)" }}>
                        {gotIt ? "✓ " : ""}{grupo[0]}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Answer counter */}
          {phase === "question" && (
            <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>
              {isLista
                ? `${Object.values(playerCounts).reduce((a, b) => a + b, 0)} respostas enviadas`
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
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                onPaste={handlePaste}
                placeholder={
                  isLista
                    ? `Acerta ${qTotal - myCount} restante${qTotal - myCount !== 1 ? "s" : ""}…`
                    : answeredShort ? "Aguarda o próximo…" : "Escreve a resposta…"
                }
                disabled={isAnswerBlocked}
                autoComplete="off" autoCorrect="off" spellCheck={false} inputMode="text"
                aria-label="Campo de resposta"
                className="niceInput"
                style={{ flex: 1, fontSize: 16, opacity: isAnswerBlocked ? 0.45 : 1 }}
              />
              <button onClick={submitAnswer} type="button" disabled={isAnswerBlocked} aria-label="Enviar resposta"
                style={{ background: "#7c5dfa", border: "none", borderRadius: 12, padding: "0 18px", color: "#fff", fontWeight: 900, fontSize: 18, cursor: isAnswerBlocked ? "not-allowed" : "pointer", flexShrink: 0, opacity: isAnswerBlocked ? 0.4 : 1 }}>↵</button>
            </div>
          )}

          {phase === "question" && !isLista && answeredShort && (
            <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.45)" }}>✓ Resposta enviada · aguarda os outros…</div>
          )}

          {/* Reveal leaderboard */}
          {phase === "reveal" && (
            <div style={{ marginTop: "auto", paddingTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
                Pontuação
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {scores.slice(0, 5).map((s, i) => {
                  const wr    = wagerResults?.[s.id];
                  const isMe  = s.id === socket.id;
                  const deltaColor = !wr ? "#00e5b0" : wr.delta > 0 ? "#4ade80" : wr.delta < 0 ? "#f87171" : "rgba(255,255,255,.4)";
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: isMe ? 1 : 0.65 }}>
                      <span style={{ width: 20, fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.4)" }}>{i + 1}º</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{s.name}{isMe ? " (tu)" : ""}</span>
                      {wr && <span style={{ fontSize: 11, color: deltaColor, fontWeight: 800 }}>{wr.delta > 0 ? "+" : ""}{wr.delta}</span>}
                      <span style={{ fontWeight: 900, color: s.score < 0 ? "#ef4444" : "#00e5b0", fontSize: 13 }}>{s.score > 0 ? "+" : ""}{s.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
