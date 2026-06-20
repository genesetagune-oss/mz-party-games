import React from "react";
import { socket } from "../socket";

const LETTERS = ["A", "B", "C", "D"];

export default function SabeTudoOnline({ onBack, room, roomCode, gamePublic, gamePrivate }) {
  const me          = room?.players?.find((p) => p.id === socket.id);
  const isHost      = !!me?.isHost;
  const playerCount = room?.players?.length ?? 0;

  const phase         = gamePublic?.phase         ?? "lobby";
  const qIdx          = gamePublic?.qIdx          ?? 0;
  const totalQ        = gamePublic?.totalQ        ?? 5;
  const timeLeft      = gamePublic?.timeLeft      ?? 0;
  const answeredCount = gamePublic?.answeredCount  ?? 0;
  const scores        = gamePublic?.scores        ?? [];
  const question      = gamePublic?.question      ?? null;

  const myAnswer  = gamePrivate?.myAnswer  ?? null;
  const isCorrect = gamePrivate?.isCorrect ?? null;

  const isAnswered  = myAnswer !== null;
  const timerPct    = (timeLeft / 12) * 100;
  const timerColor  = timeLeft > 6 ? "#00e5b0" : timeLeft > 3 ? "#f97316" : "#ef4444";

  const leaveToMenu = () => { socket.emit("room:leave"); onBack?.(); };

  function answer(optionIndex) {
    if (isAnswered || phase !== "question") return;
    socket.emit("game:command", { type: "ANSWER", optionIndex });
  }

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sabe Tudo? · Online</div>
              <div style={{ opacity: 0.6, fontSize: 11, marginTop: 2 }}>
                Sala: <b>{roomCode}</b> · {playerCount} jogador{playerCount !== 1 ? "es" : ""}
              </div>
            </div>
            <div className="timerPill">🧠</div>
          </header>

          <main className="gameMain" style={{ gap: 16 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
              <div style={{ fontSize: 52 }}>🧠</div>
              <div style={{ fontWeight: 900, fontSize: 20, textAlign: "center" }}>Sabe Tudo?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", textAlign: "center", lineHeight: 1.5 }}>
                5 perguntas de trivia MZ<br/>Cada um responde no seu telemóvel
              </div>

              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                {room?.players?.map((p) => (
                  <div key={p.id} style={{
                    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 12, padding: "10px 16px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 16 }}>{p.isHost ? "👑" : "🎮"}</span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                    {p.id === socket.id && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>(tu)</span>
                    )}
                  </div>
                ))}
              </div>

              {isHost ? (
                <button
                  className="btnPrimary"
                  disabled={playerCount < 2}
                  onClick={() => socket.emit("game:start")}
                  type="button"
                  style={{ width: "100%" }}
                >
                  {playerCount < 2 ? `Aguarda mais ${2 - playerCount} jogador…` : "▶ Começar"}
                </button>
              ) : (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", textAlign: "center" }}>
                  Aguardando o host iniciar…
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── RESULTADO FINAL ────────────────────────────────────────────────────────
  if (phase === "finished") {
    const winner = scores[0];
    const myRank = scores.findIndex((s) => s.id === socket.id);
    const rankEmoji = myRank === 0 ? "🥇" : myRank === 1 ? "🥈" : myRank === 2 ? "🥉" : "🎮";

    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Sabe Tudo? · Resultado</div>
            </div>
            <div className="timerPill">🏆</div>
          </header>

          <main className="gameMain" style={{ gap: 16 }}>
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <div style={{ fontSize: 48 }}>🏆</div>
              <div style={{ fontWeight: 900, fontSize: 20, marginTop: 8 }}>
                {winner?.name} venceu!
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>
                Tu ficaste em {myRank + 1}º lugar {rankEmoji}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {scores.map((s, i) => {
                const isMe = s.id === socket.id;
                return (
                  <div key={s.id} style={{
                    background: i === 0 ? "rgba(255,215,0,.1)" : isMe ? "rgba(124,93,250,.1)" : "rgba(255,255,255,.04)",
                    border: `1px solid ${i === 0 ? "rgba(255,215,0,.3)" : isMe ? "rgba(124,93,250,.3)" : "rgba(255,255,255,.08)"}`,
                    borderRadius: 14, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                    </span>
                    <span style={{ flex: 1, fontWeight: 700 }}>
                      {s.name}{isMe ? " (tu)" : ""}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 18, color: "#00e5b0" }}>
                      {s.score} pts
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {isHost && (
                <button className="btnPrimary" onClick={() => socket.emit("game:restart")} type="button">
                  🔁 Jogar outra vez
                </button>
              )}
              <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── QUESTÃO / REVEAL ──────────────────────────────────────────────────────
  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Sabe Tudo? · Online</div>
          </div>
          <div className="timerPill" style={{ color: phase === "question" ? timerColor : undefined }}>
            {phase === "question" ? `${timeLeft}s` : "✓"}
          </div>
        </header>

        <main className="gameMain" style={{ gap: 12 }}>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
            {Array.from({ length: totalQ }, (_, i) => (
              <div key={i} style={{
                width: 32, height: 5, borderRadius: 99,
                background: i < qIdx ? "#7c5dfa" : i === qIdx ? "#00e5b0" : "rgba(255,255,255,.12)",
                transition: "background .3s",
              }} />
            ))}
          </div>

          {/* Timer bar */}
          {phase === "question" && (
            <div style={{ height: 3, background: "rgba(255,255,255,.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, width: `${timerPct}%`,
                background: timerColor, transition: "width 1s linear, background .4s",
              }} />
            </div>
          )}

          {/* Pergunta */}
          {question && (
            <div style={{
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 20, padding: "20px 18px",
              fontSize: "clamp(14px,3.5vw,19px)", fontWeight: 800, color: "#fff",
              textAlign: "center", lineHeight: 1.4,
            }}>
              {question.q}
            </div>
          )}

          {/* Quantos responderam */}
          {phase === "question" && (
            <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>
              {answeredCount} / {playerCount} responderam
            </div>
          )}

          {/* Reveal: feedback pessoal */}
          {phase === "reveal" && isCorrect !== null && (
            <div style={{
              textAlign: "center", padding: "10px 16px", borderRadius: 12,
              background: isCorrect ? "rgba(0,200,100,.15)" : "rgba(220,50,50,.15)",
              border: `1px solid ${isCorrect ? "rgba(0,200,100,.4)" : "rgba(220,50,50,.4)"}`,
              fontSize: 15, fontWeight: 800,
            }}>
              {isCorrect ? "✅ Correcto!" : "❌ Errado"}
            </div>
          )}

          {/* Opções */}
          {question && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {question.opts.map((opt, i) => {
                const isCorrectOpt = question.ans !== null && i === question.ans;
                const isMyChoice   = i === myAnswer;
                const revealing    = phase === "reveal" && question.ans !== null;
                let bg     = "rgba(255,255,255,.05)";
                let border = "1px solid rgba(255,255,255,.1)";
                let col    = "#fff";
                let cirBg  = "rgba(255,255,255,.08)";
                if (isAnswered && !revealing) {
                  if (isMyChoice) { bg = "rgba(124,93,250,.2)"; border = "1px solid rgba(124,93,250,.5)"; cirBg = "rgba(124,93,250,.3)"; }
                  else { col = "rgba(255,255,255,.3)"; }
                }
                if (revealing) {
                  if (isCorrectOpt)        { bg = "rgba(0,200,100,.18)"; border = "1px solid rgba(0,200,100,.5)"; cirBg = "rgba(0,200,100,.3)"; }
                  else if (isMyChoice)     { bg = "rgba(220,50,50,.18)";  border = "1px solid rgba(220,50,50,.5)";  cirBg = "rgba(220,50,50,.3)"; }
                  else                     { col = "rgba(255,255,255,.3)"; }
                }
                return (
                  <button key={i} type="button"
                    disabled={isAnswered || phase !== "question"}
                    onClick={() => answer(i)}
                    style={{
                      background: bg, border, borderRadius: 14,
                      padding: "12px 14px", textAlign: "left",
                      color: col, fontSize: 14, fontWeight: 700,
                      cursor: isAnswered || phase !== "question" ? "default" : "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      WebkitTapHighlightColor: "transparent",
                      transition: "background .2s, border .2s",
                    }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: "50%", background: cirBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 900, flexShrink: 0, color: col,
                    }}>
                      {revealing && isCorrectOpt ? "✅" : revealing && isMyChoice ? "❌" : LETTERS[i]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mini leaderboard durante reveal */}
          {phase === "reveal" && scores.length > 0 && (
            <div style={{ marginTop: "auto", paddingTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
                Pontuação
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {scores.slice(0, 5).map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: s.id === socket.id ? 1 : 0.65 }}>
                    <span style={{ width: 20, fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.4)" }}>{i + 1}º</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{s.name}{s.id === socket.id ? " (tu)" : ""}</span>
                    <span style={{ fontWeight: 900, color: "#00e5b0", fontSize: 13 }}>{s.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
