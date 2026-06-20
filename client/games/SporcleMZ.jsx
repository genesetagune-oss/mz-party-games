import React, { useCallback, useEffect, useRef, useState } from "react";
import { SPORCLE_CATS } from "./sporcleMZData.js";
import { verificarResposta } from "./sporcleMZVerification.js";
import { GameTimer, calcSoloPoints } from "./sporcleMZEngine.js";

const LS_RULES       = "mzpg_sporcle_rules_seen";
const LS_SEEN_IDS    = "mzpg_sporcle_seen_ids";
const LS_LEADERBOARD = "mzpg_sporcle_scores";
const MAX_SEEN       = 50;
const MAX_SCORES     = 10;

function saveLeaderboardEntry(score, catNome) {
  try {
    const prev = JSON.parse(localStorage.getItem(LS_LEADERBOARD) || "[]");
    const entry = { score, cat: catNome, date: new Date().toLocaleDateString("pt-MZ") };
    const next = [...prev, entry].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
    localStorage.setItem(LS_LEADERBOARD, JSON.stringify(next));
    return next;
  } catch { return []; }
}

function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem(LS_LEADERBOARD) || "[]"); }
  catch { return []; }
}

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
    const unseenFirst = [
      ...cat.perguntas.filter(q => !seen.includes(q.id)),
      ...cat.perguntas.filter(q =>  seen.includes(q.id)),
    ];
    return shuffle(unseenFirst);
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

// ── Sub-components ─────────────────────────────────────────

function TimerBar({ remaining, total, active }) {
  if (!active) return null;
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

// ── Main Component ─────────────────────────────────────────
export default function SporcleMZ({ onBack }) {
  const [phase,     setPhase]     = useState("catSelect");
  const [cat,       setCat]       = useState(null);
  const [qs,        setQs]        = useState([]);
  const [qIdx,      setQIdx]      = useState(0);
  const [input,     setInput]     = useState("");
  const [acertadas, setAcertadas] = useState(new Set());
  const [feedback,  setFeedback]  = useState(null);
  const [pontos,    setPontos]    = useState(0);
  const [streak,    setStreak]    = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [blurCount, setBlurCount] = useState(0);
  const [antiPaused,setAntiPaused]= useState(false);
  const [compromised,setCompromised]=useState(false);
  const [resultados,setResultados]= useState([]);
  const [leaderboard,setLeaderboard] = useState([]);

  // ── mutable refs (avoid stale closures in timer callbacks) ──
  const timerRef        = useRef(new GameTimer());
  const inputRef        = useRef(null);
  const fbTimRef        = useRef(null);
  const qsRef           = useRef([]);       // always current qs
  const qIdxRef         = useRef(0);        // always current qIdx
  const acertadasRef    = useRef(new Set());
  const qPtsRef         = useRef(0);
  const pontosRef       = useRef(0);
  const streakRef       = useRef(0);
  const handleTimeoutRef= useRef(null);     // always current handleTimeout

  // keep refs in sync with state
  useEffect(() => { qsRef.current    = qs;    }, [qs]);
  useEffect(() => { qIdxRef.current  = qIdx;  }, [qIdx]);
  useEffect(() => { acertadasRef.current = acertadas; }, [acertadas]);

  // ── feedback auto-dismiss ────────────────────────────────
  useEffect(() => {
    if (!feedback) return;
    if (fbTimRef.current) clearTimeout(fbTimRef.current);
    fbTimRef.current = setTimeout(
      () => { setFeedback(null); setTimeout(() => inputRef.current?.focus(), 50); },
      feedback.tipo === "quase" ? 2500 : 900
    );
    return () => clearTimeout(fbTimRef.current);
  }, [feedback]);

  // ── cleanup ──────────────────────────────────────────────
  useEffect(() => () => timerRef.current.stop(), []);

  // ── load leaderboard on mount ────────────────────────────
  useEffect(() => { setLeaderboard(loadLeaderboard()); }, []);

  // ── blur / anti-cheat ────────────────────────────────────
  useEffect(() => {
    const onBlur = () => {
      if (phaseRef.current !== "playing") return;
      timerRef.current.pause();
      setAntiPaused(true);
      setBlurCount(prev => {
        const next = prev + 1;
        if (next >= 3) { setCompromised(true); streakRef.current = 0; setStreak(0); }
        return next;
      });
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  // ref for phase (used inside blur listener)
  const phaseRef = useRef("catSelect");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const resumeFromAntiCheat = () => {
    setAntiPaused(false);
    timerRef.current.resume();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── timer ────────────────────────────────────────────────
  // always-current version of handleTimeout, passed to timer via ref
  function handleTimeout() {
    const currentQ = qsRef.current[qIdxRef.current];
    setResultados(prev => [
      ...prev,
      { q: currentQ, acertadas: new Set(acertadasRef.current), pontos: qPtsRef.current }
    ]);
    advanceQuestion();
  }
  // keep the ref fresh on every render so timer always calls the latest version
  handleTimeoutRef.current = handleTimeout;

  const startTimer = useCallback((q) => {
    if (!q) return;
    timerRef.current.start(
      q.tempo,
      (rem) => setTimeLeft(rem),
      ()    => handleTimeoutRef.current?.(),
    );
    setTimeLeft(q.tempo);
  }, []);

  // ── advance question ─────────────────────────────────────
  function advanceQuestion() {
    timerRef.current.stop();
    const nextIdx = qIdxRef.current + 1;
    qIdxRef.current = nextIdx;

    if (nextIdx >= qsRef.current.length) {
      markSeen(qsRef.current.map(q => q.id));
      const lb = saveLeaderboardEntry(pontosRef.current, cat?.nome ?? "");
      setLeaderboard(lb);
      setPhase("finished");
      return;
    }

    setQIdx(nextIdx);
    setAcertadas(new Set());
    acertadasRef.current = new Set();
    qPtsRef.current = 0;
    setInput("");
    setFeedback(null);
    setTimeout(() => {
      startTimer(qsRef.current[nextIdx]);
      inputRef.current?.focus();
    }, 80);
  }

  // ── start game ───────────────────────────────────────────
  function startGame(selectedCat) {
    const shuffled = buildShuffledQuestions(selectedCat);
    // update refs immediately (state update is async)
    qsRef.current    = shuffled;
    qIdxRef.current  = 0;
    acertadasRef.current = new Set();
    qPtsRef.current  = 0;
    pontosRef.current = 0;
    streakRef.current = 0;

    setCat(selectedCat);
    setQs(shuffled);
    setQIdx(0);
    setPontos(0);
    setStreak(0);
    setResultados([]);
    setBlurCount(0);
    setCompromised(false);
    setAntiPaused(false);
    setAcertadas(new Set());
    setInput("");
    setFeedback(null);

    if (!localStorage.getItem(LS_RULES)) {
      localStorage.setItem(LS_RULES, "1");
      setPhase("rules");
    } else {
      setPhase("playing");
      setTimeout(() => { startTimer(shuffled[0]); inputRef.current?.focus(); }, 50);
    }
  }

  function beginPlaying() {
    setPhase("playing");
    setTimeout(() => { startTimer(qsRef.current[0]); inputRef.current?.focus(); }, 50);
  }

  // ── submit answer ────────────────────────────────────────
  function handleSubmit() {
    if (!input.trim() || phaseRef.current !== "playing" || antiPaused) return;
    const q = qsRef.current[qIdxRef.current];
    if (!q) return;

    const { resultado, grupoAcertadoIndex, sugestao } = verificarResposta(
      input, q.respostas_aceites, acertadasRef.current
    );

    if (resultado === "acerto") {
      const chave = `grupo_${grupoAcertadoIndex}`;
      const newAcertadas = new Set(acertadasRef.current);
      newAcertadas.add(chave);
      setAcertadas(newAcertadas);
      acertadasRef.current = newAcertadas;

      const pts = calcSoloPoints(timeLeft, q.tempo, streakRef.current);
      qPtsRef.current  += pts;
      pontosRef.current += pts;
      setPontos(pontosRef.current);
      streakRef.current++;
      setStreak(streakRef.current);

      setFeedback({ tipo: "acerto", msg: `✅ Correcto! +${pts} pts` });
      setInput("");

      if (q.tipo === "lista") {
        const limit = q.total ?? q.respostas_aceites.length;
        if (newAcertadas.size >= limit) {
          setResultados(prev => [...prev, { q, acertadas: newAcertadas, pontos: qPtsRef.current }]);
          setTimeout(() => advanceQuestion(), 1000);
        }
      } else {
        setResultados(prev => [...prev, { q, acertadas: newAcertadas, pontos: qPtsRef.current }]);
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
        setResultados(prev => [...prev, { q, acertadas: new Set(), pontos: 0 }]);
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

  // ═══════════════════════════════════════════════════════
  // CAT SELECT
  // ═══════════════════════════════════════════════════════
  if (phase === "catSelect") {
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
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 42 }}>🧩</div>
              <div style={{ fontWeight: 900, fontSize: 18, marginTop: 8 }}>Sporcle MZ</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                Quiz cronometrado · Escolhe a categoria
              </div>
            </div>
            {SPORCLE_CATS.map(c => (
              <button key={c.id} type="button" onClick={() => startGame(c)} style={{
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
  // RULES (first time only)
  // ═══════════════════════════════════════════════════════
  if (phase === "rules") {
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={() => setPhase("catSelect")} type="button">← Voltar</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sporcle MZ · Regras</div>
            </div>
            <div className="timerPill">📖</div>
          </header>
          <main className="gameMain" style={{ gap: 14 }}>
            <div style={{ fontSize: 42, textAlign: "center" }}>🧩</div>
            <div style={{ fontWeight: 900, fontSize: 18, textAlign: "center" }}>Como jogar</div>
            <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Tens um timer por pergunta — responde antes de acabar.",
                "Escreve a resposta e carrega Enter para verificar.",
                "Perguntas de LISTA: acerta o maior número de respostas possível.",
                "Perguntas CURTAS: uma tentativa; se errares o timer continua.",
                "Respostas 'quase certas' mostram uma dica — tenta outra vez!",
                "Não colas, não sais da janela — anti-cheat ativo! 😤",
                "Streak de 3+ acertos seguidos dá bónus de pontos. 🔥",
              ].map((r, i) => (
                <li key={i} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 12, padding: "10px 14px",
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(124,93,250,.3)", border: "1px solid rgba(124,93,250,.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900, flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.4 }}>{r}</span>
                </li>
              ))}
            </ol>
            <button className="btnPrimary" style={{ marginTop: 8 }} onClick={beginPlaying} type="button">
              ▶ Começar
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
    const totalAcertos = resultados.reduce((s, r) => s + r.acertadas.size, 0);
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
              <div style={{ fontWeight: 900, fontSize: 22, marginTop: 8 }}>{pontos} pontos</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                {totalAcertos} resposta{totalAcertos !== 1 ? "s" : ""} correct{totalAcertos !== 1 ? "as" : "a"}
                {compromised && " · ⚠️ Anti-cheat ativado"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {resultados.map(({ q: rq, acertadas: ra, pontos: rp }, i) => !rq ? null : (
                <div key={i} style={{
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 12, padding: "10px 14px",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>
                    {rq.tipo === "lista" ? "📋" : "❓"} {rq.pergunta}
                  </div>
                  <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: ra.size > 0 ? "#4ade80" : "rgba(255,255,255,.3)" }}>
                      {ra.size > 0 ? `✓ ${ra.size} acerto${ra.size > 1 ? "s" : ""}` : "✗ Nenhum acerto"}
                    </span>
                    <span style={{ fontWeight: 900, color: "#00e5b0" }}>+{rp} pts</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Local leaderboard */}
            {leaderboard.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
                  Top {Math.min(leaderboard.length, MAX_SCORES)} · melhor pontuação
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {leaderboard.map((entry, i) => {
                    const isThis = i === leaderboard.findIndex(e => e.score === pontos && e.cat === cat?.nome);
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "6px 10px", borderRadius: 9,
                        background: isThis ? "rgba(0,229,176,.08)" : "rgba(255,255,255,.03)",
                        border: `1px solid ${isThis ? "rgba(0,229,176,.3)" : "rgba(255,255,255,.06)"}`,
                      }}>
                        <span style={{ fontSize: 12, width: 20, color: i === 0 ? "#fbbf24" : "rgba(255,255,255,.3)", fontWeight: 900 }}>
                          {i === 0 ? "🥇" : `${i + 1}`}
                        </span>
                        <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,.5)" }}>{entry.cat} · {entry.date}</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: isThis ? "#00e5b0" : "rgba(255,255,255,.6)" }}>
                          {entry.score} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

          {/* Anti-cheat overlay */}
          {antiPaused && (
            <div style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,.85)",
              zIndex: 100, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16, padding: 24,
            }}>
              <div style={{ fontSize: 42 }}>😤</div>
              <div style={{ fontWeight: 900, fontSize: 18, textAlign: "center" }}>Anti-cheat ativo</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", textAlign: "center" }}>
                Saíste da janela {blurCount}×{compromised ? " · Streak anulada!" : ""}
              </div>
              <button className="btnPrimary" onClick={resumeFromAntiCheat} type="button" style={{ width: "100%", maxWidth: 300 }}>
                Continuar
              </button>
            </div>
          )}

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {qs.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: i < qIdx ? "#7c5dfa" : i === qIdx ? "#00e5b0" : "rgba(255,255,255,.1)",
              }} />
            ))}
          </div>

          {/* Timer bar */}
          <TimerBar remaining={timeLeft} total={q?.tempo ?? 1} active={true} />

          {/* Score + streak */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ fontWeight: 900, color: "#00e5b0" }}>{pontos} pts</span>
            {streak >= 3 && <span style={{ fontWeight: 900, color: "#f97316" }}>🔥 ×{streak}</span>}
            <span style={{ color: "rgba(255,255,255,.4)" }}>{qIdx + 1} / {qs.length}</span>
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

          {/* Feedback */}
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
