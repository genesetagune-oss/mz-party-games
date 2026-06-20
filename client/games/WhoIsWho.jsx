import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  WHO_TEXT_MIX, WHO_TEXT_MZ, WHO_TEXT_GLOBAL,
  WHO_PHOTOS_MZ, WHO_PHOTOS_GLOBAL,
  WHO_TEXT_FILMES, WHO_TEXT_MUSICA, WHO_TEXT_DESPORTO,
  WHO_TEXT_ANIME, WHO_TEXT_BIBLIA, WHO_TEXT_FAMILIA,
} from "./whoiswhoItems.js";

const ROUND_SECONDS = 60;
const COUNTDOWN_SECONDS = 3;
const START_MESSAGE_SECONDS = 6;
const SWITCH_MESSAGE_SECONDS = 6;
const WIN_POINTS = 30;
const MAX_PLAYERS_PER_TEAM = 4;

const SECTIONS = [
  {
    id: "mz", label: "🇲🇿 MZ",
    cats: [
      { key: "mix",    emoji: "🎲", title: "Mix MZ",       sub: "pessoas + marcas + lugares",      bg: "linear-gradient(135deg,#16a34a,#15803d)", shadow: "rgba(22,163,74,0.5)" },
      { key: "mzPic", emoji: "🖼️", title: "MZ Fotos",     sub: "marcas + famosos + lugares",      bg: "linear-gradient(135deg,#0d9488,#0f766e)", shadow: "rgba(13,148,136,0.5)" },
      { key: "mz",    emoji: "🇲🇿", title: "MZ Texto",     sub: "só palavras MZ",                  bg: "linear-gradient(135deg,#dc2626,#b91c1c)", shadow: "rgba(220,38,38,0.5)" },
    ],
  },
  {
    id: "global", label: "🌍 Global",
    cats: [
      { key: "global",    emoji: "🌍", title: "Global",         sub: "celebridades + marcas",   bg: "linear-gradient(135deg,#2563eb,#1d4ed8)", shadow: "rgba(37,99,235,0.5)" },
      { key: "globalPic", emoji: "🖼️", title: "Global Fotos",  sub: "fotos globais",            bg: "linear-gradient(135deg,#7c3aed,#6d28d9)", shadow: "rgba(124,58,237,0.5)" },
      { key: "filmes",    emoji: "🎬", title: "Filmes & Séries",sub: "cinema + streaming",       bg: "linear-gradient(135deg,#db2777,#be185d)", shadow: "rgba(219,39,119,0.5)" },
      { key: "musica",    emoji: "🎵", title: "Música",         sub: "artistas + bandas",        bg: "linear-gradient(135deg,#ea580c,#c2410c)", shadow: "rgba(234,88,12,0.5)" },
      { key: "desporto",  emoji: "⚽", title: "Desporto",       sub: "futebol + atletas",        bg: "linear-gradient(135deg,#0891b2,#0e7490)", shadow: "rgba(8,145,178,0.5)" },
    ],
  },
  {
    id: "especiais", label: "🔥 Especiais",
    cats: [
      { key: "anime",   emoji: "⛩️", title: "Anime",   sub: "Naruto · Dragon Ball · One Piece", bg: "linear-gradient(135deg,#d97706,#b45309)", shadow: "rgba(217,119,6,0.5)" },
      { key: "biblia",  emoji: "📖", title: "Bíblia",  sub: "personagens bíblicos",             bg: "linear-gradient(135deg,#ca8a04,#a16207)", shadow: "rgba(202,138,4,0.5)" },
      { key: "familia", emoji: "👶", title: "Família", sub: "versão fácil para todos",          bg: "linear-gradient(135deg,#16a34a,#4ade80)", shadow: "rgba(22,163,74,0.5)" },
      { key: "adulto",  emoji: "🔞", title: "18+",     sub: "em breve",                         bg: "linear-gradient(135deg,#374151,#1f2937)", shadow: "rgba(0,0,0,0.3)", locked: true },
    ],
  },
];

const ALL_CATS = SECTIONS.flatMap((s) => s.cats);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const wrapText = (list) => list.map((t) => ({ type: "text", value: t }));

function buildDeck(k) {
  switch (k) {
    case "mzPic":     return WHO_PHOTOS_MZ;
    case "globalPic": return WHO_PHOTOS_GLOBAL;
    case "mz":        return wrapText(WHO_TEXT_MZ);
    case "global":    return wrapText(WHO_TEXT_GLOBAL);
    case "filmes":    return wrapText(WHO_TEXT_FILMES);
    case "musica":    return wrapText(WHO_TEXT_MUSICA);
    case "desporto":  return wrapText(WHO_TEXT_DESPORTO);
    case "anime":     return wrapText(WHO_TEXT_ANIME);
    case "biblia":    return wrapText(WHO_TEXT_BIBLIA);
    case "familia":   return wrapText(WHO_TEXT_FAMILIA);
    default:          return wrapText(WHO_TEXT_MIX);
  }
}

function safeParseJSON(str, fallback) {
  try { const v = JSON.parse(str); return v ?? fallback; } catch { return fallback; }
}
function normalizePlayers(arr) {
  const base = Array.isArray(arr) ? arr : [];
  const t = base.slice(0, MAX_PLAYERS_PER_TEAM).map((s) => String(s ?? ""));
  while (t.length < MAX_PLAYERS_PER_TEAM) t.push("");
  return t;
}
function nonEmptyPlayers(arr) {
  return (Array.isArray(arr) ? arr : []).map((s) => String(s ?? "").trim()).filter(Boolean);
}
function getWhoFontClamp(text) {
  const len = String(text ?? "").trim().length;
  if (len <= 6)  return "clamp(80px,18vw,160px)";
  if (len <= 10) return "clamp(70px,16vw,140px)";
  if (len <= 14) return "clamp(60px,14vw,120px)";
  if (len <= 18) return "clamp(52px,12vw,105px)";
  return "clamp(42px,10vw,90px)";
}

export default function WhoIsWho({ onBack }) {
  const [view, setView] = useState("setup");
  const [categoryKey, setCategoryKey] = useState("mix");
  const [showOverlay, setShowOverlay] = useState(false);

  const [teamNameA, setTeamNameA] = useState(localStorage.getItem("wiz_teamA") || "");
  const [teamNameB, setTeamNameB] = useState(localStorage.getItem("wiz_teamB") || "");
  const [playersA, setPlayersA] = useState(() => normalizePlayers(safeParseJSON(localStorage.getItem("wiz_playersA"), [])));
  const [playersB, setPlayersB] = useState(() => normalizePlayers(safeParseJSON(localStorage.getItem("wiz_playersB"), [])));

  const teamLabelA = teamNameA.trim() || "Equipa A";
  const teamLabelB = teamNameB.trim() || "Equipa B";

  function saveNames() {
    localStorage.setItem("wiz_teamA", teamNameA);
    localStorage.setItem("wiz_teamB", teamNameB);
    localStorage.setItem("wiz_playersA", JSON.stringify(normalizePlayers(playersA)));
    localStorage.setItem("wiz_playersB", JSON.stringify(normalizePlayers(playersB)));
    setShowOverlay(false);
  }

  function handleMenu() {
    if (view === "play") {
      setPaused(false); setShowOverlay(false); setGameOver(false); setWinnerTeam(null);
      setToast(""); setLastAction("neutral"); setCurrentCard(null);
      setPhase("countdown"); setCountdownLeft(COUNTDOWN_SECONDS); setTimeLeft(ROUND_SECONDS);
      setView("setup"); return;
    }
    onBack();
  }

  const [hasSensorPermission, setHasSensorPermission] = useState(false);
  const [team, setTeam] = useState("A");
  const teamRef = useRef("A");
  useEffect(() => { teamRef.current = team; }, [team]);

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const scoreARef = useRef(0);
  const scoreBRef = useRef(0);
  useEffect(() => { scoreARef.current = scoreA; }, [scoreA]);
  useEffect(() => { scoreBRef.current = scoreB; }, [scoreB]);

  const deckRef = useRef([]);
  const deckIndexRef = useRef(0);

  const [phase, setPhase] = useState("countdown");
  const [switchLeft, setSwitchLeft] = useState(SWITCH_MESSAGE_SECONDS);
  const [countdownLeft, setCountdownLeft] = useState(COUNTDOWN_SECONDS);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [currentCard, setCurrentCard] = useState(null);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState(null);

  const playersAList = useMemo(() => nonEmptyPlayers(playersA), [playersA]);
  const playersBList = useMemo(() => nonEmptyPlayers(playersB), [playersB]);
  const idxARef = useRef(-1);
  const idxBRef = useRef(-1);
  const [nextPerson, setNextPerson] = useState("");
  const [nextGroup, setNextGroup] = useState("");
  const isFirstStartRef = useRef(true);
  const canTriggerRef = useRef(true);
  const [lastAction, setLastAction] = useState("neutral");
  const [toast, setToast] = useState("");
  const [confettiPieces, setConfettiPieces] = useState([]);

  const bgMode = useMemo(() => {
    if (lastAction === "up") return "ok";
    if (lastAction === "down") return "bad";
    return "neutral";
  }, [lastAction]);

  function getTeamLabel(t) { return t === "A" ? teamLabelA : teamLabelB; }

  function pickNextForTeam(t, doAdvance) {
    const list = t === "A" ? playersAList : playersBList;
    const group = getTeamLabel(t);
    if (!list.length) return { person: group, group: "" };
    const idxRef = t === "A" ? idxARef : idxBRef;
    const ni = (idxRef.current + 1) % list.length;
    if (doAdvance) idxRef.current = ni;
    return { person: list[ni], group };
  }

  function setNextUpForTeam(t, advance) {
    const { person, group } = pickNextForTeam(t, advance);
    setNextPerson(person); setNextGroup(group);
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

  function endGame(winner) {
    setGameOver(true); setWinnerTeam(winner); setPaused(false);
    setToast(""); setLastAction("neutral"); setCurrentCard(null);
  }

  function handleShare() {
    const team = winnerTeam === "A" ? teamLabelA : teamLabelB;
    const msg = `🏆 A equipa *${team}* venceu o Who Is Who no MZ Party Games! 🇲🇿\nJoga tu também!`;
    if (navigator.share) {
      navigator.share({ text: msg }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
  }

  function addPointAndMaybeWin() {
    if (teamRef.current === "A") {
      const n = scoreARef.current + 1; scoreARef.current = n; setScoreA(n);
      if (n >= WIN_POINTS) { endGame("A"); return true; }
    } else {
      const n = scoreBRef.current + 1; scoreBRef.current = n; setScoreB(n);
      if (n >= WIN_POINTS) { endGame("B"); return true; }
    }
    return false;
  }

  function startCountdownForTeam(t, adv) {
    setTeam(t); teamRef.current = t;
    setPhase("countdown"); setCountdownLeft(COUNTDOWN_SECONDS); setTimeLeft(ROUND_SECONDS);
    setCurrentCard(null); canTriggerRef.current = true; setLastAction("neutral"); setToast("");
    setNextUpForTeam(t, adv); advanceItem();
  }

  function beginSwitchMessage(nt) {
    isFirstStartRef.current = false;
    setTeam(nt); teamRef.current = nt;
    setPhase("switch"); setSwitchLeft(SWITCH_MESSAGE_SECONDS);
    setCurrentCard(null); canTriggerRef.current = true; setLastAction("neutral"); setToast("");
    setNextUpForTeam(nt, true); advanceItem();
  }

  function beginStartMessage(ft) {
    isFirstStartRef.current = true;
    setTeam(ft); teamRef.current = ft;
    setPhase("switch"); setSwitchLeft(START_MESSAGE_SECONDS);
    setCurrentCard(null); canTriggerRef.current = true; setLastAction("neutral"); setToast("");
    setNextUpForTeam(ft, true); advanceItem();
  }

  function startGameInternal(catKey) {
    const chosen = catKey || categoryKey;
    setGameOver(false); setWinnerTeam(null);
    idxARef.current = -1; idxBRef.current = -1;
    deckRef.current = shuffle(buildDeck(chosen)); deckIndexRef.current = 0;
    scoreARef.current = 0; scoreBRef.current = 0; setScoreA(0); setScoreB(0);
    setPaused(false); setView("play"); beginStartMessage("A");
  }

  async function startWithPermission(catKey) {
    setCategoryKey(catKey);
    const canAskMotion = typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function";
    const canAskOrientation = typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function";
    if (canAskMotion || canAskOrientation) {
      if (!window.isSecureContext) { setHasSensorPermission(false); startGameInternal(catKey); return; }
      try {
        let granted = false;
        if (canAskMotion) granted = (await DeviceMotionEvent.requestPermission()) === "granted";
        if (canAskOrientation) {
          try { granted = granted || (await DeviceOrientationEvent.requestPermission()) === "granted"; } catch {}
        }
        setHasSensorPermission(granted); startGameInternal(catKey); return;
      } catch { setHasSensorPermission(false); startGameInternal(catKey); return; }
    }
    setHasSensorPermission(true); startGameInternal(catKey);
  }

  useEffect(() => {
    if (view !== "play" || phase !== "switch" || paused || gameOver) return;
    const id = setInterval(() => setSwitchLeft((s) => {
      if (s <= 1) { clearInterval(id); startCountdownForTeam(teamRef.current, false); return SWITCH_MESSAGE_SECONDS; }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

  useEffect(() => {
    if (view !== "play" || phase !== "countdown" || paused || gameOver) return;
    const id = setInterval(() => setCountdownLeft((c) => {
      if (c <= 1) { clearInterval(id); setPhase("play"); showCurrentItem(); return COUNTDOWN_SECONDS; }
      return c - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

  useEffect(() => {
    if (view !== "play" || phase !== "play" || paused || gameOver) return;
    const id = setInterval(() => setTimeLeft((t) => {
      if (t <= 1) { clearInterval(id); const nt = teamRef.current === "A" ? "B" : "A"; setTimeout(() => beginSwitchMessage(nt), 200); return ROUND_SECONDS; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

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
        canTriggerRef.current = false; lastAt = now;
        setLastAction("down"); setToast("❌"); advanceItem(); return;
      }
      if (delta <= -TRIGGER) {
        canTriggerRef.current = false; lastAt = now;
        setLastAction("up");
        const won = addPointAndMaybeWin();
        if (!won) { setToast(`✅ +1 ${teamRef.current === "A" ? teamLabelA : teamLabelB}`); advanceItem(); }
      }
    }
    window.addEventListener("devicemotion", onMotion, { capture: true });
    return () => window.removeEventListener("devicemotion", onMotion, { capture: true });
  }, [hasSensorPermission, view, phase, paused, gameOver, teamLabelA, teamLabelB]);

  useEffect(() => {
    if (gameOver) {
      const colors = ["#EF4444","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EC4899","#fff"];
      setConfettiPieces(Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: colors[i % colors.length],
        size: 7 + Math.random() * 7,
        round: Math.random() > 0.5,
        dur: 1.5 + Math.random() * 2,
        delay: Math.random() * 1.8,
      })));
    } else {
      setConfettiPieces([]);
    }
  }, [gameOver]);

  // ── SETUP ──
  if (view === "setup") {
    const hasAnyNames = teamNameA.trim() || teamNameB.trim() ||
      playersA.some((p) => p.trim()) || playersB.some((p) => p.trim());

    return (
      <div className="appBg">
        <div className="shell whoShell">
          <header className="gameHeader">
            <button className="btnGhost" onClick={handleMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Who Is Who</div>
            </div>
            <button
              type="button"
              onClick={() => setShowOverlay(true)}
              style={{
                background: hasAnyNames ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)",
                border: hasAnyNames ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.13)",
                borderRadius: 12, padding: "6px 12px", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              👥 Nomes
            </button>
          </header>

          <div className="whoSetupShell">
            <div className="whoSetupScroll" style={{ paddingBottom: 16 }}>
              {SECTIONS.map((sec) => (
                <div key={sec.id} style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.38)",
                    marginBottom: 10, paddingLeft: 2,
                  }}>
                    {sec.label}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {sec.cats.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        disabled={c.locked}
                        onClick={() => !c.locked && startWithPermission(c.key)}
                        style={{
                          border: categoryKey === c.key ? "2.5px solid rgba(255,255,255,0.9)" : "2.5px solid transparent",
                          borderRadius: 18,
                          padding: "16px 10px 13px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          cursor: c.locked ? "not-allowed" : "pointer",
                          position: "relative",
                          background: c.bg,
                          boxShadow: `0 4px 20px ${c.shadow}`,
                          opacity: c.locked ? 0.38 : 1,
                          WebkitTapHighlightColor: "transparent",
                          minHeight: 108,
                          transition: "transform 0.12s, box-shadow 0.12s",
                        }}
                      >
                        <div style={{ fontSize: 34, lineHeight: 1 }}>{c.emoji}</div>
                        <div style={{
                          fontSize: 13, fontWeight: 800, color: "#fff",
                          textAlign: "center", lineHeight: 1.2, letterSpacing: "-0.01em",
                        }}>
                          {c.title}
                        </div>
                        <div style={{
                          fontSize: 10, color: "rgba(255,255,255,0.72)",
                          textAlign: "center", lineHeight: 1.3,
                        }}>
                          {c.sub}
                        </div>
                        {c.locked && (
                          <div style={{
                            position: "absolute", top: 7, right: 8,
                            fontSize: 9, fontWeight: 700,
                            background: "rgba(255,255,255,0.15)",
                            borderRadius: 6, padding: "2px 6px", color: "#fff",
                          }}>
                            🔒 Em breve
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Dock minimalista */}
            <div className="whoSetupDock">
              <div style={{
                textAlign: "center", color: "rgba(255,255,255,0.45)",
                fontSize: 11, letterSpacing: "0.01em",
              }}>
                Levanta ✅ acertou &nbsp;·&nbsp; Baixa ❌ passa &nbsp;·&nbsp; Toca para pausar
              </div>
            </div>
          </div>

          {showOverlay && typeof document !== "undefined" && createPortal(
            <div className="modalOverlay" onClick={() => setShowOverlay(false)}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="panel" style={{ width: "100%", maxWidth: 520 }}>
                  <div className="panelTitle">Nomes (opcional)</div>
                  <div className="namesGrid">
                    <div>
                      <div style={{ fontWeight: 900, marginBottom: 6, opacity: 0.9 }}>Equipa A</div>
                      <input className="nameInput" placeholder="Nome da Equipa A" value={teamNameA} onChange={(e) => setTeamNameA(e.target.value)} />
                      {playersA.map((v, i) => (
                        <input key={`pa-${i}`} className="nameInput" placeholder={`Participante A${i + 1}`} value={v}
                          onChange={(e) => { const n = [...playersA]; n[i] = e.target.value; setPlayersA(n); }} />
                      ))}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, marginBottom: 6, opacity: 0.9 }}>Equipa B</div>
                      <input className="nameInput" placeholder="Nome da Equipa B" value={teamNameB} onChange={(e) => setTeamNameB(e.target.value)} />
                      {playersB.map((v, i) => (
                        <input key={`pb-${i}`} className="nameInput" placeholder={`Participante B${i + 1}`} value={v}
                          onChange={(e) => { const n = [...playersB]; n[i] = e.target.value; setPlayersB(n); }} />
                      ))}
                    </div>
                  </div>
                  <div className="modalActions">
                    <button className="btnPrimary" onClick={saveNames} type="button">Guardar</button>
                    <button className="btnGhost" onClick={() => setShowOverlay(false)} type="button">Cancelar</button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    );
  }

  // ── PLAY ──
  const winnerLabel = winnerTeam === "A" ? teamLabelA : winnerTeam === "B" ? teamLabelB : "";

  return (
    <>
      {gameOver && (
        <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      )}
      {confettiPieces.map(p => (
        <div key={p.id} style={{position:"fixed",top:-20,left:`${p.left}%`,width:p.size,height:p.size,background:p.color,borderRadius:p.round?"50%":3,animation:`confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,zIndex:9999,pointerEvents:"none"}} />
      ))}
      <div className="appBg">
      <div className="shell whoShell">
        <header className="gameHeader">
          <button className="btnGhost" onClick={handleMenu} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Who Is Who</div>
          </div>
          <div className="timerPill">
            {gameOver ? "🏁" : paused ? "⏸" : phase === "switch" ? "🔁" : phase === "countdown" ? `${countdownLeft}s` : `${timeLeft}s`}
          </div>
        </header>

        <div className="gameMain">
          <div className="scoreRow">
            <div className={`scoreBox ${team === "A" ? "active" : "inactive"}`}>
              <div className="scoreLabel">{teamLabelA}</div>
              <div className="scoreNum">{scoreA}</div>
            </div>
            <div className={`scoreBox ${team === "B" ? "active" : "inactive"}`}>
              <div className="scoreLabel">{teamLabelB}</div>
              <div className="scoreNum">{scoreB}</div>
            </div>
          </div>

          <div
            className={`whoStage ${bgMode} cat-${categoryKey}`}
            onClick={() => {
              if (gameOver) return;
              setPaused((p) => !p); setToast(""); setLastAction("neutral"); canTriggerRef.current = true;
            }}
            role="button" tabIndex={0} onKeyDown={() => {}}
          >
            {currentCard?.type === "img" && !gameOver && !paused && phase === "play" && (
              <>
                <div className="whoImgFullOffline">
                  <img src={currentCard.src} alt="who" onError={(e) => { e.target.style.display = "none"; }} />
                </div>
                <div className="whoImgGradient" />
              </>
            )}
            <div className="whoStageInner">
              {gameOver ? (
                <>
                  <div className="whoBig">🏆 {winnerLabel}</div>
                  <div className="whoSmall">Venceu com {WIN_POINTS} pontos.</div>
                  <div style={{ width: "min(78vw,520px)", display: "grid", gap: 10 }}>
                    <button className="btnPrimary" type="button" onClick={() => startGameInternal(categoryKey)}>Jogar outra vez</button>
                    <button type="button" onClick={handleShare} style={{background:"#25D366",border:"none",borderRadius:14,padding:"14px 0",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer"}}>📤 Partilhar resultado</button>
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
                  <div className="whoBig" style={{ fontSize: "clamp(22px,5vw,48px)" }}>Agora é:</div>
                  <div className="whoBig" style={{ fontSize: "clamp(26px,6vw,60px)", maxWidth: "min(78vw,520px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextPerson}</div>
                  {nextGroup ? <div className="whoSmall" style={{ maxWidth: "min(78vw,520px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextGroup}</div> : null}
                  {isFirstStartRef.current ? <div className="whoSmall">Posiciona o telefone na testa e deixa a equipa dar dicas.</div> : null}
                </>
              ) : phase === "countdown" ? (
                <>
                  <div className="whoBig">Pronto… {countdownLeft}</div>
                  <div className="whoSmall" style={{ maxWidth: "min(78vw,520px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Agora: <b>{nextPerson}</b>{nextGroup ? ` — ${nextGroup}` : ""}
                  </div>
                </>
              ) : currentCard?.type === "img" ? null : (
                <div className="whoCardText">
                  {currentCard?.value ?? ""}
                </div>
              )}
              {toast ? <div className="whoToast">{toast}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
