import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { CATEGORIAS } from "../../games/quemSouEuDB.js";

const TURN_OPTIONS = [
  { label: "Auto", value: null },
  { label: "30s",  value: 30  },
  { label: "45s",  value: 45  },
  { label: "60s",  value: 60  },
  { label: "75s",  value: 75  },
  { label: "90s",  value: 90  },
];

const RULES = [
  "Tens uma palavra/personagem que não vês.",
  "Faz perguntas de SIM ou NÃO aos outros para descobrires quem és.",
  "Acerta o máximo que conseguires no teu tempo.",
  "Quem acertar mais, ganha.",
];

// Ratio of turn time remaining when the "table can hint now" prompt unlocks.
// 0.45 → 90s turn shows it at ~40s left; 60s → ~27s; 40s → ~18s.
const HINT_UNLOCK_RATIO = 0.45;

export default function WhoIsWhoOnline({ onBack, room, roomCode, gamePublic, gamePrivate, onSwitchGame }) {
  const me = room?.players?.find((p) => p.id === socket.id) || null;
  const isHost = !!me?.isHost;
  const playerCount = (room?.players ?? []).filter(p => p.connected !== false).length;

  const phase = gamePublic?.phase ?? "lobby";
  const turnPhase = gamePublic?.turnPhase ?? "ready";
  const paused = !!gamePublic?.paused;

  const scoreboard = gamePublic?.scoreboard ?? [];
  const currentPlayer = gamePublic?.currentPlayer ?? null;
  const playerName = currentPlayer?.name ?? "-";

  const remaining = Math.ceil((gamePublic?.remainingMs ?? 0) / 1000);
  const winner = gamePublic?.winner ?? null;
  const category = gamePublic?.category ?? room?.settings?.category ?? "mix";
  const passLeft = gamePublic?.passLeft ?? 0;
  const turnSeconds = gamePublic?.turnSeconds ?? 60;
  const turnSecondsOverride = gamePublic?.turnSecondsOverride ?? null;

  const role = gamePrivate?.role ?? "NONE";
  const isExplainer = role === "EXPLAINER";
  const canAct = !!gamePrivate?.canAct;
  const item = gamePrivate?.item ?? null;

  const [floatMsg, setFloatMsg] = useState(null);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");

  function showFloat(msg) {
    setFloatMsg(msg);
    setTimeout(() => setFloatMsg(null), 900);
  }

  const audioRef = useRef(null);
  function warmupAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioRef.current) audioRef.current = new AudioCtx();
      if (audioRef.current.state === "suspended") audioRef.current.resume();
      const o = audioRef.current.createOscillator();
      const g = audioRef.current.createGain();
      o.type = "sine"; o.frequency.value = 1; g.gain.value = 0.00001;
      o.connect(g); g.connect(audioRef.current.destination); o.start();
      setTimeout(() => o.stop(), 60);
    } catch {}
  }

  const leaveToMenu  = () => { socket.emit("room:leave"); onBack?.(); };
  const startGame    = () => { warmupAudio(); socket.emit("game:start"); };
  const setCat       = (cat) => { socket.emit("game:setCategory", { category: cat }); setShowCatPicker(false); };
  const setOverride  = (v) => socket.emit("game:setSettings", { turnSecondsOverride: v });
  const yes          = () => { warmupAudio(); showFloat("✅ +1"); socket.emit("game:command", { type: "YES" }); };
  const pass         = () => { warmupAudio(); socket.emit("game:command", { type: "PASS" }); };
  const togglePause  = () => { warmupAudio(); socket.emit("game:command", { type: "PAUSE_TOGGLE" }); };
  const restart      = () => { warmupAudio(); socket.emit("game:restart"); };

  const handleShare = async () => {
    const url = `https://mz-party-games.onrender.com/?join=${roomCode}`;
    const text = `🎮 Joga Quem Sou Eu? comigo no MZ Party Games!\nEntra directo → ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "MZ Party Games", text, url }); setShareFeedback("Partilhado! ✓"); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setShareFeedback("Copiado! ✓"); } catch {}
    }
    setTimeout(() => setShareFeedback(""), 2500);
  };

  const catLabel = CATEGORIAS.find(c => c.id === category)?.nome ?? category;
  const isLobby = phase === "lobby";
  const isFinished = phase === "finished";
  const isPlaying = phase === "playing";

  // Hint-unlock banner: fires once ~45% of the turn time remains,
  // scaling with turnSeconds (auto or override from server state).
  const hintUnlockThreshold = Math.round((turnSeconds || 0) * HINT_UNLOCK_RATIO);
  const hintUnlocked = isPlaying && turnPhase === "play" && !paused && !isFinished
    && remaining > 0 && remaining <= hintUnlockThreshold;

  return (
    <div className="appBg">
      <div className="shell shellGame">

        {/* ── HEADER ── */}
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Quem Sou Eu? · Online</div>
            <div style={{ opacity: 0.6, marginTop: 2, fontSize: 11 }}>
              Sala: <b>{roomCode || "-"}</b> · {playerCount} jogador{playerCount !== 1 ? "es" : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {isHost && isLobby && (
              <button onClick={() => { setShowRules(false); setShowSettings(s => !s); }} type="button"
                style={{ background: showSettings ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${showSettings ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.13)"}`, borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 16, cursor: "pointer" }}>
                ⚙️
              </button>
            )}
            <button onClick={() => { setShowSettings(false); setShowRules(r => !r); }} type="button"
              style={{ background: showRules ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${showRules ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.13)"}`, borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 16, cursor: "pointer" }}>
              ❓
            </button>
            {(isPlaying || isFinished) && (
              <div className="timerPill">
                {isFinished ? "🏁" : paused ? "⏸" : turnPhase === "ready" ? `⏳` : `${remaining}s`}
              </div>
            )}
          </div>
        </header>

        <main className="gameMain">

          {/* ── RULES PANEL ── */}
          {showRules && (
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>📖 Como Jogar</div>
              {RULES.map((r, i) => (
                <div key={i} style={{ fontSize: 13, opacity: 0.85, marginBottom: 6, paddingLeft: 4 }}>
                  <span style={{ opacity: 0.5, marginRight: 6 }}>{i + 1}.</span>{r}
                </div>
              ))}
            </div>
          )}

          {/* ── SETTINGS PANEL (host, lobby only) ── */}
          {showSettings && isHost && isLobby && (
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>⚙️ Definições</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>Tempo por turno</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TURN_OPTIONS.map(opt => (
                  <button key={String(opt.value)} type="button" onClick={() => setOverride(opt.value)}
                    style={{ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${turnSecondsOverride === opt.value ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.15)"}`, background: turnSecondsOverride === opt.value ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {turnSecondsOverride == null && (
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
                  Auto atual: {gamePublic?.turnSeconds ?? "…"}s para {playerCount} jogadores
                </div>
              )}
            </div>
          )}

          {/* ── LOBBY ── */}
          {isLobby && (
            <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: 12, overflow: "auto", paddingBottom: 12 }}>

              {/* Share code card */}
              <button className="lobbyCodeCard" onClick={handleShare} type="button">
                <div className="lobbyCodeLabel">{shareFeedback || "SHARE CODE"}</div>
                <div className="lobbyCodeRow">
                  <div className="lobbyCodeValue">{(roomCode || "").match(/.{1,3}/g)?.join(" ")}</div>
                  <div className="lobbyShareBtn">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize:11, opacity:.50, marginTop:6 }}>Toca para partilhar · WhatsApp, Instagram, SMS…</div>
              </button>

              {/* Player list — flat, individual (no teams) */}
              <div className="lobbyPlayersCard">
                <div className="lobbyPlayersHeader">
                  <div className="lobbyPlayersTitle">Jogadores</div>
                  <div className="lobbyPlayersCount">
                    {(room?.players ?? []).length}<span style={{ opacity:.45 }}>/8</span>
                  </div>
                </div>
                <div style={{ display:"grid", gap:8, padding:"4px 0" }}>
                  {(room?.players ?? []).map(p => {
                    const initials = (p.name || "?")[0].toUpperCase();
                    const AVATAR_COLORS = ["#7c5dfa","#00e5b0","#4a9eff","#f97316","#ec4899","#22c55e","#eab308","#ef4444"];
                    const color = AVATAR_COLORS[(p.name || "").charCodeAt(0) % AVATAR_COLORS.length] || "#7c5dfa";
                    return (
                      <div key={p.id} className="lobbyPlayer">
                        <div style={{ width:36, height:36, borderRadius:"50%", background:`${color}22`, border:`2px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color, flexShrink:0 }}>{initials}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="lobbyPlayerName">{p.name}</div>
                          {p.isHost && <div className="lobbyHostBadge">HOST</div>}
                        </div>
                        <div className="lobbyPlayerReady">✓</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Host controls / guest waiting */}
              {isHost ? (
                <>
                  <button type="button" className="btnPrimary"
                    disabled={playerCount < 2} onClick={startGame}>
                    {playerCount < 2 ? `Aguarda mais ${2 - playerCount} jogador…` : "▶ Começar"}
                  </button>

                  <button type="button" onClick={() => setShowCatPicker(v => !v)}
                    style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", color: "rgba(234,236,244,0.65)", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>
                    {showCatPicker ? "▲ Fechar" : `🎭 Categoria: ${catLabel} — alterar`}
                  </button>

                  {showCatPicker && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {CATEGORIAS.map((c) => (
                        <button key={c.id} type="button" onClick={() => setCat(c.id)}
                          style={{
                            border: category === c.id ? "2.5px solid rgba(255,255,255,0.9)" : "2.5px solid transparent",
                            borderRadius: 16, padding: "12px 8px 10px",
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", gap: 4, cursor: "pointer",
                            background: c.bg, boxShadow: category === c.id ? `0 0 0 3px rgba(255,255,255,0.2), 0 4px 16px ${c.shadow}` : `0 4px 12px ${c.shadow}`,
                            minHeight: 88, WebkitTapHighlightColor: "transparent",
                          }}>
                          <div style={{ fontSize: 26 }}>{c.emoji}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", textAlign: "center" }}>{c.nome}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, opacity: .75, textAlign: "center" }}>Aguardando o host iniciar…</div>
                  <div style={{ padding: "8px 16px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
                    Categoria: <b style={{ color: "#fff" }}>{catLabel}</b>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── IN-GAME ── */}
          {isPlaying && (
            <>
              {/* Scoreboard */}
              <section style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {scoreboard.map(pl => (
                  <div key={pl.id} style={{
                    flex: "0 0 auto", minWidth: 64,
                    background: pl.isCurrent ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)",
                    border: `1.5px solid ${pl.isCurrent ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 12, padding: "8px 10px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: pl.isCurrent ? 1 : 0.55, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 72 }}>
                      {pl.isCurrent ? `▶ ${pl.name}` : pl.name}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{pl.score}</div>
                  </div>
                ))}
              </section>

              {/* Turn info */}
              <section style={{ padding: "6px 0", fontSize: 13, opacity: 0.75, textAlign: "center" }}>
                {paused ? "⏸ Pausado" : turnPhase === "ready" ? `Pronto… ${remaining}s` : `Vez de ${playerName} — ${remaining}s`}
              </section>

              {/* Card area */}
              <section className="whoStage" style={{ position: "relative", minHeight: 160 }}>
                {floatMsg && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", fontSize: 32, fontWeight: 950, pointerEvents: "none", zIndex: 10, animation: "floatUp .9s ease forwards" }}>
                    {floatMsg}
                  </div>
                )}
                {hintUnlocked && (
                  <div
                    aria-live="polite"
                    style={{
                      position: "absolute", top: 12, left: "50%",
                      transform: "translateX(-50%)",
                      background: "linear-gradient(135deg,#F59E0B,#F97316)",
                      color: "#1a1300",
                      padding: "10px 18px", borderRadius: 999,
                      fontWeight: 900, fontSize: "clamp(14px,3vw,20px)",
                      whiteSpace: "nowrap",
                      border: "2px solid rgba(255,255,255,0.4)",
                      animation: "wizHintPulse 1.4s ease-in-out infinite",
                      zIndex: 5, pointerEvents: "none",
                    }}
                  >
                    💡 A mesa pode dar dicas agora!
                  </div>
                )}
                <div className="whoStageInner" style={{ transform: "none" }}>
                  {turnPhase === "ready" ? (
                    <div style={{ textAlign: "center" }}>
                      <div className="whoSmall">Pronto…</div>
                      <div className="whoBig">{remaining}</div>
                      <div className="whoSmall" style={{ marginTop: 8, opacity: 0.6 }}>
                        {playerName} vai jogar
                      </div>
                    </div>
                  ) : isExplainer ? (
                    item ? (
                      <div className="whoCardText">{item.value}</div>
                    ) : (
                      <div className="whoSmall">Sem carta…</div>
                    )
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <div className="whoBig">🤔</div>
                      <div className="whoSmall" style={{ marginTop: 8 }}>Faz perguntas de SIM / NÃO!</div>
                      <div className="whoSmall" style={{ opacity: 0.5, marginTop: 4 }}>{playerName} responde com os botões</div>
                    </div>
                  )}
                </div>
              </section>

              {/* Action buttons */}
              <footer className="actionDock">
                {turnPhase === "play" && isExplainer ? (
                  <>
                    <div className="dock2">
                      <button className="btnSoft dockBig" onClick={yes} disabled={!canAct} type="button"
                        style={{ background: "rgba(0,200,100,.18)", border: "1px solid rgba(0,200,100,.35)" }}>
                        ✅ Acertou
                      </button>
                      <button className="btnSoft dockBig" onClick={pass} disabled={!canAct || passLeft <= 0} type="button"
                        style={{ background: "rgba(255,170,0,.18)", border: "1px solid rgba(255,170,0,.35)" }}>
                        ⏭ Passar ({passLeft})
                      </button>
                    </div>
                    <button className="btnSoft" onClick={togglePause} disabled={!isExplainer} type="button"
                      style={{ width: "100%" }}>
                      {paused ? "▶️ Retomar" : "⏸️ Pausa"}
                    </button>
                  </>
                ) : (
                  <div className="footNoteDock" style={{ opacity: 0.7 }}>
                    {turnPhase === "play" ? `Adivinha! ${playerName} confirma.` : "Aguarda…"}
                  </div>
                )}
              </footer>
            </>
          )}

          {/* ── VICTORY ── */}
          {isFinished && (
            <div className="victoryOverlay">
              <div className="victoryBackdrop" />
              <div className="victoryCard">
                <div className="victoryTitle">🏆</div>
                <div className="victoryTeam">{winner?.name ?? "?"}</div>
                <div className="victorySub">{winner?.score ?? 0} pontos</div>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  {scoreboard.map(pl => (
                    <div key={pl.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderRadius: 10, background: pl.id === winner?.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${pl.id === winner?.id ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`, fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>{pl.id === winner?.id ? "🥇 " : ""}{pl.name}</span>
                      <span style={{ fontWeight: 900 }}>{pl.score} pts</span>
                    </div>
                  ))}
                </div>
                <div className="victoryBtns" style={{ marginTop: 16 }}>
                  <button className="victoryBtn share" onClick={handleShare} type="button">📲 Partilhar</button>
                  {isHost ? (
                    <>
                      <button className="victoryBtn restart" onClick={restart} type="button">🔁 Reiniciar</button>
                      <button className="victoryBtn restart" onClick={onSwitchGame} type="button">🎮 Mudar Jogo</button>
                    </>
                  ) : (
                    <div className="waitingHostMsg"><div className="waitingHostDot" />Host a decidir…</div>
                  )}
                  <button className="victoryBtn menu" onClick={leaveToMenu} type="button">Menu</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
