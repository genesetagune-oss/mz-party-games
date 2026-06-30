import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QUEM_SOU_EU_DB, CATEGORIAS, getDeckForCategory } from "./quemSouEuDB.js";

const COUNTDOWN_SECONDS  = 3;
const SWITCH_SECONDS     = 5;
const WIN_POINTS         = 10;
const MAX_PLAYERS        = 8;
const TURN_OPTIONS       = [null, 30, 45, 60, 75, 90, 120];
const LS_PLAYERS         = "wiz_players_v2";
const LS_OVERRIDE        = "wiz_time_override";

function autoTurnSeconds(n) {
  if (n <= 2) return 90;
  if (n === 3) return 75;
  if (n === 4) return 60;
  if (n <= 6) return 45;
  return 40;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWhoFontClamp(text) {
  const len = String(text ?? "").trim().length;
  if (len <= 6)  return "clamp(72px,16vw,150px)";
  if (len <= 10) return "clamp(60px,14vw,130px)";
  if (len <= 14) return "clamp(52px,12vw,110px)";
  if (len <= 18) return "clamp(44px,10vw,90px)";
  return "clamp(36px,8vw,76px)";
}

function safeParseJSON(s, fb) { try { return JSON.parse(s) ?? fb; } catch { return fb; } }

const RULES_TEXT = [
  "Um jogador coloca o telemóvel na testa com o ecrã virado para fora.",
  "Os outros jogadores dão dicas sem dizer a palavra.",
  "Acertou? Inclina o telemóvel para BAIXO (✅). Passa? Inclina para CIMA (❌).",
  "Cada acerto vale 1 ponto. Passa para o próximo quando o tempo acabar.",
  "Primeiro jogador a chegar a 10 pontos vence! 🏆",
];

export default function WhoIsWho({ onBack }) {
  // ── STATE ──────────────────────────────────────────────
  const [view, setView] = useState("setup"); // setup | play
  const [categoryId, setCategoryId] = useState("mix");
  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Players: array of strings (names)
  const [players, setPlayers] = useState(() => {
    const saved = safeParseJSON(localStorage.getItem(LS_PLAYERS), []);
    return Array.isArray(saved) ? saved : [];
  });
  // Turn time override
  const [timeOverride, setTimeOverride] = useState(() => {
    const v = parseInt(localStorage.getItem(LS_OVERRIDE) || "0", 10);
    return isNaN(v) || v <= 0 ? null : v;
  });

  // ── GAME STATE ─────────────────────────────────────────
  const [phase, setPhase]               = useState("switch"); // switch | countdown | play
  const [switchLeft, setSwitchLeft]     = useState(SWITCH_SECONDS);
  const [countdownLeft, setCountdownLeft] = useState(COUNTDOWN_SECONDS);
  const [timeLeft, setTimeLeft]         = useState(60);
  const [currentCard, setCurrentCard]   = useState(null);
  const [paused, setPaused]             = useState(false);
  const [gameOver, setGameOver]         = useState(false);
  const [winner, setWinner]             = useState(null);
  const [lastAction, setLastAction]     = useState("neutral");
  const [toast, setToast]               = useState("");
  const [confettiPieces, setConfettiPieces] = useState([]);

  const deckRef     = useRef([]);
  const deckIndexRef = useRef(0);
  const [hasSensorPermission, setHasSensorPermission] = useState(false);
  const canTriggerRef = useRef(true);

  // Individual player tracking
  const playerListRef  = useRef([]); // computed at game start
  const playerIndexRef = useRef(0);  // current player index
  const scoresRef      = useRef({});
  const [scores, setScores] = useState({});
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);

  // ── HELPERS ────────────────────────────────────────────
  const effectiveTurnSeconds = useMemo(() => {
    if (timeOverride) return timeOverride;
    const n = playerListRef.current.length || players.filter(Boolean).length || 2;
    return autoTurnSeconds(n);
  }, [timeOverride, players]);

  const currentPlayerName = useMemo(() => {
    const list = playerListRef.current;
    if (!list.length) return "Jogador";
    return list[playerIndexRef.current % list.length] || "Jogador";
  }, [currentPlayerIdx]);

  function saveSettings() {
    localStorage.setItem(LS_PLAYERS, JSON.stringify(players));
    localStorage.setItem(LS_OVERRIDE, timeOverride ? String(timeOverride) : "0");
    setShowSettings(false);
  }

  function showCurrentItem() {
    const deck = deckRef.current;
    if (!deck?.length) return;
    setCurrentCard(deck[deckIndexRef.current % deck.length]);
  }

  function advanceItem() {
    const deck = deckRef.current;
    if (!deck?.length) return;
    deckIndexRef.current = (deckIndexRef.current + 1) % deck.length;
    setCurrentCard(deck[deckIndexRef.current]);
  }

  function getPlayerList() {
    const named = players.filter(p => p?.trim());
    if (named.length >= 2) return named;
    // fill up to 2 with defaults
    const defaults = ["Jogador A", "Jogador B", "Jogador C", "Jogador D"];
    const list = [...named];
    let i = 0;
    while (list.length < 2) list.push(defaults[i++] || `Jogador ${i}`);
    return list;
  }

  function addPointAndMaybeWin() {
    const idx = playerIndexRef.current % playerListRef.current.length;
    const name = playerListRef.current[idx];
    const prev = scoresRef.current[name] ?? 0;
    const next = prev + 1;
    scoresRef.current = { ...scoresRef.current, [name]: next };
    setScores({ ...scoresRef.current });
    if (next >= WIN_POINTS) {
      endGame(name); return true;
    }
    return false;
  }

  function endGame(winnerName) {
    setGameOver(true);
    setWinner(winnerName);
    setPaused(false);
    setToast(""); setLastAction("neutral"); setCurrentCard(null);
  }

  function handleMenu() {
    if (view === "play") {
      setGameOver(false); setWinner(null); setPaused(false);
      setToast(""); setLastAction("neutral"); setCurrentCard(null);
      setView("setup"); return;
    }
    onBack();
  }

  function handleShare() {
    const msg = `🏆 *${winner}* venceu o Quem Sou Eu? no MZ Party Games! 🇲🇿\nJoga tu também!`;
    if (navigator.share) { navigator.share({ text: msg }).catch(() => {}); }
    else { window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank"); }
  }

  // ── PHASE TRANSITIONS ─────────────────────────────────
  function startSwitchPhase() {
    setPhase("switch");
    setSwitchLeft(SWITCH_SECONDS);
    setCurrentCard(null);
    canTriggerRef.current = true;
    setLastAction("neutral");
    setToast("");
  }

  function startCountdownPhase() {
    const secs = timeOverride || autoTurnSeconds(playerListRef.current.length);
    setPhase("countdown");
    setCountdownLeft(COUNTDOWN_SECONDS);
    setTimeLeft(secs);
  }

  function advancePlayer() {
    const next = (playerIndexRef.current + 1) % playerListRef.current.length;
    playerIndexRef.current = next;
    setCurrentPlayerIdx(next);
  }

  // ── GAME START ────────────────────────────────────────
  async function startWithPermission(catId) {
    setCategoryId(catId);
    const canAskMotion = typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function";
    if (canAskMotion && window.isSecureContext) {
      try {
        const g = await DeviceMotionEvent.requestPermission();
        setHasSensorPermission(g === "granted");
      } catch { setHasSensorPermission(false); }
    } else {
      setHasSensorPermission(true);
    }
    startGameInternal(catId);
  }

  function startGameInternal(catId) {
    const list = getPlayerList();
    playerListRef.current = shuffle(list);
    playerIndexRef.current = 0;
    setCurrentPlayerIdx(0);

    const initScores = {};
    for (const p of playerListRef.current) initScores[p] = 0;
    scoresRef.current = initScores;
    setScores(initScores);

    const deck = getDeckForCategory(catId || categoryId, { soNomes: false });
    deckRef.current = deck;
    deckIndexRef.current = 0;

    setGameOver(false); setWinner(null);
    setPaused(false); setLastAction("neutral"); setToast("");
    setView("play");
    startSwitchPhase();
  }

  // ── TIMERS ────────────────────────────────────────────
  useEffect(() => {
    if (view !== "play" || phase !== "switch" || paused || gameOver) return;
    const id = setInterval(() => setSwitchLeft(s => {
      if (s <= 1) { clearInterval(id); startCountdownPhase(); return SWITCH_SECONDS; }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

  useEffect(() => {
    if (view !== "play" || phase !== "countdown" || paused || gameOver) return;
    const id = setInterval(() => setCountdownLeft(c => {
      if (c <= 1) { clearInterval(id); setPhase("play"); showCurrentItem(); return COUNTDOWN_SECONDS; }
      return c - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

  useEffect(() => {
    if (view !== "play" || phase !== "play" || paused || gameOver) return;
    const id = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        clearInterval(id);
        advanceItem();
        advancePlayer();
        setTimeout(() => startSwitchPhase(), 200);
        return 0;
      }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

  // ── TILT SENSOR ───────────────────────────────────────
  useEffect(() => {
    if (!hasSensorPermission || view !== "play" || phase !== "play" || paused || gameOver) return;
    const REARM = 10, TRIGGER = 26, COOLDOWN = 850, DIR = -1;
    let baseline = null, samples = [], lastAt = 0;
    const t0 = performance.now();

    function pitch(g) {
      const ax = g.x ?? 0, ay = g.y ?? 0, az = g.z ?? 0;
      return Math.atan2(ay, Math.sqrt(ax * ax + az * az)) * (180 / Math.PI);
    }

    function onMotion(e) {
      const g = e.accelerationIncludingGravity; if (!g) return;
      const p = pitch(g);
      if (baseline === null) {
        samples.push(p);
        if (performance.now() - t0 >= 450 && samples.length >= 8)
          baseline = samples.reduce((s, v) => s + v, 0) / samples.length;
        return;
      }
      const delta = (p - baseline) * DIR;
      if (Math.abs(delta) <= REARM) { canTriggerRef.current = true; setLastAction("neutral"); return; }
      const now = Date.now();
      if (now - lastAt < COOLDOWN || !canTriggerRef.current) return;
      if (delta >= TRIGGER) {
        // tilt down = PASS
        canTriggerRef.current = false; lastAt = now;
        setLastAction("down"); setToast("❌"); advanceItem();
      } else if (delta <= -TRIGGER) {
        // tilt up = CORRECT
        canTriggerRef.current = false; lastAt = now;
        setLastAction("up");
        const won = addPointAndMaybeWin();
        if (!won) { setToast("✅ +1"); advanceItem(); }
      }
    }

    window.addEventListener("devicemotion", onMotion, { capture: true });
    return () => window.removeEventListener("devicemotion", onMotion, { capture: true });
  }, [hasSensorPermission, view, phase, paused, gameOver]);

  // ── CONFETTI ──────────────────────────────────────────
  useEffect(() => {
    if (gameOver) {
      const colors = ["#EF4444","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EC4899","#fff"];
      setConfettiPieces(Array.from({ length: 36 }, (_, i) => ({
        id: i, left: Math.random() * 100, color: colors[i % colors.length],
        size: 7 + Math.random() * 7, round: Math.random() > 0.5,
        dur: 1.5 + Math.random() * 2, delay: Math.random() * 1.8,
      })));
    } else {
      setConfettiPieces([]);
    }
  }, [gameOver]);

  const bgMode = lastAction === "up" ? "ok" : lastAction === "down" ? "bad" : "neutral";

  // ── SETUP VIEW ────────────────────────────────────────
  if (view === "setup") {
    const hasPlayers = players.some(p => p?.trim());

    return (
      <div className="appBg">
        <div className="shell whoShell">
          <header className="gameHeader">
            <button className="btnGhost" onClick={handleMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Quem Sou Eu?</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={() => { setShowRules(false); setShowSettings(s => !s); }}
                style={{ background: showSettings ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${showSettings ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.13)"}`, borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 16, cursor: "pointer" }}>
                ⚙️
              </button>
              <button type="button" onClick={() => { setShowSettings(false); setShowRules(r => !r); }}
                style={{ background: showRules ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${showRules ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.13)"}`, borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 16, cursor: "pointer" }}>
                ❓
              </button>
            </div>
          </header>

          <div className="whoSetupShell">
            <div className="whoSetupScroll">

              {/* RULES PANEL */}
              {showRules && (
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>📖 Como Jogar</div>
                  {RULES_TEXT.map((r, i) => (
                    <div key={i} style={{ fontSize: 13, opacity: 0.85, marginBottom: 6, paddingLeft: 4 }}>
                      <span style={{ opacity: 0.5, marginRight: 6 }}>{i + 1}.</span>{r}
                    </div>
                  ))}
                </div>
              )}

              {/* SETTINGS PANEL */}
              {showSettings && (
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>⚙️ Definições</div>

                  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>Nomes dos jogadores (opcional)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                    {Array.from({ length: MAX_PLAYERS }, (_, i) => (
                      <input key={i} className="nameInput" placeholder={`Jogador ${i + 1}`}
                        value={players[i] || ""}
                        onChange={(e) => {
                          const n = [...players];
                          n[i] = e.target.value;
                          setPlayers(n);
                        }} />
                    ))}
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>Tempo por turno</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {TURN_OPTIONS.map(v => {
                      const isAuto = v === null;
                      const sel = timeOverride === v;
                      return (
                        <button key={String(v)} type="button"
                          onClick={() => setTimeOverride(v)}
                          style={{ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${sel ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.15)"}`, background: sel ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          {isAuto ? "Auto" : `${v}s`}
                        </button>
                      );
                    })}
                  </div>
                  {timeOverride == null && (
                    <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 10 }}>
                      Auto: {autoTurnSeconds(Math.max(2, players.filter(Boolean).length))}s para {Math.max(2, players.filter(Boolean).length)} jogadores
                    </div>
                  )}

                  <button className="btnPrimary" onClick={saveSettings} type="button">Guardar</button>
                </div>
              )}

              {/* CATEGORY GRID */}
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: 12, paddingLeft: 2 }}>
                Escolhe uma categoria para começar
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {CATEGORIAS.map((c) => (
                  <button key={c.id} type="button"
                    onClick={() => startWithPermission(c.id)}
                    style={{
                      border: "2.5px solid transparent",
                      borderRadius: 18, padding: "16px 10px 13px",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", gap: 5, cursor: "pointer",
                      background: c.bg, boxShadow: `0 4px 20px ${c.shadow}`,
                      WebkitTapHighlightColor: "transparent", minHeight: 108,
                    }}>
                    <div style={{ fontSize: 32, lineHeight: 1 }}>{c.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", textAlign: "center" }}>{c.nome}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="whoSetupDock">
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: "0.01em" }}>
                Inclina ✅ acertou &nbsp;·&nbsp; Inclina ❌ passa &nbsp;·&nbsp; Toca para pausar
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAY VIEW ─────────────────────────────────────────
  const scoreEntries = Object.entries(scores).sort(([, a], [, b]) => b - a);

  return (
    <>
      {gameOver && (
        <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      )}
      {confettiPieces.map(p => (
        <div key={p.id} style={{ position:"fixed",top:-20,left:`${p.left}%`,width:p.size,height:p.size,background:p.color,borderRadius:p.round?"50%":3,animation:`confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,zIndex:9999,pointerEvents:"none" }} />
      ))}

      <div className="appBg">
        <div className="shell whoShell">
          <header className="gameHeader">
            <button className="btnGhost" onClick={handleMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Quem Sou Eu?</div>
            </div>
            <div className="timerPill">
              {gameOver ? "🏁" : paused ? "⏸" : phase === "switch" ? "🔁" : phase === "countdown" ? `${countdownLeft}s` : `${timeLeft}s`}
            </div>
          </header>

          <div className="gameMain">
            {/* Scores row */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {scoreEntries.map(([name, sc]) => {
                const isActive = name === currentPlayerName && !gameOver;
                return (
                  <div key={name} style={{ flex: "0 0 auto", minWidth: 58, background: isActive ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)", border: `1.5px solid ${isActive ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "7px 9px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, opacity: isActive ? 1 : 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 68 }}>
                      {isActive ? `▶ ${name}` : name}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{sc}</div>
                  </div>
                );
              })}
            </div>

            {/* Stage */}
            <div
              className={`whoStage ${bgMode}`}
              onClick={() => {
                if (gameOver) return;
                setPaused(p => !p); setToast(""); setLastAction("neutral"); canTriggerRef.current = true;
              }}
              role="button" tabIndex={0} onKeyDown={() => {}}
            >
              <div className="whoStageInner">
                {gameOver ? (
                  <>
                    <div className="whoBig">🏆 {winner}</div>
                    <div className="whoSmall">{scores[winner] ?? WIN_POINTS} pontos</div>

                    {/* Final scores */}
                    <div style={{ width: "min(78vw,440px)", display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                      {scoreEntries.map(([name, sc], i) => (
                        <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderRadius: 10, background: name === winner ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${name === winner ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`, fontSize: 14 }}>
                          <span style={{ fontWeight: 700 }}>{i === 0 ? "🥇 " : ""}{name}</span>
                          <span style={{ fontWeight: 900 }}>{sc} pts</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ width: "min(78vw,440px)", display: "grid", gap: 10 }}>
                      <button className="btnPrimary" type="button" onClick={() => startGameInternal(categoryId)}>Jogar outra vez</button>
                      <button type="button" onClick={handleShare} style={{ background:"#25D366",border:"none",borderRadius:14,padding:"14px 0",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer" }}>📤 Partilhar</button>
                      <button className="btnGhost" type="button" onClick={handleMenu}>Menu</button>
                    </div>
                  </>
                ) : paused ? (
                  <>
                    <div className="whoBig">⏸ Pausado</div>
                    <div className="whoSmall">Toca para continuar.</div>
                  </>
                ) : phase === "switch" ? (
                  <>
                    <div className="whoBig" style={{ fontSize: "clamp(22px,5vw,46px)" }}>Agora é:</div>
                    <div className="whoBig" style={{ fontSize: "clamp(26px,7vw,64px)", maxWidth: "min(80vw,500px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {currentPlayerName}
                    </div>
                    <div className="whoSmall">Posiciona o telemóvel na testa. ({switchLeft}s)</div>
                  </>
                ) : phase === "countdown" ? (
                  <>
                    <div className="whoBig">Pronto… {countdownLeft}</div>
                    <div className="whoSmall" style={{ maxWidth: "min(78vw,500px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {currentPlayerName}
                    </div>
                  </>
                ) : (
                  <div className="whoCardText" style={{ fontSize: getWhoFontClamp(currentCard?.nome ?? "") }}>
                    {currentCard?.nome ?? ""}
                  </div>
                )}
                {toast && <div className="whoToast">{toast}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
