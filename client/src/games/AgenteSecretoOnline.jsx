import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { impostorCount } from "../../games/agenteSecretoDB.js";
import { playSound } from "../utils/sound";

const PHASE_LABEL = {
  lobby:  "Lobby",
  reveal: "A revelar palavras",
  clue1:  "Ronda de dicas 1/2",
  clue2:  "Ronda de dicas 2/2",
  clue3:  "Desempate — nova dica",
  chat:   "Discussão",
  vote:   "Votação",
  result: "Resultado",
};

const AVATAR_COLORS = [
  "#7c5dfa","#00D4B4","#f97316","#ef4444","#3b82f6",
  "#a855f7","#10b981","#f59e0b","#ec4899","#06b6d4",
  "#84cc16","#6366f1","#14b8a6","#fb923c","#f43f5e",
  "#8b5cf6","#22c55e","#eab308","#0ea5e9","#d946ef",
];
function colorFor(name = "") { return AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length]; }

function Avatar({ name, size = 30, dim }) {
  const c = colorFor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${c}${dim ? "18" : "22"}`, border: `2px solid ${c}${dim ? "33" : "55"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 900, color: c, flexShrink: 0,
      opacity: dim ? 0.5 : 1,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
      textTransform: "uppercase", color: "rgba(234,236,244,0.5)",
      marginBottom: 8, paddingLeft: 2,
    }}>{children}</div>
  );
}

export default function AgenteSecretoOnline({ onBack, room, roomCode, gamePublic, gamePrivate }) {
  const me          = room?.players?.find(p => p.id === socket.id) || null;
  const isHost      = !!me?.isHost;
  const players     = gamePublic?.players ?? [];
  const playerCount = players.filter(p => p.connected).length;
  const phase       = gamePublic?.phase ?? "lobby";
  const remaining   = Math.ceil((gamePublic?.remainingMs ?? 0) / 1000);
  const minPlayers  = gamePublic?.minPlayers ?? 3;
  const maxPlayers  = gamePublic?.maxPlayers ?? 20;
  const chat        = gamePublic?.chat ?? [];
  const publicClues = gamePublic?.publicClues ?? { 1: null, 2: null, 3: null };
  const votes       = gamePublic?.votes ?? {};
  const tieBreak    = !!gamePublic?.tieBreak;
  const result      = gamePublic?.result ?? null;
  const revealedTrio = gamePublic?.trio ?? null;

  const word     = gamePrivate?.word ?? null;
  const myClues  = gamePrivate?.myClues ?? { 1: null, 2: null, 3: null };
  const myVote   = gamePrivate?.myVote ?? null;
  const wasImpostor = !!gamePrivate?.wasImpostor;

  const currentRound =
    phase === "clue1" ? 1 :
    phase === "clue2" ? 2 :
    phase === "clue3" ? 3 : null;

  const [clueDraft,  setClueDraft]  = useState("");
  const [chatDraft,  setChatDraft]  = useState("");
  const [shareFb,    setShareFb]    = useState("");
  const [showRules,  setShowRules]  = useState(false);
  const chatBoxRef = useRef(null);

  // Auto-scroll chat to latest message.
  useEffect(() => {
    if (!chatBoxRef.current) return;
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chat.length]);

  // Clear the clue draft whenever the round advances so the input isn't stale.
  useEffect(() => { setClueDraft(""); }, [phase]);

  // Result chime — separate cue for group win vs impostors escaping.
  // Skips other events (chat pops etc. left out on purpose to avoid noise).
  useEffect(() => {
    const handle = (evt) => {
      if (evt?.type !== "RESULT") return;
      playSound(evt.winner === "group" ? "win" : "lose");
    };
    socket.on("game:event", handle);
    return () => socket.off("game:event", handle);
  }, []);

  const leaveToMenu = () => { socket.emit("room:leave"); onBack?.(); };
  const startGame   = () => socket.emit("game:start");
  const advance     = () => socket.emit("game:command", { type: "ADVANCE_PHASE" });
  const submitClue  = () => {
    const text = clueDraft.trim();
    if (!text) return;
    socket.emit("game:command", { type: "SUBMIT_CLUE", text });
    setClueDraft("");
  };
  const sendChat = () => {
    const text = chatDraft.trim();
    if (!text) return;
    socket.emit("game:command", { type: "SEND_CHAT", text });
    setChatDraft("");
  };
  const castVote = (targetId) => {
    if (!targetId || targetId === socket.id) return;
    socket.emit("game:command", { type: "VOTE", target: targetId });
  };
  const restart = () => socket.emit("game:restart");
  const handleShare = async () => {
    const url = `https://mz-party-games.onrender.com/?join=${roomCode}`;
    const text = `🕵️ Joga Agente Secreto comigo no MZ Party Games!\nEntra directo → ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "MZ Party Games", text, url }); setShareFb("Partilhado! ✓"); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setShareFb("Copiado! ✓"); } catch {}
    }
    setTimeout(() => setShareFb(""), 2500);
  };

  const myClue = currentRound ? myClues[currentRound] : null;
  const canSubmit = currentRound && !myClue;
  const projectedImpostors = impostorCount(Math.max(playerCount, 3));

  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">🕵️ Agente Secreto</div>
            <div style={{ opacity: 0.6, marginTop: 2, fontSize: 11 }}>
              Sala: <b>{roomCode || "-"}</b> · {playerCount} jogador{playerCount !== 1 ? "es" : ""} · {PHASE_LABEL[phase] || phase}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setShowRules(r => !r)} type="button"
              style={{ background: showRules ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${showRules ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.13)"}`, borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 16, cursor: "pointer" }}>
              ❓
            </button>
            {phase !== "lobby" && phase !== "result" && (
              <div className="timerPill">{remaining}s</div>
            )}
          </div>
        </header>

        <main className="gameMain">

          {showRules && (
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>📖 Como Jogar</div>
              {[
                "Todos recebem a MESMA palavra secreta — excepto o(s) impostor(es), que recebem outra parecida.",
                "O impostor não sabe que é impostor. Pensa que tem a palavra certa.",
                "2 rondas de dicas: cada jogador dá 1 dica sobre a sua palavra (sem dizê-la).",
                "Depois há chat para discutirem quem é o impostor.",
                "Votação: se o grupo apanhar o impostor, ganha o grupo. Caso contrário, o impostor ganha.",
                "Empate na votação → mais uma ronda de dicas + nova votação.",
              ].map((r, i) => (
                <div key={i} style={{ fontSize: 13, opacity: 0.85, marginBottom: 6, paddingLeft: 4 }}>
                  <span style={{ opacity: 0.5, marginRight: 6 }}>{i + 1}.</span>{r}
                </div>
              ))}
            </div>
          )}

          {/* LOBBY ─────────────────────────────────────── */}
          {phase === "lobby" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 }}>
              <button className="lobbyCodeCard" onClick={handleShare} type="button">
                <div className="lobbyCodeLabel">{shareFb || "SHARE CODE"}</div>
                <div className="lobbyCodeRow">
                  <div className="lobbyCodeValue">{(roomCode || "").match(/.{1,3}/g)?.join(" ")}</div>
                  <div className="lobbyShareBtn">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>Toca para partilhar · WhatsApp, Instagram, SMS…</div>
              </button>

              <div style={{
                background: "linear-gradient(160deg,#141628,#0e101c)",
                border: "1px solid rgba(124,93,250,0.28)",
                borderRadius: 18, padding: 16,
                boxShadow: "0 8px 26px rgba(0,0,0,0.28)",
              }}>
                <SectionHeader>Jogadores · {playerCount}/{maxPlayers}</SectionHeader>
                <div style={{ display: "grid", gap: 8 }}>
                  {players.map(p => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      opacity: p.connected ? 1 : 0.55,
                    }}>
                      <Avatar name={p.name} dim={!p.connected} />
                      <div style={{ flex: 1, fontWeight: 700 }}>
                        {p.name}
                        {p.id === socket.id && <span style={{ opacity: 0.45, fontWeight: 600 }}> (tu)</span>}
                      </div>
                      {!p.connected && <span style={{ fontSize: 11, opacity: 0.5 }}>offline</span>}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.55, marginTop: 12, lineHeight: 1.5 }}>
                  {playerCount >= minPlayers
                    ? `Com ${playerCount} jogadores → ${projectedImpostors} impostor${projectedImpostors > 1 ? "es" : ""}.`
                    : `Precisas de pelo menos ${minPlayers} jogadores para começar.`}
                </div>
              </div>

              {result && (
                <div style={{
                  background: result.winner === "group" ? "rgba(0,212,180,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${result.winner === "group" ? "rgba(0,212,180,0.4)" : "rgba(239,68,68,0.4)"}`,
                  borderRadius: 14, padding: "10px 14px", fontSize: 13, opacity: 0.9,
                }}>
                  Última ronda: <b>{result.winner === "group" ? "grupo ganhou 🏆" : "impostor(es) escaparam 🕵️"}</b>
                </div>
              )}

              {isHost ? (
                <button type="button" className="btnPrimary"
                  disabled={playerCount < minPlayers} onClick={startGame}>
                  {playerCount < minPlayers
                    ? `Aguarda mais ${minPlayers - playerCount} jogador…`
                    : "▶ Começar"}
                </button>
              ) : (
                <div style={{ textAlign: "center", opacity: 0.65, padding: "10px 0", fontWeight: 700 }}>
                  Aguardando o host iniciar…
                </div>
              )}
            </div>
          )}

          {/* REVEAL ────────────────────────────────────── */}
          {phase === "reveal" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "10px 0 20px" }}>
              <SectionHeader>A tua palavra secreta</SectionHeader>
              <div style={{
                width: "100%", maxWidth: 380,
                background: "linear-gradient(160deg,#151a30,#0d1120)",
                border: "2px solid rgba(124,93,250,0.5)",
                borderRadius: 22, padding: "28px 20px",
                textAlign: "center",
                boxShadow: "0 12px 34px rgba(124,93,250,0.25)",
              }}>
                <div style={{ fontSize: 12, opacity: 0.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                  Memoriza — os outros não vão ver
                </div>
                <div style={{
                  fontSize: "clamp(38px, 9vw, 72px)", fontWeight: 950, color: "#fff",
                  letterSpacing: -0.5, lineHeight: 1.1,
                  textShadow: "0 4px 22px rgba(124,93,250,0.35)",
                }}>
                  {word ?? "…"}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, opacity: 0.55 }}>
                  Nas dicas, descreve a tua palavra <b>sem a dizer</b>.
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.55 }}>Começa em <b>{remaining}s</b>…</div>
            </div>
          )}

          {/* CLUE ROUNDS ──────────────────────────────── */}
          {(phase === "clue1" || phase === "clue2" || phase === "clue3") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 12 }}>
              <div style={{
                background: "linear-gradient(160deg,#141a30,#0d1120)",
                border: "1px solid rgba(124,93,250,0.32)",
                borderRadius: 16, padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.55, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>A tua palavra</div>
                  <div style={{ fontSize: 22, fontWeight: 950, lineHeight: 1.1 }}>{word ?? "?"}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, opacity: 0.55 }}>
                  {phase === "clue3" ? "Desempate" : `Ronda ${currentRound}/2`}<br />
                  <b style={{ fontSize: 14, color: "#fff" }}>{remaining}s</b>
                </div>
              </div>

              {myClue ? (
                <div style={{
                  background: "rgba(0,212,180,0.10)",
                  border: "1px solid rgba(0,212,180,0.35)",
                  borderRadius: 14, padding: "12px 14px",
                }}>
                  <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 800, marginBottom: 4 }}>✓ Dica enviada</div>
                  <div style={{ fontWeight: 700 }}>{myClue}</div>
                  <div style={{ fontSize: 11, opacity: 0.55, marginTop: 6 }}>A aguardar os outros…</div>
                </div>
              ) : (
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14, padding: "12px 14px",
                }}>
                  <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 800, marginBottom: 8 }}>
                    Escreve UMA dica sobre a tua palavra (sem a dizer)
                  </div>
                  <input
                    value={clueDraft}
                    onChange={e => setClueDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") submitClue(); }}
                    maxLength={60}
                    placeholder="ex: bebe-se gelada"
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.14)",
                      color: "#fff", fontSize: 15, outline: "none",
                    }}
                  />
                  <button type="button" onClick={submitClue}
                    disabled={!clueDraft.trim()}
                    style={{
                      marginTop: 10, width: "100%",
                      padding: "10px 14px", borderRadius: 10,
                      background: clueDraft.trim() ? "linear-gradient(135deg,#00D4B4,#7c5dfa)" : "rgba(255,255,255,0.06)",
                      color: "#fff", fontWeight: 900, border: "none",
                      cursor: clueDraft.trim() ? "pointer" : "not-allowed",
                      opacity: clueDraft.trim() ? 1 : 0.55,
                    }}>
                    Enviar dica
                  </button>
                </div>
              )}

              <div>
                <SectionHeader>Estado dos jogadores</SectionHeader>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {players.map(p => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 10px", borderRadius: 999,
                      background: p.submittedClue ? "rgba(0,212,180,0.15)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${p.submittedClue ? "rgba(0,212,180,0.35)" : "rgba(255,255,255,0.1)"}`,
                      fontSize: 12, fontWeight: 700, opacity: p.connected ? 1 : 0.5,
                    }}>
                      <Avatar name={p.name} size={18} dim={!p.connected} />
                      {p.name}
                      {p.submittedClue && <span style={{ color: "#00D4B4" }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              {publicClues[1] && (
                <CluePanel title="Ronda 1" clues={publicClues[1]} />
              )}
              {publicClues[2] && (
                <CluePanel title="Ronda 2" clues={publicClues[2]} />
              )}

              {isHost && (
                <button type="button" onClick={advance}
                  style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(234,236,244,0.65)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  ⏭ Saltar ronda (host)
                </button>
              )}
            </div>
          )}

          {/* CHAT ─────────────────────────────────────── */}
          {phase === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 }}>
              <div style={{
                background: "linear-gradient(160deg,#141a30,#0d1120)",
                border: "1px solid rgba(124,93,250,0.32)",
                borderRadius: 16, padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.55, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>A tua palavra</div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>{word ?? "?"}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, opacity: 0.55 }}>Discussão<br /><b style={{ fontSize: 14, color: "#fff" }}>{remaining}s</b></div>
              </div>

              <CluePanel title="Ronda 1" clues={publicClues[1] || []} />
              <CluePanel title="Ronda 2" clues={publicClues[2] || []} />

              <ChatBox
                chat={chat}
                chatBoxRef={chatBoxRef}
                draft={chatDraft}
                setDraft={setChatDraft}
                onSend={sendChat}
              />

              {isHost && (
                <button type="button" onClick={advance}
                  style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(234,236,244,0.65)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  ⏭ Ir para votação (host)
                </button>
              )}
            </div>
          )}

          {/* VOTE ─────────────────────────────────────── */}
          {phase === "vote" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 }}>
              <div style={{
                background: tieBreak ? "rgba(245,158,11,0.15)" : "linear-gradient(160deg,#141a30,#0d1120)",
                border: `1px solid ${tieBreak ? "rgba(245,158,11,0.4)" : "rgba(124,93,250,0.32)"}`,
                borderRadius: 16, padding: "12px 14px", textAlign: "center",
              }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.65 }}>
                  {tieBreak ? "⚖ Votação de desempate" : "Vota no impostor"}
                </div>
                <div style={{ fontSize: 22, fontWeight: 950, marginTop: 4 }}>{remaining}s</div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {players.filter(p => p.id !== socket.id).map(p => {
                  const selected = myVote === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => castVote(p.id)}
                      disabled={!p.connected}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px",
                        background: selected ? "linear-gradient(135deg,rgba(0,212,180,0.28),rgba(124,93,250,0.28))" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${selected ? "rgba(0,212,180,0.7)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 12, cursor: p.connected ? "pointer" : "not-allowed",
                        color: "#fff", textAlign: "left",
                        opacity: p.connected ? 1 : 0.5,
                      }}>
                      <Avatar name={p.name} dim={!p.connected} />
                      <div style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                      {p.voted && <span style={{ fontSize: 11, opacity: 0.5 }}>votou</span>}
                      {selected && <span style={{ color: "#00D4B4", fontWeight: 900 }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              <ChatBox
                chat={chat}
                chatBoxRef={chatBoxRef}
                draft={chatDraft}
                setDraft={setChatDraft}
                onSend={sendChat}
                compact
              />
            </div>
          )}

          {/* RESULT ───────────────────────────────────── */}
          {phase === "result" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 12 }}>
              <ResultCard
                result={result}
                revealedTrio={revealedTrio}
                players={players}
                mePlayerId={socket.id}
                wasImpostor={wasImpostor}
              />
              <CluePanel title="Ronda 1" clues={publicClues[1] || []} />
              <CluePanel title="Ronda 2" clues={publicClues[2] || []} />
              {publicClues[3] && <CluePanel title="Desempate" clues={publicClues[3]} />}
              {isHost && (
                <button type="button" className="btnPrimary" onClick={restart}>
                  🔄 Nova ronda
                </button>
              )}
              {!isHost && (
                <div style={{ textAlign: "center", opacity: 0.6, fontSize: 13, padding: "10px 0" }}>
                  Aguardando o host começar nova ronda…
                </div>
              )}
              <ChatBox
                chat={chat}
                chatBoxRef={chatBoxRef}
                draft={chatDraft}
                setDraft={setChatDraft}
                onSend={sendChat}
                compact
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CluePanel({ title, clues }) {
  if (!clues || !clues.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14, padding: "10px 12px",
    }}>
      <SectionHeader>{title}</SectionHeader>
      <div style={{ display: "grid", gap: 6 }}>
        {clues.map(c => (
          <div key={c.playerId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={c.name} size={22} />
            <div style={{ flex: 1, fontSize: 13.5 }}>
              <b style={{ opacity: 0.7 }}>{c.name}:</b> {c.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatBox({ chat, chatBoxRef, draft, setDraft, onSend, compact }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14, padding: "10px 12px",
    }}>
      <SectionHeader>Chat da mesa</SectionHeader>
      <div ref={chatBoxRef} style={{
        maxHeight: compact ? 140 : 220, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 6, paddingRight: 4,
      }}>
        {chat.length === 0 && (
          <div style={{ opacity: 0.45, fontSize: 12, padding: "8px 4px" }}>
            Ainda sem mensagens. Discute quem é o impostor!
          </div>
        )}
        {chat.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Avatar name={m.name} size={20} />
            <div style={{ flex: 1, fontSize: 13, lineHeight: 1.35 }}>
              <b style={{ color: colorFor(m.name) }}>{m.name}:</b> <span style={{ opacity: 0.92 }}>{m.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onSend(); }}
          maxLength={240}
          placeholder="Escreve…"
          style={{
            flex: 1, padding: "8px 10px", borderRadius: 10,
            background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.14)",
            color: "#fff", fontSize: 14, outline: "none",
          }}
        />
        <button type="button" onClick={onSend}
          disabled={!draft.trim()}
          style={{
            padding: "8px 14px", borderRadius: 10,
            background: draft.trim() ? "linear-gradient(135deg,#00D4B4,#7c5dfa)" : "rgba(255,255,255,0.06)",
            color: "#fff", fontWeight: 900, border: "none",
            cursor: draft.trim() ? "pointer" : "not-allowed",
            opacity: draft.trim() ? 1 : 0.55,
          }}>
          Enviar
        </button>
      </div>
    </div>
  );
}

function ResultCard({ result, revealedTrio, players, mePlayerId, wasImpostor }) {
  if (!result || !revealedTrio) return null;
  const groupWon = result.winner === "group";
  const impostors = players.filter(p => result.impostorIds.includes(p.id));
  const mostVoted = players.find(p => p.id === result.mostVoted);
  return (
    <div style={{
      background: groupWon ? "linear-gradient(160deg,rgba(0,212,180,0.22),rgba(0,80,60,0.35))" : "linear-gradient(160deg,rgba(239,68,68,0.22),rgba(120,20,20,0.35))",
      border: `2px solid ${groupWon ? "rgba(0,212,180,0.55)" : "rgba(239,68,68,0.55)"}`,
      borderRadius: 20, padding: "18px 18px 16px",
      boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
    }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>{groupWon ? "🏆" : "🕵️"}</div>
        <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>
          {groupWon ? "Grupo ganhou!" : "Impostor(es) escaparam!"}
        </div>
        {wasImpostor && (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85, fontWeight: 800, letterSpacing: 0.5 }}>
            (Tu eras o impostor 🎭)
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <RowKV label="Palavra do grupo" value={revealedTrio.real} />
        <RowKV
          label="Palavra do impostor"
          value={revealedTrio.impostorWord}
          hint={revealedTrio.impostor?.length
            ? `(opções possíveis: ${revealedTrio.impostor.join(" · ")})`
            : ""}
        />
        <RowKV
          label={impostors.length > 1 ? "Impostores" : "Impostor"}
          value={impostors.map(p => p.name).join(", ")}
          highlight
        />
        {mostVoted && (
          <RowKV
            label="Mais votado"
            value={`${mostVoted.name}${result.impostorIds.includes(mostVoted.id) ? " ✅" : " ❌"}`}
          />
        )}
      </div>
    </div>
  );
}

function RowKV({ label, value, hint, highlight }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      gap: 10, padding: "8px 12px",
      background: highlight ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.15)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.65 }}>
        {label}
      </div>
      <div style={{ fontWeight: 900, textAlign: "right", fontSize: 14 }}>
        {value || "—"}
        {hint && <div style={{ fontSize: 10.5, opacity: 0.55, fontWeight: 600, marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  );
}
