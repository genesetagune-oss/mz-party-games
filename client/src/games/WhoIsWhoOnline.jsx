import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { CATEGORIAS } from "../../games/quemSouEuDB.js";
import { playSound } from "../utils/sound";

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

// Small, self-contained UI primitives used by the Settings panel.
// Kept in this file — they aren't shared with other games and each has its
// own dark-theme visual treatment that doesn't warrant a separate module.
function SettingSection({ title, desc, children, disabled, last }) {
  return (
    <div style={{
      paddingBottom: last ? 0 : 14,
      marginBottom: last ? 0 : 14,
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)",
      opacity: disabled ? 0.75 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 13.5, color: "#fff", letterSpacing: 0.1 }}>{title}</div>
      </div>
      <div style={{ fontSize: 11.5, opacity: 0.55, marginBottom: 10, lineHeight: 1.45 }}>{desc}</div>
      {children}
    </div>
  );
}

function SwitchRow({ on, onChange, disabled, onLabel = "Ligado", offLabel = "Desligado" }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "8px 12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
    }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? "#fff" : "rgba(234,236,244,0.6)" }}>
        {on ? onLabel : offLabel}
      </span>
      <span
        role="switch" aria-checked={on}
        onClick={(e) => { e.preventDefault(); if (!disabled) onChange(!on); }}
        style={{
          position: "relative",
          width: 44, height: 24, borderRadius: 999,
          background: on ? "linear-gradient(135deg,#00D4B4,#7c5dfa)" : "rgba(255,255,255,0.12)",
          border: `1px solid ${on ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)"}`,
          transition: "background 180ms ease",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: on ? 22 : 2,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          transition: "left 180ms ease",
        }} />
      </span>
    </label>
  );
}

// Component used to render the 3-slot letter hint. Kept minimal so it renders
// the same way whether inside the guesser panel or the shared card area.
function LetterHintSlots({ hint, small }) {
  if (!hint || typeof hint.slot !== "number" || !hint.letter) return null;
  const size = small ? 34 : 44;
  const font = small ? 20 : 26;
  return (
    <div style={{ display: "flex", gap: small ? 8 : 12, justifyContent: "center" }}>
      {[0, 1, 2].map((i) => {
        const active = i === hint.slot;
        return (
          <div key={i} style={{
            width: size, height: size, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: active ? "linear-gradient(135deg,#00D4B4,#7c5dfa)" : "rgba(255,255,255,0.06)",
            border: `2px solid ${active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}`,
            color: active ? "#fff" : "rgba(234,236,244,0.4)",
            fontWeight: 950, fontSize: font,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            boxShadow: active ? "0 4px 14px rgba(124,93,250,0.35)" : "none",
          }}>
            {active ? hint.letter : "*"}
          </div>
        );
      })}
    </div>
  );
}

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
  const isGuesser = role === "GUESSER";
  const canAct = !!gamePrivate?.canAct;
  const item = gamePrivate?.item ?? null;

  // Host-controlled feature flag; guesser sees the letter mask, explainers hide it.
  const letterHintEnabled = gamePublic?.letterHintEnabled !== false; // default true
  const letterHint = gamePublic?.letterHint ?? null; // { letter, slot } | null

  const [floatMsg, setFloatMsg] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  // Sound preference is now global (managed by App.jsx HOME ⚙️). This
  // component just fires playSound() and trusts the shared mute state.

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
  const setCat       = (cat) => { socket.emit("game:setCategory", { category: cat }); };
  const setOverride  = (v) => socket.emit("game:setSettings", { turnSecondsOverride: v });
  const setLetterHint = (v) => socket.emit("game:setSettings", { letterHintEnabled: !!v });
  const yes          = () => { warmupAudio(); showFloat("✅ +1"); socket.emit("game:command", { type: "YES" }); };
  const pass         = () => { warmupAudio(); socket.emit("game:command", { type: "PASS" }); };
  const togglePause  = () => { warmupAudio(); socket.emit("game:command", { type: "PAUSE_TOGGLE" }); };
  const restart      = () => { warmupAudio(); socket.emit("game:restart"); };

  // Play the "correct" chime whenever the server tells us a guess landed.
  // Runs for everyone (guesser hears their own point, explainers hear too).
  useEffect(() => {
    const handle = (evt) => {
      if (!evt) return;
      if (evt.type === "YES") playSound("correct");
      else if (evt.type === "GAME_FINISHED") playSound("win");
    };
    socket.on("game:event", handle);
    return () => socket.off("game:event", handle);
  }, []);

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
            {/* Settings is available to everyone — guests can toggle their own sound;
                host-only options render locked for non-hosts. */}
            <button onClick={() => { setShowRules(false); setShowSettings(s => !s); }} type="button"
              style={{ background: showSettings ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${showSettings ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.13)"}`, borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 16, cursor: "pointer" }}>
              ⚙️
            </button>
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

          {/* ── SETTINGS PANEL ── */}
          {showSettings && (
            <div style={{
              background: "linear-gradient(180deg, rgba(20,22,36,0.94) 0%, rgba(14,16,28,0.94) 100%)",
              border: "1px solid rgba(124,93,250,0.28)",
              borderRadius: 18,
              padding: "16px 16px 14px",
              marginBottom: 14,
              boxShadow: "0 12px 34px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>⚙️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 0.1 }}>Definições</div>
                  <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 600 }}>
                    {isHost ? "Configura a partida" : "O host controla estas definições"}
                  </div>
                </div>
              </div>

              {/* Turn time */}
              <SettingSection
                title="Tempo por turno"
                desc="Segundos que cada jogador tem para adivinhar."
                disabled={!isHost || !isLobby}
              >
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TURN_OPTIONS.map(opt => {
                    const sel = turnSecondsOverride === opt.value;
                    return (
                      <button key={String(opt.value)} type="button"
                        disabled={!isHost || !isLobby}
                        onClick={() => setOverride(opt.value)}
                        style={{
                          padding: "8px 14px", borderRadius: 999,
                          border: `1.5px solid ${sel ? "rgba(124,93,250,0.85)" : "rgba(255,255,255,0.14)"}`,
                          background: sel ? "rgba(124,93,250,0.25)" : "rgba(255,255,255,0.05)",
                          color: sel ? "#fff" : "rgba(234,236,244,0.75)",
                          fontSize: 13, fontWeight: 800,
                          cursor: isHost && isLobby ? "pointer" : "not-allowed",
                          opacity: isHost && isLobby ? 1 : 0.6,
                        }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {turnSecondsOverride == null && (
                  <div style={{ fontSize: 11, opacity: 0.45, marginTop: 8 }}>
                    Auto atual: <b>{gamePublic?.turnSeconds ?? "…"}s</b> para {playerCount} jogadores
                  </div>
                )}
              </SettingSection>

              {/* Letter hint */}
              <SettingSection
                title="Dica de letra"
                desc="Aos 60s restantes, revela 1 letra em 3 slots (posição real, tamanho oculto)."
                disabled={!isHost || !isLobby}
                last
              >
                <SwitchRow
                  on={letterHintEnabled}
                  disabled={!isHost || !isLobby}
                  onChange={setLetterHint}
                  onLabel="Activado"
                  offLabel="Desactivado"
                />
              </SettingSection>
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

              {/* Category — HOST picks (always visible), guests see a big card */}
              {isHost ? (
                <div>
                  <div style={{
                    display: "flex", alignItems: "baseline", justifyContent: "space-between",
                    marginBottom: 10, paddingLeft: 2,
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
                      textTransform: "uppercase", color: "rgba(234,236,244,0.55)",
                    }}>
                      🎭 Categoria
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.45, fontWeight: 700 }}>
                      Toca para escolher
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {CATEGORIAS.map((c) => {
                      const sel = category === c.id;
                      return (
                        <button key={c.id} type="button" onClick={() => setCat(c.id)}
                          aria-pressed={sel}
                          style={{
                            position: "relative",
                            border: sel ? "2.5px solid #fff" : "2.5px solid transparent",
                            borderRadius: 16, padding: "14px 8px 12px",
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", gap: 5, cursor: "pointer",
                            background: c.bg,
                            boxShadow: sel
                              ? `0 0 0 3px rgba(255,255,255,0.25), 0 6px 20px ${c.shadow}`
                              : `0 4px 12px ${c.shadow}`,
                            minHeight: 92, WebkitTapHighlightColor: "transparent",
                            transform: sel ? "scale(1.02)" : "scale(1)",
                            transition: "transform 160ms ease, box-shadow 160ms ease",
                          }}>
                          {sel && (
                            <span style={{
                              position: "absolute", top: 6, right: 8,
                              fontSize: 11, fontWeight: 900,
                              color: "#fff", opacity: 0.95,
                            }}>✓</span>
                          )}
                          <div style={{ fontSize: 28, lineHeight: 1 }}>{c.emoji}</div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: 0.1 }}>
                            {c.nome}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button type="button" className="btnPrimary"
                    disabled={playerCount < 2} onClick={startGame}
                    style={{ marginTop: 14 }}>
                    {playerCount < 2 ? `Aguarda mais ${2 - playerCount} jogador…` : "▶ Começar"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "6px 0 12px" }}>
                  <div style={{
                    fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "rgba(234,236,244,0.55)",
                    paddingLeft: 2,
                  }}>
                    🎭 Categoria escolhida pelo host
                  </div>
                  {(() => {
                    const c = CATEGORIAS.find(x => x.id === category) || CATEGORIAS[0];
                    return (
                      <div style={{
                        background: c.bg,
                        border: "2px solid rgba(255,255,255,0.25)",
                        borderRadius: 20, padding: "18px 22px",
                        boxShadow: `0 8px 28px ${c.shadow}`,
                        display: "flex", alignItems: "center", gap: 16,
                      }}>
                        <div style={{
                          fontSize: 48, lineHeight: 1, flexShrink: 0,
                          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
                        }}>
                          {c.emoji}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 11, fontWeight: 800, letterSpacing: 1.6,
                            textTransform: "uppercase", color: "rgba(255,255,255,0.75)",
                            marginBottom: 4,
                          }}>
                            A jogar
                          </div>
                          <div style={{
                            fontSize: 26, fontWeight: 950, color: "#fff",
                            letterSpacing: -0.2, lineHeight: 1.1,
                            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                          }}>
                            {c.nome}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: "10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}>
                    <div className="waitingHostDot" style={{ width: 10, height: 10 }} />
                    <span style={{ fontWeight: 800, fontSize: 14, color: "rgba(234,236,244,0.75)" }}>
                      Aguardando o host iniciar…
                    </span>
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

              {/* Hint banner — rendered ABOVE .whoStage so its overflow:hidden
                  cannot clip it, and outside the card container so a big card
                  word never covers it. */}
              {hintUnlocked && (
                <section
                  aria-live="polite"
                  style={{
                    display: "flex", justifyContent: "center", padding: "4px 0 6px",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{
                    background: "linear-gradient(135deg,#F59E0B,#F97316)",
                    color: "#1a1300",
                    padding: "10px 20px", borderRadius: 999,
                    fontWeight: 900, fontSize: "clamp(15px,3.4vw,22px)",
                    letterSpacing: ".01em",
                    border: "2px solid rgba(255,255,255,0.5)",
                    animation: "wizHintPulse 1.4s ease-in-out infinite",
                    maxWidth: "min(94%, 460px)", textAlign: "center",
                  }}>
                    💡 A mesa pode dar dicas agora!
                  </div>
                </section>
              )}

              {/* Card area */}
              <section className="whoStage" style={{ position: "relative", minHeight: 160 }}>
                {floatMsg && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", fontSize: 32, fontWeight: 950, pointerEvents: "none", zIndex: 10, animation: "floatUp .9s ease forwards" }}>
                    {floatMsg}
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
                    <div style={{ textAlign: "center" }}>
                      <div className="whoSmall" style={{ opacity: 0.55, marginBottom: 6 }}>{playerName} está a adivinhar…</div>
                      {item ? (
                        <div className="whoCardText">{item.value}</div>
                      ) : (
                        <div className="whoSmall">Sem carta…</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div className="whoBig">🤔</div>
                      <div className="whoSmall">Faz perguntas de SIM / NÃO!</div>
                      <div className="whoSmall" style={{ opacity: 0.5 }}>Os outros confirmam quando acertares</div>
                      {letterHint && (
                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,212,180,0.85)" }}>
                            💡 Dica de letra
                          </div>
                          <LetterHintSlots hint={letterHint} />
                        </div>
                      )}
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
                    {turnPhase === "play" ? "Adivinha! Os outros confirmam." : "Aguarda…"}
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
