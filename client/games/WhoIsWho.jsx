import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * =========================
 * CONFIG
 * =========================
 */
const ROUND_SECONDS = 45;
const READY_SECONDS = 3; // 3..2..1 antes de começar
const SCOREBOARD_MS = 1800;

const WIN_SCORE = 30; // podes mudar depois
const MAX_NAMES = 4;

/**
 * =========================
 * ITENS (TUDO AQUI DENTRO)
 * =========================
 * Nota: começa pequeno e depois aumentamos.
 * Mantém nomes curtos e fáceis de adivinhar.
 */

// Pessoas & Personagens (global + mix)
const ITEMS_PEOPLE = [
  "Michael Jackson",
  "Cristiano Ronaldo",
  "Lionel Messi",
  "Nelson Mandela",
  "Barack Obama",
  "Harry Potter",
  "Batman",
  "Homem-Aranha",
  "James Bond",
  "Rihanna",
  "Beyoncé",
  "Eminem",
  "Bob Marley",
  "Leonardo da Vinci",
  "Albert Einstein",
  "Usain Bolt",
];

// Objetos & Coisas
const ITEMS_THINGS = [
  "Pizza",
  "Telemóvel",
  "Carro",
  "Avião",
  "Óculos",
  "Chocolate",
  "Wi-Fi",
  "Netflix",
  "WhatsApp",
  "Relógio",
  "Bola",
  "Livro",
  "Fones",
  "Chave",
  "Mochila",
];

// MZ Mix (pessoas/lugares/coisas)
const ITEMS_MZ = [
  "Moçambique",
  "Maputo",
  "Matola",
  "Beira",
  "Nampula",
  "Xima",
  "Matapa",
  "Capulana",
  "Chapa",
  "Marrabenta",
  "Gorongosa",
  "Avenida 25 de Setembro",
  "Jardim Tunduru",
  "UEM",
  "FEIMA",
];

/**
 * Mix Total (padrão)
 * — mistura tudo + remove duplicados automaticamente
 */
function unique(arr) {
  return [...new Set(arr)];
}
const ITEMS_MIX = unique([...ITEMS_PEOPLE, ...ITEMS_THINGS, ...ITEMS_MZ]);

/**
 * =========================
 * HELPERS
 * =========================
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// iPhone (Safari) precisa de permissão para sensores
async function requestMotionPermissionIfNeeded() {
  try {
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      const res = await DeviceMotionEvent.requestPermission();
      return res === "granted";
    }
    return true; // Android/desktop geralmente ok
  } catch {
    return false;
  }
}

// Hook: levantar/baixar (face up/down)
function usePhoneFlip({ enabled, onFaceUp, onFaceDown }) {
  const lastRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;

      const z = a.z ?? 0;
      const now = Date.now();

      // anti-duplicar
      if (now - lastRef.current < 650) return;

      // z ~ +9.8 quando ecrã para cima; z ~ -9.8 quando ecrã para baixo
      if (z > 8) {
        lastRef.current = now;
        onFaceUp?.();
      } else if (z < -8) {
        lastRef.current = now;
        onFaceDown?.();
      }
    };

    window.addEventListener("devicemotion", handler, { passive: true });
    return () => window.removeEventListener("devicemotion", handler);
  }, [enabled, onFaceUp, onFaceDown]);
}

/**
 * Som (um contexto) + warmup
 */
function useAudio() {
  const audioRef = useRef(null);

  function ensureAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!audioRef.current) audioRef.current = new AudioCtx();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  }

  function warmupAudio() {
    try {
      const ctx = ensureAudio();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 1;
      g.gain.value = 0.00001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => o.stop(), 60);
    } catch {}
  }

  function beep(freq = 880, ms = 140, vol = 0.18, type = "square") {
    try {
      const ctx = ensureAudio();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => o.stop(), ms);
    } catch {}
  }

  return { warmupAudio, beep };
}

/**
 * =========================
 * COMPONENT
 * =========================
 */
export default function WhoIsWho({ onBack }) {
  const { warmupAudio, beep } = useAudio();

  // views
  const [view, setView] = useState("setup"); // setup | play

  // categoria
  const [category, setCategory] = useState("MIX"); // MIX | PEOPLE | THINGS | MZ

  // nomes opcional (até 6)
  const [teamANames, setTeamANames] = useState(Array(MAX_NAMES).fill(""));
  const [teamBNames, setTeamBNames] = useState(Array(MAX_NAMES).fill(""));

  function cleanNames(arr) {
    return arr.map((s) => (s ?? "").trim()).filter(Boolean).slice(0, MAX_NAMES);
  }
  const cleanA = useMemo(() => cleanNames(teamANames), [teamANames]);
  const cleanB = useMemo(() => cleanNames(teamBNames), [teamBNames]);

  // deck por categoria
  const items = useMemo(() => {
    if (category === "PEOPLE") return ITEMS_PEOPLE;
    if (category === "THINGS") return ITEMS_THINGS;
    if (category === "MZ") return ITEMS_MZ;
    return ITEMS_MIX; // default
  }, [category]);

  const deckRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [current, setCurrent] = useState("");

  // jogo
  const [team, setTeam] = useState("A");
  const teamRef = useRef("A");
  useEffect(() => {
    teamRef.current = team;
  }, [team]);

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winner, setWinner] = useState(null);

  // rodízio de nomes
  const [nameIdxA, setNameIdxA] = useState(0);
  const [nameIdxB, setNameIdxB] = useState(0);

  function currentPlayerName() {
    const list = team === "A" ? cleanA : cleanB;
    const nidx = team === "A" ? nameIdxA : nameIdxB;
    return list.length ? list[nidx % list.length] : null;
  }

  // fases / timer
  const [phase, setPhase] = useState("ready"); // ready | play
  const [readyLeft, setReadyLeft] = useState(READY_SECONDS);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  const [showScoreboard, setShowScoreboard] = useState(false);
  const switchTimeoutRef = useRef(null);

  // histórico para desfazer (última ação)
  // { item, action: "correct"|"pass", team }
  const [history, setHistory] = useState([]);

  function initDeckAndFirst() {
    deckRef.current = shuffle(items);
    setIdx(0);
    setCurrent(deckRef.current?.[0] ?? "");
  }

  function drawNext() {
    const d = deckRef.current;
    if (!d) return;

    const next = idx + 1;
    if (next >= d.length) {
      alert("Acabou o baralho desta categoria! Adiciona mais itens 🙂");
      return;
    }
    setIdx(next);
    setCurrent(d[next]);
  }

  function checkWinner(nextA, nextB) {
    if (nextA >= WIN_SCORE) setWinner("A");
    if (nextB >= WIN_SCORE) setWinner("B");
  }

  function addPointForCurrentTeam() {
    const cur = teamRef.current;
    if (cur === "A") {
      setScoreA((s) => {
        const n = s + 1;
        checkWinner(n, scoreB);
        return n;
      });
    } else {
      setScoreB((s) => {
        const n = s + 1;
        checkWinner(scoreA, n);
        return n;
      });
    }
  }

  function handleCorrect(source = "btn") {
    if (winner) return;
    if (phase !== "play") return;

    // som acerto
    beep(980, 90, 0.18);

    setHistory((h) => [...h, { item: current, action: "correct", team: teamRef.current }]);
    addPointForCurrentTeam();
    drawNext();
  }

  function handlePass() {
    if (winner) return;
    if (phase !== "play") return;

    // som passar (mais neutro)
    beep(520, 70, 0.12, "sine");

    setHistory((h) => [...h, { item: current, action: "pass", team: teamRef.current }]);
    drawNext();
  }

  function undoLast() {
    if (winner) return;
    if (phase !== "play") return;

    setHistory((h) => {
      if (!h.length) return h;

      const last = h[h.length - 1];

      // volta para item anterior (precisamos voltar idx - 1)
      setIdx((old) => Math.max(0, old - 1));
      const d = deckRef.current;
      if (d) {
        const prevIndex = Math.max(0, idx - 1);
        setCurrent(d[prevIndex] ?? current);
      }

      // se foi correct, tira ponto do time daquela ação (não do time atual)
      if (last.action === "correct") {
        if (last.team === "A") setScoreA((s) => Math.max(0, s - 1));
        else setScoreB((s) => Math.max(0, s - 1));
      }

      beep(420, 110, 0.15);
      return h.slice(0, -1);
    });
  }

  function startNewTurn(nextTeam) {
    setTeam(nextTeam);
    if (nextTeam === "A") setNameIdxA((x) => x + 1);
    else setNameIdxB((x) => x + 1);

    setPhase("ready");
    setReadyLeft(READY_SECONDS);
    setTimeLeft(ROUND_SECONDS);
  }

  function endRoundAuto() {
    if (winner) return;

    const cur = teamRef.current;
    const nextTeam = cur === "A" ? "B" : "A";

    // som fim de tempo (grave)
    beep(220, 260, 0.22);

    setShowScoreboard(true);

    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    switchTimeoutRef.current = setTimeout(() => {
      setShowScoreboard(false);
      startNewTurn(nextTeam);
    }, SCOREBOARD_MS);
  }

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    };
  }, []);

  // READY countdown 3..2..1
  useEffect(() => {
    if (view !== "play") return;
    if (winner) return;
    if (phase !== "ready") return;

    const id = setInterval(() => {
      setReadyLeft((r) => {
        if (r <= 1) {
          clearInterval(id);
          setPhase("play");
          // som início de round
          beep(880, 120, 0.16);
          return READY_SECONDS;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [view, phase, winner]);

  // PLAY countdown 45..0
  useEffect(() => {
    if (view !== "play") return;
    if (winner) return;
    if (phase !== "play") return;

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          endRoundAuto();
          return ROUND_SECONDS;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [view, phase, winner]);

  // Levantar/baixar (se permitido)
  const flipEnabled = view === "play" && phase === "play" && !winner && !showScoreboard;

  usePhoneFlip({
    enabled: flipEnabled,
    onFaceUp: () => handleCorrect("flip"),
    onFaceDown: () => handlePass(),
  });

  function restartGame() {
    setWinner(null);
    setTeam("A");
    setScoreA(0);
    setScoreB(0);
    setNameIdxA(0);
    setNameIdxB(0);
    setHistory([]);

    initDeckAndFirst();

    setPhase("ready");
    setReadyLeft(READY_SECONDS);
    setTimeLeft(ROUND_SECONDS);
  }

  async function onStartFromSetup() {
    warmupAudio();
    beep(880, 140, 0.18);

    await requestMotionPermissionIfNeeded();

    // init jogo
    setWinner(null);
    setTeam("A");
    setScoreA(0);
    setScoreB(0);
    setNameIdxA(0);
    setNameIdxB(0);
    setHistory([]);

    initDeckAndFirst();

    setPhase("ready");
    setReadyLeft(READY_SECONDS);
    setTimeLeft(ROUND_SECONDS);

    setView("play");
  }

  const player = currentPlayerName();

  /**
   * =========================
   * UI (sem scroll)
   * =========================
   */
  const styles = {
    appBg: {
      height: "100dvh",
      overflow: "hidden",
      background:
        "radial-gradient(1200px 700px at 20% 0%, rgba(123,92,255,.18), transparent 60%)," +
        "radial-gradient(900px 600px at 80% 10%, rgba(0,255,170,.10), transparent 60%)," +
        "#07080c",
      color: "#fff",
      display: "flex",
      justifyContent: "center",
      padding: 14,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    },
    shell: {
      width: "100%",
      maxWidth: 760,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    card: {
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 18,
      boxShadow: "0 10px 30px rgba(0,0,0,.35)",
      overflow: "hidden",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: "12px 12px",
    },
    btnGhost: {
      border: "1px solid rgba(255,255,255,.14)",
      background: "rgba(255,255,255,.06)",
      color: "#fff",
      padding: "10px 12px",
      borderRadius: 999,
      fontWeight: 800,
      cursor: "pointer",
    },
    titleBlock: { display: "flex", flexDirection: "column", lineHeight: 1.1 },
    brand: { fontSize: 12, opacity: 0.78, fontWeight: 700 },
    gameTitle: { fontSize: 16, fontWeight: 900, letterSpacing: 0.2 },
    timerPill: {
      padding: "10px 12px",
      borderRadius: 999,
      fontWeight: 900,
      border: "1px solid rgba(255,255,255,.14)",
      background: "rgba(0,0,0,.25)",
      minWidth: 92,
      textAlign: "center",
    },
    main: {
      flex: "1 1 auto",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    scoreRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      padding: "0 2px",
    },
    scoreBox: (active) => ({
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,.10)",
      background: active ? "rgba(123,92,255,.16)" : "rgba(0,0,0,.20)",
    }),
    scoreLabel: { fontSize: 12, opacity: 0.82, fontWeight: 800 },
    scoreNum: { fontSize: 26, fontWeight: 900, marginTop: 3, lineHeight: 1 },
    turnRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 10,
      padding: "0 2px",
    },
    turnText: { fontWeight: 900 },
    muted: { opacity: 0.75, fontWeight: 700 },
    bigWordCard: {
      flex: "1 1 auto",
      minHeight: 0,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,.08)",
      background: "rgba(0,0,0,.28)",
      padding: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    },
    bigWordWrap: { maxWidth: 680, width: "100%" },
    youAre: { fontSize: 13, letterSpacing: 1.6, opacity: 0.75, fontWeight: 900 },
    bigWord: {
      marginTop: 10,
      fontSize: 44,
      fontWeight: 1000,
      letterSpacing: 0.4,
      lineHeight: 1.05,
      textTransform: "uppercase",
      wordBreak: "break-word",
    },
    dock: {
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,.08)",
      background: "rgba(0,0,0,.25)",
      padding: 12,
      display: "grid",
      gap: 10,
    },
    dockRow2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    btnPrimary: {
      border: "1px solid rgba(255,255,255,.14)",
      background:
        "linear-gradient(135deg, rgba(123,92,255,.95), rgba(0,255,170,.55))",
      color: "#fff",
      padding: "14px 14px",
      borderRadius: 14,
      fontWeight: 1000,
      cursor: "pointer",
      textAlign: "center",
    },
    btnSoft: {
      border: "1px solid rgba(255,255,255,.14)",
      background: "rgba(255,255,255,.06)",
      color: "#fff",
      padding: "14px 14px",
      borderRadius: 14,
      fontWeight: 950,
      cursor: "pointer",
      textAlign: "center",
    },
    btnDanger: {
      border: "1px solid rgba(255,120,120,.25)",
      background: "rgba(255,80,80,.18)",
      color: "#fff",
      padding: "14px 14px",
      borderRadius: 14,
      fontWeight: 950,
      cursor: "pointer",
      textAlign: "center",
    },
    disabled: { opacity: 0.55, cursor: "not-allowed" },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },
    overlayCard: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(10,12,18,.92)",
      padding: 16,
      textAlign: "center",
    },
    overlayTitle: { fontSize: 16, fontWeight: 1000 },
    overlayLine: { marginTop: 8, fontSize: 14, opacity: 0.9 },
    hint: { marginTop: 10, opacity: 0.7, fontSize: 12 },
    setupPanel: {
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    segRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    segRow2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    segBtn: (on) => ({
      border: "1px solid rgba(255,255,255,.14)",
      background: on ? "rgba(123,92,255,.18)" : "rgba(255,255,255,.06)",
      color: "#fff",
      padding: "12px 12px",
      borderRadius: 14,
      fontWeight: 950,
      cursor: "pointer",
      textAlign: "left",
    }),
    inputsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    inputCol: { display: "flex", flexDirection: "column", gap: 8 },
    input: {
      width: "100%",
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,.14)",
      background: "rgba(0,0,0,.25)",
      color: "#fff",
      outline: "none",
    },
    smallText: { fontSize: 12, opacity: 0.75 },
  };

  // ====== SETUP ======
  if (view === "setup") {
    return (
      <div style={styles.appBg}>
        <div style={styles.shell}>
          <div style={{ ...styles.card }}>
            <div style={styles.header}>
              <button style={styles.btnGhost} onClick={onBack}>
                ← Menu
              </button>

              <div style={styles.titleBlock}>
                <div style={styles.brand}>MZ Party Games</div>
                <div style={styles.gameTitle}>Quem Sou Eu?</div>
              </div>

              <div style={styles.timerPill}>⏱️ 45s</div>
            </div>

            <div style={styles.setupPanel}>
              <div style={{ fontWeight: 900, opacity: 0.9 }}>Categoria</div>

              <div style={styles.segRow}>
                <button
                  style={styles.segBtn(category === "MIX")}
                  onClick={() => setCategory("MIX")}
                >
                  🎲 Mix Total (padrão)
                  <div style={styles.smallText}>pessoas + personagens + coisas + MZ</div>
                </button>
                <button
                  style={styles.segBtn(category === "PEOPLE")}
                  onClick={() => setCategory("PEOPLE")}
                >
                  👤 Pessoas & Personagens
                  <div style={styles.smallText}>celebs + históricos + filmes</div>
                </button>
              </div>

              <div style={styles.segRow2}>
                <button
                  style={styles.segBtn(category === "THINGS")}
                  onClick={() => setCategory("THINGS")}
                >
                  🧱 Objetos & Coisas
                  <div style={styles.smallText}>objetos + comida + tech</div>
                </button>
                <button
                  style={styles.segBtn(category === "MZ")}
                  onClick={() => setCategory("MZ")}
                >
                  🇲🇿 MZ Mix
                  <div style={styles.smallText}>lugares + cultura + cenas locais</div>
                </button>
              </div>

              <div style={{ marginTop: 6, fontWeight: 900, opacity: 0.9 }}>
                Nomes (opcional) — até {MAX_NAMES} por equipa
              </div>

              <div style={styles.inputsGrid}>
                <div style={styles.inputCol}>
                  <div style={styles.smallText}>Equipa A</div>
                  {teamANames.map((v, i) => (
                    <input
                      key={i}
                      style={styles.input}
                      placeholder={`Jogador A${i + 1}`}
                      value={v}
                      onChange={(e) => {
                        const copy = [...teamANames];
                        copy[i] = e.target.value;
                        setTeamANames(copy);
                      }}
                    />
                  ))}
                </div>

                <div style={styles.inputCol}>
                  <div style={styles.smallText}>Equipa B</div>
                  {teamBNames.map((v, i) => (
                    <input
                      key={i}
                      style={styles.input}
                      placeholder={`Jogador B${i + 1}`}
                      value={v}
                      onChange={(e) => {
                        const copy = [...teamBNames];
                        copy[i] = e.target.value;
                        setTeamBNames(copy);
                      }}
                    />
                  ))}
                </div>
              </div>

              <button style={styles.btnPrimary} onClick={onStartFromSetup}>
                ▶️ Começar
              </button>

              <div style={styles.smallText}>
                Dica: se o “levantar/baixar” não funcionar no teu iPhone, usa os botões ✅/❌.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== PLAY ======
  return (
    <div style={styles.appBg}>
      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.header}>
            <button style={styles.btnGhost} onClick={onBack}>
              ← Menu
            </button>

            <div style={styles.titleBlock}>
              <div style={styles.brand}>MZ Party Games</div>
              <div style={styles.gameTitle}>Quem Sou Eu?</div>
            </div>

            <div style={styles.timerPill}>
              {phase === "ready" ? `⏳ ${readyLeft}s` : `⏱️ ${timeLeft}s`}
            </div>
          </div>

          <div style={styles.main}>
            <div style={styles.scoreRow}>
              <div style={styles.scoreBox(team === "A")}>
                <div style={styles.scoreLabel}>Equipa A</div>
                <div style={styles.scoreNum}>{scoreA}</div>
              </div>
              <div style={styles.scoreBox(team === "B")}>
                <div style={styles.scoreLabel}>Equipa B</div>
                <div style={styles.scoreNum}>{scoreB}</div>
              </div>
            </div>

            <div style={styles.turnRow}>
              <div style={styles.turnText}>
                {winner ? (
                  <>🏆 Vencedor: Equipa {winner}</>
                ) : (
                  <>
                    Vez da Equipa <b>{team}</b>
                    {player ? <span style={styles.muted}> — {player} explica</span> : null}
                  </>
                )}
              </div>
              <div style={{ opacity: 0.8, fontWeight: 800 }}>Vitória: {WIN_SCORE}</div>
            </div>

            <div style={styles.bigWordCard}>
              <div style={styles.bigWordWrap}>
                <div style={styles.youAre}>
                  {phase === "ready" ? "PREPARAR…" : "EU SOU…"}
                </div>
                <div style={styles.bigWord}>
                  {current || "—"}
                </div>
                <div style={{ marginTop: 10, opacity: 0.72, fontSize: 12 }}>
                  Levanta o telemóvel = ✅ acertou • Baixa = ❌ passar
                </div>
              </div>
            </div>

            <div style={styles.dock}>
              <button
                style={{
                  ...styles.btnPrimary,
                  ...(winner || phase !== "play" ? styles.disabled : null),
                }}
                disabled={winner || phase !== "play"}
                onClick={() => handleCorrect("btn")}
              >
                ✅ ACERTEI
              </button>

              <button
                style={{
                  ...styles.btnSoft,
                  ...(winner || phase !== "play" ? styles.disabled : null),
                }}
                disabled={winner || phase !== "play"}
                onClick={handlePass}
              >
                ❌ PASSAR
              </button>

              <div style={styles.dockRow2}>
                <button
                  style={{
                    ...styles.btnSoft,
                    ...(winner || phase !== "play" || history.length === 0 ? styles.disabled : null),
                  }}
                  disabled={winner || phase !== "play" || history.length === 0}
                  onClick={undoLast}
                >
                  ↩️ DESFAZER
                </button>

                <button style={styles.btnDanger} onClick={restartGame}>
                  🔁 REINICIAR
                </button>
              </div>
            </div>
          </div>
        </div>

        {showScoreboard && !winner ? (
          <div style={styles.overlay}>
            <div style={styles.overlayCard}>
              <div style={styles.overlayTitle}>📊 Placar</div>
              <div style={styles.overlayLine}>
                Equipa A: <b>{scoreA}</b>
              </div>
              <div style={styles.overlayLine}>
                Equipa B: <b>{scoreB}</b>
              </div>
              <div style={styles.hint}>A mudar de vez…</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
