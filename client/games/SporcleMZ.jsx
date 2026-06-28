import React, { useCallback, useEffect, useRef, useState } from "react";
import { SPORCLE_CATS } from "./sporcleMZData.js";
import { verificarResposta } from "./sporcleMZVerification.js";
import { GameTimer, calcSoloPoints } from "./sporcleMZEngine.js";

const LS_RULES    = "mzpg_sporcle_rules_seen";
const LS_SEEN_IDS = "mzpg_sporcle_seen_ids";
const MAX_SEEN    = 50;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildShuffledQuestions(cat) {
  try {
    const seen = JSON.parse(localStorage.getItem(LS_SEEN_IDS) || "[]");
    return shuffle([
      ...cat.perguntas.filter(q => !seen.includes(q.id)),
      ...cat.perguntas.filter(q =>  seen.includes(q.id)),
    ]);
  } catch {
    return shuffle(cat.perguntas);
  }
}

function markSeen(ids) {
  try {
    const prev = JSON.parse(localStorage.getItem(LS_SEEN_IDS) || "[]");
    const next = [...new Set([...prev, ...ids])].slice(-MAX_SEEN);
    localStorage.setItem(LS_SEEN_IDS, JSON.stringify(next));
  } catch {}
}

// ── Sub-components ────────────────────────────────────────

function TimerBar({ remaining, total }) {
  const pct   = Math.max(0, (remaining / total) * 100);
  const color = remaining > total * 0.5 ? "#00e5b0"
              : remaining > total * 0.2 ? "#f97316"
              : "#ef4444";
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: color, transition: "width .1s linear, background .4s" }} />
    </div>
  );
}

function AnswerSlots({ total, filled }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: 32, height: 32, borderRadius: 8,
          background: i < filled ? "rgba(0,229,176,.18)" : "rgba(255,255,255,.06)",
          border: `1.5px solid ${i < filled ? "rgba(0,229,176,.5)" : "rgba(255,255,255,.12)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, transition: "all .2s",
        }}>
          {i < filled ? "✓" : ""}
        </div>
      ))}
    </div>
  );
}

function FeedbackBanner({ feedback }) {
  if (!feedback) return null;
  const cfg = {
    acerto:    { bg: "rgba(0,200,100,.15)",   border: "rgba(0,200,100,.4)",   text: "#4ade80" },
    quase:     { bg: "rgba(251,191,36,.12)",  border: "rgba(251,191,36,.4)",  text: "#fbbf24" },
    erro:      { bg: "rgba(220,50,50,.12)",   border: "rgba(220,50,50,.4)",   text: "#f87171" },
    duplicado: { bg: "rgba(100,100,100,.12)", border: "rgba(100,100,100,.4)", text: "#9ca3af" },
  }[feedback.tipo] || {};
  return (
    <div style={{
      padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 800,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text,
      textAlign: "center", marginBottom: 8,
    }}>
      {feedback.msg}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function SporcleMZ({ onBack }) {
  const [phase,    setPhase]    = useState("setup");
  const [cat,      setCat]      = useState(null);
  const [qs,       setQs]       = useState([]);
  const [qIdx,     setQIdx]     = useState(0);
  const [input,    setInput]    = useState("");
  const [acertadas,setAcertadas]= useState(new Set());
  const [feedback, setFeedback] = useState(null);
  const [pontos,   setPontos]   = useState(0);
  const [streak,   setStreak]   = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [resultados,setResultados] = useState([]);

  // ── Multi-player ──────────────────────────────────────
  const [nameDrafts,       setNameDrafts]       = useState(Array(6).fill(""));
  const [players,          setPlayers]          = useState([]);
  const [playerScores,     setPlayerScores]     = useState([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  // ──────────────────────────────────────────────────────

  const timerRef        = useRef(new GameTimer());
  const inputRef        = useRef(null);
  const fbTimRef        = useRef(null);
  const qsRef           = useRef([]);
  const qIdxRef         = useRef(0);
  const acertadasRef    = useRef(new Set());
  const qPtsRef         = useRef(0);
  const pontosRef       = useRef(0);
  const streakRef       = useRef(0);
  const handleTimeoutRef= useRef(null);
  // stable refs for callbacks
  const playersRef          = useRef([]);
  const playerScoresRef     = useRef([]);
  const currentPlayerIdxRef = useRef(0);

  useEffect(() => { qsRef.current           = qs;           }, [qs]);
  useEffect(() => { qIdxRef.current         = qIdx;         }, [qIdx]);
  useEffect(() => { acertadasRef.current    = acertadas;    }, [acertadas]);
  useEffect(() => { playersRef.current      = players;      }, [players]);
  useEffect(() => { playerScoresRef.current = playerScores; }, [playerScores]);
  useEffect(() => { currentPlayerIdxRef.current = currentPlayerIdx; }, [currentPlayerIdx]);

  useEffect(() => {
    if (!feedback) return;
    if (fbTimRef.current) clearTimeout(fbTimRef.current);
    const delay = feedback.tipo === "quase" ? 2500 : 900;
    fbTimRef.current = setTimeout(() => {
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }, delay);
    return () => clearTimeout(fbTimRef.current);
  }, [feedback]);

  useEffect(() => () => timerRef.current.stop(), []);

  function handleTimeout() {
    const currentQ = qsRef.current[qIdxRef.current];
    setResultados(prev => [...prev, {
      q:          currentQ,
      acertadas:  new Set(acertadasRef.current),
      pontos:     qPtsRef.current,
      playerName: playersRef.current[currentPlayerIdxRef.current] ?? "?",
    }]);
    advanceQuestion();
  }
  handleTimeoutRef.current = handleTimeout;

  const startTimer = useCallback((q) => {
    if (!q) return;
    timerRef.current.start(
      q.tempo,
      (rem) => setTimeLeft(rem),
      () => handleTimeoutRef.current?.(),
    );
    setTimeLeft(q.tempo);
  }, []);

  function advanceQuestion() {
    timerRef.current.stop();

    // award this turn's points to current player
    const ci     = currentPlayerIdxRef.current;
    const scores = [...playerScoresRef.current];
    scores[ci]   = (scores[ci] || 0) + qPtsRef.current;
    setPlayerScores(scores);
    playerScoresRef.current = scores;

    const nextQIdx = qIdxRef.current + 1;
    qIdxRef.current = nextQIdx;

    if (nextQIdx >= qsRef.current.length) {
      markSeen(qsRef.current.map(q => q.id));
      setPhase("finished");
      return;
    }

    setQIdx(nextQIdx);
    setAcertadas(new Set());
    acertadasRef.current = new Set();
    qPtsRef.current   = 0;
    pontosRef.current = 0;
    setPontos(0);
    streakRef.current = 0;
    setStreak(0);
    setInput("");
    setFeedback(null);

    const nextPlayerIdx = (ci + 1) % playersRef.current.length;
    setCurrentPlayerIdx(nextPlayerIdx);
    currentPlayerIdxRef.current = nextPlayerIdx;
    setPhase("passPhone");
  }

  function startCat(selectedCat) {
    const cleanNames = nameDrafts.map(n => n.trim()).filter(n => n.length > 0);
    const initScores = Array(cleanNames.length).fill(0);

    setPlayers(cleanNames);
    setPlayerScores(initScores);
    setCurrentPlayerIdx(0);
    playersRef.current          = cleanNames;
    playerScoresRef.current     = initScores;
    currentPlayerIdxRef.current = 0;

    const shuffled = buildShuffledQuestions(selectedCat);
    qsRef.current        = shuffled;
    qIdxRef.current      = 0;
    acertadasRef.current = new Set();
    qPtsRef.current      = 0;
    pontosRef.current    = 0;
    streakRef.current    = 0;

    setCat(selectedCat);
    setQs(shuffled);
    setQIdx(0);
    setPontos(0);
    setStreak(0);
    setResultados([]);
    setAcertadas(new Set());
    setInput("");
    setFeedback(null);

    if (!localStorage.getItem(LS_RULES)) {
      localStorage.setItem(LS_RULES, "1");
      setPhase("rules");
    } else {
      setPhase("passPhone");
    }
  }

  function beginPlaying() {
    setPhase("playing");
    setTimeout(() => {
      startTimer(qsRef.current[qIdxRef.current]);
      inputRef.current?.focus();
    }, 50);
  }

  function handleSubmit() {
    if (!input.trim() || phase !== "playing") return;
    const q = qsRef.current[qIdxRef.current];
    if (!q) return;

    const { resultado, grupoAcertadoIndex, sugestao } = verificarResposta(
      input, q.respostas_aceites, acertadasRef.current
    );

    const ci = currentPlayerIdxRef.current;

    if (resultado === "acerto") {
      const chave    = `grupo_${grupoAcertadoIndex}`;
      const newAcert = new Set(acertadasRef.current);
      newAcert.add(chave);
      setAcertadas(newAcert);
      acertadasRef.current = newAcert;

      const pts = calcSoloPoints(timeLeft, q.tempo, streakRef.current);
      qPtsRef.current   += pts;
      pontosRef.current += pts;
      setPontos(pontosRef.current);
      streakRef.current++;
      setStreak(streakRef.current);
      setFeedback({ tipo: "acerto", msg: `✅ Correcto! +${pts} pts` });
      setInput("");

      if (q.tipo === "lista") {
        const limit = q.total ?? q.respostas_aceites.length;
        if (newAcert.size >= limit) {
          setResultados(prev => [...prev, { q, acertadas: newAcert, pontos: qPtsRef.current, playerName: playersRef.current[ci] }]);
          setTimeout(() => advanceQuestion(), 1000);
        }
      } else {
        setResultados(prev => [...prev, { q, acertadas: newAcert, pontos: qPtsRef.current, playerName: playersRef.current[ci] }]);
        setTimeout(() => advanceQuestion(), 1200);
      }

    } else if (resultado === "quase") {
      setFeedback({ tipo: "quase", msg: `🤔 Quase! Talvez "${sugestao}"?` });
    } else if (resultado === "duplicado") {
      setFeedback({ tipo: "duplicado", msg: "Já disseste essa!" });
      setInput("");
    } else {
      streakRef.current = 0;
      setStreak(0);
      setFeedback({ tipo: "erro", msg: "❌ Errado" });
      setInput("");
      if (q.tipo === "resposta_curta") {
        setResultados(prev => [...prev, { q, acertadas: new Set(), pontos: 0, playerName: playersRef.current[ci] }]);
        setTimeout(() => advanceQuestion(), 1500);
      }
    }
  }

  const handleKey   = (e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } };
  const handlePaste = (e) => e.preventDefault();

  const q              = qs[qIdx];
  const total          = q ? (q.total ?? q.respostas_aceites.length) : 0;
  const acertadasCount = acertadas.size;
  const timerColor     = timeLeft > (q?.tempo ?? 15) * 0.5 ? "#00e5b0"
                       : timeLeft > (q?.tempo ?? 15) * 0.2 ? "#f97316"
                       : "#ef4444";
  const currentPlayer = players[currentPlayerIdx] ?? "";
  const currentScore  = (playerScores[currentPlayerIdx] ?? 0) + pontos;

  // ═══════════════════════════════════════════════════════
  // SETUP — enter player names
  // ═══════════════════════════════════════════════════════
  if (phase === "setup") {
    const filled   = nameDrafts.filter(n => n.trim().length > 0);
    const canStart = filled.length >= 2;
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={onBack} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ</div>
            </div>
            <div className="timerPill">🧩</div>
          </header>
          <main className="gameMain" style={{ gap: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 42 }}>👥</div>
              <div style={{ fontWeight: 900, fontSize: 18, marginTop: 8 }}>Quem vai jogar?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                2 a 6 jogadores · Passa o telemóvel
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nameDrafts.map((name, i) => (
                <input
                  key={i}
                  value={name}
                  onChange={e => {
                    const next = [...nameDrafts];
                    next[i] = e.target.value.slice(0, 20);
                    setNameDrafts(next);
                  }}
                  placeholder={`Jogador ${i + 1}${i < 2 ? " *" : ""}`}
                  className="niceInput"
                  autoComplete="off"
                  maxLength={20}
                  style={{ fontSize: 15 }}
                />
              ))}
            </div>
            {!canStart && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", textAlign: "center" }}>
                Precisas de pelo menos 2 jogadores
              </div>
            )}
            <button
              className="btnPrimary"
              disabled={!canStart}
              onClick={() => setPhase("catSelect")}
              type="button"
              style={{ marginTop: 8, opacity: canStart ? 1 : 0.4 }}
            >
              ▶ Continuar
            </button>
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // CAT SELECT
  // ═══════════════════════════════════════════════════════
  if (phase === "catSelect") {
    const playerList = nameDrafts.filter(n => n.trim()).map(n => n.trim());
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={() => setPhase("setup")} type="button">← Voltar</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ</div>
            </div>
            <div className="timerPill">🧩</div>
          </header>
          <main className="gameMain" style={{ gap: 14 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 42 }}>🧩</div>
              <div style={{ fontWeight: 900, fontSize: 18, marginTop: 8 }}>Escolhe a categoria</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                {playerList.join(" · ")}
              </div>
            </div>
            {SPORCLE_CATS.map(c => (
              <button key={c.id} type="button" onClick={() => startCat(c)} style={{
                background: `${c.cor}14`, border: `1.5px solid ${c.cor}44`,
                borderRadius: 16, padding: "14px 16px", textAlign: "left",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                WebkitTapHighlightColor: "transparent",
              }}>
                <span style={{ fontSize: 32 }}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 2 }}>
                    {c.dificuldade} · {c.perguntas.length} perguntas
                  </div>
                </div>
                <div style={{ fontSize: 12, color: c.cor, fontWeight: 800 }}>Jogar →</div>
              </button>
            ))}
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RULES — shown once on first play
  // ═══════════════════════════════════════════════════════
  if (phase === "rules") {
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={() => setPhase("catSelect")} type="button">← Voltar</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ · Como Jogar</div>
            </div>
            <div className="timerPill">📖</div>
          </header>
          <main className="gameMain" style={{ gap: 14 }}>
            <div style={{ fontSize: 42, textAlign: "center" }}>🧩</div>
            <div style={{ fontWeight: 900, fontSize: 18, textAlign: "center" }}>Como funciona</div>
            <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "📱", text: "Cada jogador joga à sua vez — o telemóvel passa de mão em mão." },
                { icon: "⏱️", text: "Cada pergunta tem um timer. Responde antes de acabar!" },
                { icon: "❓", text: "Perguntas CURTAS: uma tentativa. Se errares, a pergunta acaba." },
                { icon: "📋", text: "Perguntas de LISTA: acerta o maior número de respostas possível dentro do tempo." },
                { icon: "🤔", text: "Resposta 'quase certa' mostra uma dica — tenta outra vez!" },
                { icon: "🔥", text: "3+ acertos seguidos dão bónus de pontos. O streak reinicia em cada turno." },
                { icon: "🏆", text: "Ganha quem tiver mais pontos no fim de todas as perguntas." },
              ].map((r, i) => (
                <li key={i} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 12, padding: "10px 14px",
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>{r.text}</span>
                </li>
              ))}
            </ol>
            <button className="btnPrimary" style={{ marginTop: 8 }} onClick={() => setPhase("passPhone")} type="button">
              ▶ Começar
            </button>
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PASS PHONE — interstitial between turns
  // ═══════════════════════════════════════════════════════
  if (phase === "passPhone") {
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <main className="gameMain" style={{ alignItems: "center", justifyContent: "center", gap: 24, flex: 1 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
                Pergunta {qIdx + 1} / {qs.length}
              </div>
              <div style={{ fontSize: 56 }}>📱</div>
              <div style={{ fontWeight: 900, fontSize: 28, marginTop: 12, lineHeight: 1.2 }}>
                {currentPlayer}
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginTop: 6 }}>
                é a tua vez!
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 14, padding: "12px 16px", width: "100%",
            }}>
              {players.map((name, i) => {
                const isMe = i === currentPlayerIdx;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < players.length - 1 ? 6 : 0 }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: isMe ? 900 : 500, opacity: isMe ? 1 : 0.45 }}>{name}</span>
                    <span style={{ fontWeight: 900, fontSize: 14, color: isMe ? "#00e5b0" : "rgba(255,255,255,.4)" }}>
                      {playerScores[i] ?? 0} pts
                    </span>
                    {isMe && <span style={{ fontSize: 11, fontWeight: 900, color: "#7c5dfa" }}>←</span>}
                  </div>
                );
              })}
            </div>

            <button className="btnPrimary" onClick={beginPlaying} type="button" style={{ width: "100%" }}>
              ▶ Estou pronto!
            </button>
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // FINISHED
  // ═══════════════════════════════════════════════════════
  if (phase === "finished") {
    const sorted = players
      .map((name, i) => ({ name, score: playerScores[i] ?? 0 }))
      .sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={onBack} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ · Resultado</div>
            </div>
            <div className="timerPill">🏆</div>
          </header>
          <main className="gameMain" style={{ gap: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48 }}>🏆</div>
              <div style={{ fontWeight: 900, fontSize: 22, marginTop: 8 }}>{winner?.name} venceu!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>{cat?.nome}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sorted.map((p, i) => (
                <div key={p.name} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 12,
                  background: i === 0 ? "rgba(251,191,36,.08)" : "rgba(255,255,255,.03)",
                  border: `1px solid ${i === 0 ? "rgba(251,191,36,.3)" : "rgba(255,255,255,.06)"}`,
                }}>
                  <span style={{ fontSize: 18, width: 28 }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                  </span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                  <span style={{ fontWeight: 900, fontSize: 15, color: "#00e5b0" }}>{p.score} pts</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
              <button className="btnPrimary" onClick={() => { timerRef.current.stop(); setPhase("catSelect"); }} type="button">
                🔁 Jogar outra vez
              </button>
              <button className="btnGhost" onClick={onBack} type="button">← Menu</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PLAYING
  // ═══════════════════════════════════════════════════════
  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={() => { timerRef.current.stop(); setPhase("catSelect"); }} type="button">← Sair</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Sporcle MZ · {cat?.nome}</div>
          </div>
          <div className="timerPill" style={{ color: timerColor }}>
            {Math.ceil(timeLeft)}s
          </div>
        </header>

        <main className="gameMain" style={{ gap: 10 }}>

          {/* Current player chip */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "rgba(124,93,250,.1)", border: "1px solid rgba(124,93,250,.25)",
            borderRadius: 10, padding: "6px 12px",
          }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: "#c4b5fd" }}>{currentPlayer}</span>
            <span style={{ fontWeight: 900, fontSize: 13, color: "#00e5b0" }}>{currentScore} pts</span>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {qs.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: i < qIdx ? "#7c5dfa" : i === qIdx ? "#00e5b0" : "rgba(255,255,255,.1)",
              }} />
            ))}
          </div>

          <TimerBar remaining={timeLeft} total={q?.tempo ?? 1} />

          {/* Question count + streak */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "rgba(255,255,255,.4)" }}>Pergunta {qIdx + 1} / {qs.length}</span>
            {streak >= 3 && <span style={{ fontWeight: 900, color: "#f97316" }}>🔥 ×{streak}</span>}
          </div>

          {/* Question card */}
          {q && (
            <div style={{
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 16, padding: "16px 14px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 6 }}>
                {q.tipo === "lista" ? `📋 Lista — acerta ${total}` : "❓ Resposta Curta"}
              </div>
              <div style={{ fontSize: "clamp(14px,3.5vw,18px)", fontWeight: 800, lineHeight: 1.4 }}>
                {q.pergunta}
              </div>
              {q.tipo === "lista" && (
                <>
                  <AnswerSlots total={total} filled={acertadasCount} />
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>
                    {acertadasCount} / {total}
                  </div>
                </>
              )}
            </div>
          )}

          <FeedbackBanner feedback={feedback} />

          {/* Input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              onPaste={handlePaste}
              placeholder="Escreve a resposta…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              aria-label="Campo de resposta"
              className="niceInput"
              style={{ flex: 1, fontSize: 16 }}
            />
            <button
              onClick={handleSubmit}
              type="button"
              aria-label="Enviar resposta"
              style={{
                background: "#7c5dfa", border: "none", borderRadius: 12,
                padding: "0 18px", color: "#fff", fontWeight: 900, fontSize: 18,
                cursor: "pointer", flexShrink: 0,
              }}
            >↵</button>
          </div>

        </main>
      </div>
    </div>
  );
}
