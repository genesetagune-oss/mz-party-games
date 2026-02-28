import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  WHO_TEXT_MIX,
  WHO_TEXT_MZ,
  WHO_TEXT_GLOBAL,
  WHO_PHOTOS_MZ,
} from "./whoiswhoItems.jsx";

// ===== Ajustes =====
const ROUND_SECONDS = 60;
const COUNTDOWN_SECONDS = 3;

// ✅ início: mensagem sem contador (mais longa)
const START_MESSAGE_SECONDS = 6;

// ✅ entre equipas: mensagem sem contador (curta)
const SWITCH_MESSAGE_SECONDS = 6;

const WIN_POINTS = 30;

const MAX_PLAYERS_PER_TEAM = 4;

const CATEGORIES = [
  { key: "mix", title: "🎲 Mix Total", sub: "pessoas + coisas + MZ + global" },
  { key: "mz", title: "🇲🇿 MZ Total", sub: "tudo em texto (MZ)" },
  { key: "mzPic", title: "🖼️ MZ Fotos", sub: "marcas + famosos + lugares (MZ)" },
  { key: "global", title: "🌍 Global", sub: "tudo em texto (global)" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const wrapText = (list) => list.map((t) => ({ type: "text", value: t }));
const wrapPhotos = (list) => list.map((src) => ({ type: "img", src }));

function buildDeck(categoryKey) {
  if (categoryKey === "mzPic") return wrapPhotos(WHO_PHOTOS_MZ);
  if (categoryKey === "mz") return wrapText(WHO_TEXT_MZ);
  if (categoryKey === "global") return wrapText(WHO_TEXT_GLOBAL);
  return wrapText(WHO_TEXT_MIX);
}

// localStorage helpers
function safeParseJSON(str, fallback) {
  try {
    const v = JSON.parse(str);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function normalizePlayers(arr) {
  const base = Array.isArray(arr) ? arr : [];
  const trimmed = base
    .slice(0, MAX_PLAYERS_PER_TEAM)
    .map((s) => String(s ?? ""));
  while (trimmed.length < MAX_PLAYERS_PER_TEAM) trimmed.push("");
  return trimmed;
}
function nonEmptyPlayers(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((s) => String(s ?? "").trim())
    .filter(Boolean);
}
function getWhoFontClamp(text) {
  const len = String(text ?? "").trim().length;

  // Curto = gigante
  if (len <= 6) return "clamp(80px, 18vw, 160px)";
  if (len <= 10) return "clamp(70px, 16vw, 140px)";
  if (len <= 14) return "clamp(60px, 14vw, 120px)";
  if (len <= 18) return "clamp(52px, 12vw, 105px)";

  // Longo = ainda grande, mas seguro
  return "clamp(42px, 10vw, 90px)";
}

export default function WhoIsWho({ onBack }) {
  // ===== Setup =====
  const [view, setView] = useState("setup");
  const [categoryKey, setCategoryKey] = useState("mix");

  // ===== Overlay nomes =====
  const [showOverlay, setShowOverlay] = useState(false);

  const [teamNameA, setTeamNameA] = useState(
    localStorage.getItem("wiz_teamA") || ""
  );
  const [teamNameB, setTeamNameB] = useState(
    localStorage.getItem("wiz_teamB") || ""
  );

  const [playersA, setPlayersA] = useState(() =>
    normalizePlayers(safeParseJSON(localStorage.getItem("wiz_playersA"), []))
  );
  const [playersB, setPlayersB] = useState(() =>
    normalizePlayers(safeParseJSON(localStorage.getItem("wiz_playersB"), []))
  );

  const teamLabelA = teamNameA.trim() || "Equipa A";
  const teamLabelB = teamNameB.trim() || "Equipa B";

  function saveNames() {
    localStorage.setItem("wiz_teamA", teamNameA);
    localStorage.setItem("wiz_teamB", teamNameB);
    localStorage.setItem(
      "wiz_playersA",
      JSON.stringify(normalizePlayers(playersA))
    );
    localStorage.setItem(
      "wiz_playersB",
      JSON.stringify(normalizePlayers(playersB))
    );
    setShowOverlay(false);
  }

  // ✅ MENU premium:
  // - se estiver em play, volta para categorias (setup)
  // - se estiver no setup, volta ao menu principal
  function handleMenu() {
    if (view === "play") {
      setPaused(false);
      setShowOverlay(false);
      setGameOver(false);
      setWinnerTeam(null);
      setToast("");
      setLastAction("neutral");
      setCurrentCard(null);

      setPhase("countdown");
      setCountdownLeft(COUNTDOWN_SECONDS);
      setTimeLeft(ROUND_SECONDS);

      setView("setup");
      return;
    }

    onBack();
  }
  const [cardTick, setCardTick] = useState(0); // (mantive, mesmo não usado)

  // ===== Sensor =====
  const [hasSensorPermission, setHasSensorPermission] = useState(false);

  // ===== Equipas / pontos =====
  const [team, setTeam] = useState("A");
  const teamRef = useRef("A");
  useEffect(() => {
    teamRef.current = team;
  }, [team]);

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const scoreARef = useRef(0);
  const scoreBRef = useRef(0);
  useEffect(() => {
    scoreARef.current = scoreA;
  }, [scoreA]);
  useEffect(() => {
    scoreBRef.current = scoreB;
  }, [scoreB]);

  // ===== Deck =====
  const deckRef = useRef([]);
  const deckIndexRef = useRef(0);

  // ===== Tempo / fases =====
  const [phase, setPhase] = useState("countdown"); // switch | countdown | play
  const [switchLeft, setSwitchLeft] = useState(SWITCH_MESSAGE_SECONDS);
  const [countdownLeft, setCountdownLeft] = useState(COUNTDOWN_SECONDS);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  // ===== Carta =====
  const [currentCard, setCurrentCard] = useState(null);

  // ===== Pausa =====
  const [paused, setPaused] = useState(false);

  // ===== Game over =====
  const [gameOver, setGameOver] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState(null);

  // ===== Participantes (rotação por equipa) =====
  const playersAList = useMemo(() => nonEmptyPlayers(playersA), [playersA]);
  const playersBList = useMemo(() => nonEmptyPlayers(playersB), [playersB]);
  const idxARef = useRef(-1);
  const idxBRef = useRef(-1);

  const [nextPerson, setNextPerson] = useState("");
  const [nextGroup, setNextGroup] = useState("");

  const isFirstStartRef = useRef(true);

  function getTeamLabel(t) {
    return t === "A" ? teamLabelA : teamLabelB;
  }

  function pickNextForTeam(t, doAdvance) {
    const list = t === "A" ? playersAList : playersBList;
    const group = getTeamLabel(t);

    if (!list.length) return { person: group, group: "" };

    if (t === "A") {
      const nextIndex = (idxARef.current + 1) % list.length;
      if (doAdvance) idxARef.current = nextIndex;
      return { person: list[nextIndex], group };
    } else {
      const nextIndex = (idxBRef.current + 1) % list.length;
      if (doAdvance) idxBRef.current = nextIndex;
      return { person: list[nextIndex], group };
    }
  }

  function setNextUpForTeam(t, advance) {
    const { person, group } = pickNextForTeam(t, advance);
    setNextPerson(person);
    setNextGroup(group);
  }

  // ===== anti-spam tilt =====
  const canTriggerRef = useRef(true);

  // ===== feedback =====
  const [lastAction, setLastAction] = useState("neutral");
  const [toast, setToast] = useState("");

  const bgMode = useMemo(() => {
    if (lastAction === "up") return "ok";
    if (lastAction === "down") return "bad";
    return "neutral";
  }, [lastAction]);

  function showCurrentItem() {
    const deck = deckRef.current;
    if (!deck || !deck.length) return;
    setCurrentCard(deck[deckIndexRef.current % deck.length]);
  }

  function advanceItem() {
    const deck = deckRef.current;
    if (!deck || !deck.length) return;
    deckIndexRef.current = (deckIndexRef.current + 1) % deck.length;
    setCurrentCard(deck[deckIndexRef.current]);
  }

  function endGame(winner) {
    setGameOver(true);
    setWinnerTeam(winner);
    setPaused(false);
    setToast("");
    setLastAction("neutral");
    setCurrentCard(null);
  }

  function addPointAndMaybeWin() {
    if (teamRef.current === "A") {
      const newScore = scoreARef.current + 1;
      scoreARef.current = newScore;
      setScoreA(newScore);
      if (newScore >= WIN_POINTS) {
        endGame("A");
        return true;
      }
      return false;
    } else {
      const newScore = scoreBRef.current + 1;
      scoreBRef.current = newScore;
      setScoreB(newScore);
      if (newScore >= WIN_POINTS) {
        endGame("B");
        return true;
      }
      return false;
    }
  }

  function startCountdownForTeam(teamToPlay, advanceParticipant) {
    setTeam(teamToPlay);
    teamRef.current = teamToPlay;

    setPhase("countdown");
    setCountdownLeft(COUNTDOWN_SECONDS);
    setTimeLeft(ROUND_SECONDS);

    setCurrentCard(null);
    canTriggerRef.current = true;
    setLastAction("neutral");
    setToast("");

    setNextUpForTeam(teamToPlay, advanceParticipant);
    advanceItem();
  }

  function beginSwitchMessage(nextTeam) {
    isFirstStartRef.current = false;
    setTeam(nextTeam);
    teamRef.current = nextTeam;

    setPhase("switch");
    setSwitchLeft(SWITCH_MESSAGE_SECONDS);

    setCurrentCard(null);
    canTriggerRef.current = true;
    setLastAction("neutral");
    setToast("");

    setNextUpForTeam(nextTeam, true);
    advanceItem();
  }

  function beginStartMessage(firstTeam) {
    isFirstStartRef.current = true;
    setTeam(firstTeam);
    teamRef.current = firstTeam;

    setPhase("switch");
    setSwitchLeft(START_MESSAGE_SECONDS);

    setCurrentCard(null);
    canTriggerRef.current = true;
    setLastAction("neutral");
    setToast("");

    setNextUpForTeam(firstTeam, true);
    advanceItem();
  }

  function startGameInternal(catKey) {
    const chosen = catKey || categoryKey;

    setGameOver(false);
    setWinnerTeam(null);

    idxARef.current = -1;
    idxBRef.current = -1;

    deckRef.current = shuffle(buildDeck(chosen));
    deckIndexRef.current = 0;

    scoreARef.current = 0;
    scoreBRef.current = 0;
    setScoreA(0);
    setScoreB(0);

    setPaused(false);
    setView("play");

    beginStartMessage("A");
  }

  // ✅ MUDANÇA: pedir permissão também a DeviceMotionEvent (iOS)
  async function startWithPermission(catKey) {
    try {
      setCategoryKey(catKey);

      const needsIOSMotionPermission =
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function";

      const needsIOSOrientationPermission =
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function";

      const needsIOSPermission = needsIOSMotionPermission || needsIOSOrientationPermission;

      if (needsIOSPermission && !window.isSecureContext) {
        setHasSensorPermission(false);
        alert(
          "No iPhone, sensores só funcionam em HTTPS (ex: Vercel). Vou começar sem inclinação."
        );
        startGameInternal(catKey);
        return;
      }

      if (needsIOSMotionPermission) {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== "granted") {
          setHasSensorPermission(false);
          alert(
            "Sem permissão de movimento. Vou começar sem inclinação."
          );
          startGameInternal(catKey);
          return;
        }
      }

      // Opcional: pedir também orientation (não é obrigatório para a lógica nova,
      // mas alguns iPhones ficam mais “consistentes” quando ambos são granted)
      if (needsIOSOrientationPermission) {
        try {
          await DeviceOrientationEvent.requestPermission();
        } catch {
          // ignora
        }
      }

      setHasSensorPermission(true);
      startGameInternal(catKey);
    } catch {
      setHasSensorPermission(false);
      alert("Falha ao pedir permissão. Vou começar sem inclinação.");
      startGameInternal(catKey);
    }
  }

  // ===== SWITCH TIMER =====
  useEffect(() => {
    if (view !== "play") return;
    if (phase !== "switch") return;
    if (paused) return;
    if (gameOver) return;

    const id = setInterval(() => {
      setSwitchLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          startCountdownForTeam(teamRef.current, false);
          return SWITCH_MESSAGE_SECONDS;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

  // ===== COUNTDOWN TIMER =====
  useEffect(() => {
    if (view !== "play") return;
    if (phase !== "countdown") return;
    if (paused) return;
    if (gameOver) return;

    const id = setInterval(() => {
      setCountdownLeft((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase("play");
          showCurrentItem();
          return COUNTDOWN_SECONDS;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

  // ===== ROUND TIMER =====
  useEffect(() => {
    if (view !== "play") return;
    if (phase !== "play") return;
    if (paused) return;
    if (gameOver) return;

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          const nextTeam = teamRef.current === "A" ? "B" : "A";
          setTimeout(() => beginSwitchMessage(nextTeam), 200);
          return ROUND_SECONDS;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [view, phase, paused, gameOver]);

  // ===== SENSOR (MUDANÇA TOTAL): devicemotion + gravity -> "pitch" relativo =====
  useEffect(() => {
    if (!hasSensorPermission) return;
    if (view !== "play") return;
    if (phase !== "play") return;
    if (paused) return;
    if (gameOver) return;

    // Ajusta estes 4 valores para afinar no teu telemóvel
   // Ajuste “perfeito” para “na testa”
const REARM_DEG = 10;       // neutro apertado (rearm)
const TRIGGER_DEG = 26;     // intenção clara
const COOLDOWN_MS = 850;    // anti-bounce
const DIR = -1;             // se estiver invertido, troca para 1

let baseline = null;
let baselineSamples = [];
const BASELINE_MS = 450;
let baselineStart = performance.now();

let lastTriggerAt = 0;

function onMotion(e) {
  const g = e.accelerationIncludingGravity;
  if (!g) return;

  // ... (ax/ay/az, angle, toScreenAxes, pitchDegFromGravity iguais ao que já te mandei)

  const pitch = pitchDegFromGravity(gs);

  // baseline
  if (baseline === null) {
    baselineSamples.push(pitch);
    const nowPerf = performance.now();
    if (nowPerf - baselineStart >= BASELINE_MS && baselineSamples.length >= 8) {
      baseline =
        baselineSamples.reduce((s, v) => s + v, 0) / baselineSamples.length;
    }
    return;
  }

  const delta = (pitch - baseline) * DIR;

  // 1) Rearm SÓ no centro (hysteresis forte)
  if (Math.abs(delta) <= REARM_DEG) {
    canTriggerRef.current = true;
    setLastAction("neutral");
    return;
  }

  // 2) Cooldown + lock
  const now = Date.now();
  if (now - lastTriggerAt < COOLDOWN_MS) return;
  if (!canTriggerRef.current) return;

  // 3) Trigger (intenção clara)
  if (delta >= TRIGGER_DEG) {
    canTriggerRef.current = false;
    lastTriggerAt = now;

    setLastAction("down");
    setToast("❌");
    advanceItem();
    return;
  }

  if (delta <= -TRIGGER_DEG) {
    canTriggerRef.current = false;
    lastTriggerAt = now;

    setLastAction("up");
    const won = addPointAndMaybeWin();
    if (!won) {
      setToast(`✅ +1 ${teamRef.current === "A" ? teamLabelA : teamLabelB}`);
      advanceItem();
    }
  }
}

    window.addEventListener("devicemotion", onMotion, { capture: true });

    return () => {
      window.removeEventListener("devicemotion", onMotion, { capture: true });
    };
  }, [hasSensorPermission, view, phase, paused, gameOver, teamLabelA, teamLabelB]);

  // ===== SETUP UI (Premium / iPhone) =====
  if (view === "setup") {
    const cat = CATEGORIES.find((c) => c.key === categoryKey);
    const hasAnyNames =
      teamNameA.trim() ||
      teamNameB.trim() ||
      playersA.some((p) => p.trim()) ||
      playersB.some((p) => p.trim());

    return (
      <div className="appBg">
        <div className="shell whoShell">
          <header className="gameHeader">
            <button className="btnGhost" onClick={handleMenu} type="button">
              ← Menu
            </button>

            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Who Is Who</div>
            </div>

            <div className="timerPill">{ROUND_SECONDS}s</div>
          </header>

          {/* ✅ Setup premium: lista scroll + dock fixo */}
          <div className="whoSetupShell">
            <div className="whoSetupScroll">
              <div className="panelTitle" style={{ marginBottom: 10 }}>
                Categoria
              </div>

              {/* ✅ Grid estilo 1ª foto */}
              <div className="whoCatsGrid">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={`whoCatTile ${categoryKey === c.key ? "on" : ""}`}
                    onClick={() => startWithPermission(c.key)}
                  >
                    <div className="whoCatTileTitle">{c.title}</div>
                    <div className="whoCatTileSub">{c.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ✅ Dock fixo em baixo (sem “buraco” no iPhone) */}
            <div className="whoSetupDock">
              <div className="whoSetupHintLine">
                <div className="whoSetupHintTitle">{cat?.title}</div>
                <div className="whoSetupHintText">
                  Levanta = ✅ (+1) • Baixa = ❌ (passa) • Toca no meio para pausar
                </div>
              </div>

              
               <button
  className="btnGhost btnNamesGradient"
  style={{ width: "100%" }}
  onClick={() => setShowOverlay(true)}
  type="button"
>👥{" "}
                {hasAnyNames
                  ? "Editar nomes / participantes"
                  : "Adicionar nomes (opcional)"}
</button>
              <div className="whoSetupMeta">
                Início: <b>{START_MESSAGE_SECONDS}s</b> • Troca:{" "}
                <b>{SWITCH_MESSAGE_SECONDS}s</b> • Vitória: <b>{WIN_POINTS}</b>
              </div>
            </div>
          </div>

          {/* ✅ Overlay nomes (portal) */}
          {showOverlay &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                className="modalOverlay"
                onClick={() => setShowOverlay(false)}
              >
                <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                  <div className="panel" style={{ width: "100%", maxWidth: 520 }}>
                    <div className="panelTitle">Nomes (opcional)</div>

                    <div className="namesGrid">
                      <div>
                        <div
                          style={{
                            fontWeight: 900,
                            marginBottom: 6,
                            opacity: 0.9,
                          }}
                        >
                          Equipa A
                        </div>

                        <input
                          className="nameInput"
                          placeholder="Nome da Equipa A"
                          value={teamNameA}
                          onChange={(e) => setTeamNameA(e.target.value)}
                        />

                        {playersA.map((v, i) => (
                          <input
                            key={`pa-${i}`}
                            className="nameInput"
                            placeholder={`Participante A${i + 1}`}
                            value={v}
                            onChange={(e) => {
                              const next = [...playersA];
                              next[i] = e.target.value;
                              setPlayersA(next);
                            }}
                          />
                        ))}
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 900,
                            marginBottom: 6,
                            opacity: 0.9,
                          }}
                        >
                          Equipa B
                        </div>

                        <input
                          className="nameInput"
                          placeholder="Nome da Equipa B"
                          value={teamNameB}
                          onChange={(e) => setTeamNameB(e.target.value)}
                        />

                        {playersB.map((v, i) => (
                          <input
                            key={`pb-${i}`}
                            className="nameInput"
                            placeholder={`Participante B${i + 1}`}
                            value={v}
                            onChange={(e) => {
                              const next = [...playersB];
                              next[i] = e.target.value;
                              setPlayersB(next);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* ✅ ações fixas no fundo do modal */}
                    <div className="modalActions">
                      <button
                        className="btnPrimary"
                        onClick={saveNames}
                        type="button"
                      >
                        Guardar
                      </button>
                      <button
                        className="btnGhost"
                        onClick={() => setShowOverlay(false)}
                        type="button"
                      >
                        Cancelar
                      </button>
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

  // ===== PLAY UI =====
  const winnerLabel =
    winnerTeam === "A" ? teamLabelA : winnerTeam === "B" ? teamLabelB : "";

  return (
    <div className="appBg">
      <div className="shell whoShell">
        <header className="gameHeader">
          <button className="btnGhost" onClick={handleMenu} type="button">
            ← Menu
          </button>

          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Who Is Who</div>
          </div>

          <div className="timerPill">
            {gameOver
              ? "🏁 Fim"
              : paused
              ? "⏸ Pausado"
              : phase === "switch"
              ? "🔁 Troca"
              : phase === "countdown"
              ? `⏳ ${countdownLeft}s`
              : `⏱️ ${timeLeft}s`}
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
              setPaused((p) => !p);
              setToast("");
              setLastAction("neutral");
              canTriggerRef.current = true;
            }}
            role="button"
            tabIndex={0}
            onKeyDown={() => {}}
          >
            <div className="whoStageInner">
              {gameOver ? (
                <>
                  <div className="whoBig">🏆 {winnerLabel}</div>
                  <div className="whoSmall">
                    Venceu com {WIN_POINTS} pontos.
                  </div>

                  <div
                    style={{
                      width: "min(78vw, 520px)",
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <button
                      className="btnPrimary"
                      type="button"
                      onClick={() => startGameInternal(categoryKey)}
                    >
                      Jogar outra vez
                    </button>
                    <button className="btnGhost" type="button" onClick={handleMenu}>
                      Menu
                    </button>
                  </div>
                </>
              ) : paused ? (
                <>
                  <div className="whoBig">⏸ Pausado</div>
                  <div className="whoSmall">Toca no meio para continuar.</div>
                </>
              ) : phase === "switch" ? (
                <>
                  <div
                    className="whoBig"
                    style={{ fontSize: "clamp(22px, 5vw, 48px)" }}
                  >
                    Agora é:
                  </div>

                  <div
                    className="whoBig"
                    style={{
                      fontSize: "clamp(26px, 6vw, 60px)",
                      maxWidth: "min(78vw, 520px)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {nextPerson}
                  </div>

                  {nextGroup ? (
                    <div
                      className="whoSmall"
                      style={{
                        maxWidth: "min(78vw, 520px)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {nextGroup}
                    </div>
                  ) : null}

                  {isFirstStartRef.current ? (
                    <div className="whoSmall">
                      Posiciona o telefone na testa e deixa a equipa dar dicas.
                    </div>
                  ) : null}
                </>
              ) : phase === "countdown" ? (
                <>
                  <div className="whoBig">Pronto… {countdownLeft}</div>

                  <div
                    className="whoSmall"
                    style={{
                      maxWidth: "min(78vw, 520px)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Agora: <b>{nextPerson}</b>
                    {nextGroup ? ` — ${nextGroup}` : ""}
                  </div>
                </>
              ) : currentCard?.type === "img" ? (
                <div className="whoImgWrap">
                  <img className="whoImg" src={currentCard.src} alt="who" />
                </div>
              ) : (
                <div
                  className="whoBig"
                  style={{
                    fontSize: getWhoFontClamp(currentCard?.value ?? ""),
                    maxWidth: "min(86vw, 640px)",
                    lineHeight: 1.05,
                    letterSpacing: "0.2px",
                    padding: "8px 10px",
                    textAlign: "center",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {currentCard?.value ?? ""}
                </div>
              )}

              {toast ? <div className="whoToast">{toast}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}