import React, { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../socket";
import { playSound } from "../utils/sound";

export default function ThirtySecondsOnline({ onBack, room, roomCode, gamePublic, gamePrivate, onSwitchGame }) {
  const me = room?.players?.find((p) => p.id === socket.id) || null;
  const isHost = !!me?.isHost;

  const phase = gamePublic?.phase ?? "lobby";
  const turnPhase = gamePublic?.turnPhase ?? "ready";
  const paused = !!gamePublic?.paused;

  const scores = gamePublic?.scores ?? { A: 0, B: 0 };
  const teamTurn = gamePublic?.currentTeam ?? "-";
  const playerName = gamePublic?.currentPlayer?.name ?? "-";

  const remaining = Math.ceil((gamePublic?.remainingMs ?? 0) / 1000);

  const winScore = gamePublic?.winScore ?? 30;
  const winnerTeam = gamePublic?.winnerTeam ?? null;

  const category = gamePublic?.category ?? room?.settings?.category ?? "GLOBAL";

  const passLeft = gamePublic?.passLeft ?? 0;
  const swapsPerTurn = gamePublic?.swapsPerTurn ?? 2;

  const role = gamePrivate?.role ?? "NONE";
  const isExplainer = role === "EXPLAINER";

  const myTeam = gamePrivate?.team ?? null;
  const teamsCount = gamePublic?.teamsCount ?? { A: 0, B: 0 };

  const canAct = !!gamePrivate?.canAct;
  const canUndo = !!gamePrivate?.canUndo;
  const undoCount = gamePrivate?.undoCount ?? 0;

  const card = gamePrivate?.card ?? null;
  const items = card?.items ?? null;
  const checked = card?.checked ?? null;

  // ✅ Estado para pop-up suave
  const [floatingText, setFloatingText] = useState(null);

  // =====================
  // AUDIO
  // =====================
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


  // =====================
  // ACTIONS
  // =====================
  const leaveToMenu = () => {
    socket.emit("room:leave");
    onBack?.();
  };

  const setCat = (cat) => {
    warmupAudio();
    socket.emit("game:setCategory", { category: cat });
  };

  const startGame = () => {
    warmupAudio();
    socket.emit("game:start");
  };

  const passCard = () => {
    warmupAudio();
    socket.emit("game:command", { type: "PASS" });
  };

  const undoLast = () => {
    warmupAudio();
    socket.emit("game:command", { type: "UNDO" });
  };

  const togglePause = () => {
    warmupAudio();
    socket.emit("game:command", { type: "PAUSE_TOGGLE" });
  };

  const passToMate = () => {
    warmupAudio();
    socket.emit("game:command", { type: "PASS_TO_TEAMMATE" });
  };

  const endTurn = () => {
    warmupAudio();
    socket.emit("game:command", { type: "END_TURN" });
  };

  // ✅ NOVO: Click com feedback suave
  const clickItem = (index) => {
    warmupAudio();
    playSound("correct");

    // Pop-up suave
    setFloatingText({
      text: "✅ +1",
      x: Math.random() * 200 - 100, // -100 a +100
      y: Math.random() * 150,
    });
    setTimeout(() => setFloatingText(null), 1000);

    socket.emit("game:command", { type: "CORRECT_ITEM", index });
  };


  const restart = () => {
    warmupAudio();
    socket.emit("game:restart");
  };

  const handleShare = async () => {
    const url = "https://mz-party-games.onrender.com";
    const text = `🎮 Acabei de jogar MZ Party Games! Vem jogar também → ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "MZ Party Games", text, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); } catch {}
    }
  };

  const copyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      alert("Código copiado!");
    } catch {
      alert("Não consegui copiar. Copie manualmente: " + roomCode);
    }
  };

  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== "finished" && phase === "finished") playSound("win");
    prevPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && turnPhase === "play" && remaining > 0 && remaining <= 10) playSound("tick");
  }, [remaining, phase, turnPhase]);

  const showExplainerDock = phase === "playing" && turnPhase === "play" && isExplainer;

  const readyTitle = useMemo(() => {
    if (phase !== "playing") return "";
    if (turnPhase !== "ready") return "";
    return `Agora joga: Equipa ${teamTurn}`;
  }, [phase, turnPhase, teamTurn]);

  const readySub = useMemo(() => {
    if (phase !== "playing") return "";
    if (turnPhase !== "ready") return "";
    return `Jogador: ${playerName || "—"}`;
  }, [phase, turnPhase, playerName]);

  const pillStyle = {
    pointerEvents: "auto",
    width: "min(520px, 92vw)",
    maxWidth: 520,
    padding: 18,
    borderRadius: 999,
  };

  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnBack" onClick={leaveToMenu} type="button">
            ← Menu
          </button>

          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">30 Segundos (Online)</div>
            <div style={{ opacity: 0.8, marginTop: 4, fontSize: 12 }}>
              Sala: <b>{roomCode || "-"}</b>
            </div>
          </div>

          <div className="timerPill">
            {phase !== "playing"
              ? ""
              : turnPhase === "ready"
              ? `⏳ ${remaining}s`
              : `⏱️ ${remaining}s`}
          </div>
        </header>

        <div style={{ padding: "0 14px 10px", opacity: 0.7, fontSize: 13 }}>
          Jogadores: <b>{room?.players?.length ?? 0}</b>
        </div>

        <main className="gameMain">
          <section className="scoreRow">
            <div className={`scoreBox ${teamTurn === "A" ? "active" : "inactive"}`}>
              <div className="scoreLabel">Equipa A</div>
              <div className="scoreNum">{scores.A ?? 0}</div>
            </div>

            <div className={`scoreBox ${teamTurn === "B" ? "active" : "inactive"}`}>
              <div className="scoreLabel">Equipa B</div>
              <div className="scoreNum">{scores.B ?? 0}</div>
            </div>
          </section>

          <section className="turnRow">
            <div className="turnText">
              {phase === "finished" ? (
                <>🏆 Vencedor: Equipa {winnerTeam}</>
              ) : phase === "playing" ? (
                <>
                  Vez da Equipa <b>{teamTurn}</b>
                  <span className="muted"> — {playerName} está a explicar</span>
                  {paused ? <span className="muted"> — (PAUSADO)</span> : null}
                </>
              ) : (
                <>Aguardando Start Game…</>
              )}
            </div>
            <div className="winRule">Vitória: {winScore} pts</div>
          </section>

          <section className={`card ${turnPhase === "ready" ? "isReady" : ""} ${paused ? "paused" : ""}`}>
            <div className="cardTop">
              <div className="cardTitle">Carta</div>
              <div className="cardHint">
                {phase !== "playing"
                  ? ""
                  : turnPhase === "ready"
                  ? ""
                  : paused
                  ? "Pausado"
                  : canAct
                  ? "Toca nos itens certos"
                  : "Carta escondida para ti"}
              </div>
            </div>

            {phase === "playing" && turnPhase === "ready" ? (
              <div className="cardReadyOverlay" aria-live="polite" style={{ pointerEvents: "auto" }}>
                <div className="readyPill" style={pillStyle}>
                  <div className="readyTitle">{readyTitle}</div>
                  <div className="readyCount">{remaining}</div>
                  <div className="readySub">{readySub}</div>
                </div>
              </div>
            ) : null}

            {phase === "playing" && turnPhase === "play" && paused ? (
              <div className="cardReadyOverlay" aria-live="polite" style={{ pointerEvents: "auto" }}>
                <div className="readyPill" style={pillStyle}>
                  <div className="readyTitle">Pausado</div>
                  <div className="readyCount" style={{ fontSize: 40, lineHeight: 1.05 }}>
                    ⏸
                  </div>
                  <div className="readySub">Carrega em Retomar para voltar</div>
                </div>
              </div>
            ) : null}


            {phase === "playing" && turnPhase === "play" && paused ? null : (
              <div className="itemsList">
                {items ? (
                  items.map((item, i) => {
                    const done = !!checked?.[i];
                    return (
                      <button
                        key={i}
                        onClick={() => clickItem(i)}
                        disabled={!canAct || paused || phase !== "playing" || turnPhase !== "play" || done}
                        className={`itemBtn ${done ? "done" : ""}`}
                        type="button"
                      >
                        <span className="itemNum">{i + 1}</span>
                        <span className="itemText">{item}</span>
                        <span className="itemCheck">
                          <span className="itemCheckCircle">{done ? "✓" : ""}</span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: 16, opacity: 0.8 }}>
                    {phase === "finished"
                      ? "Jogo terminou."
                      : phase === "playing"
                      ? "Carta não visível para ti agora."
                      : "O host precisa carregar Start Game."}
                  </div>
                )}
              </div>
            )}

            {/* ✅ Pop-up feedback suave */}
            {floatingText && (
              <div
                className="floatingPoint correct"
                style={{
                  left: `calc(50% + ${floatingText.x}px)`,
                  top: `${floatingText.y}px`,
                }}
              >
                {floatingText.text}
              </div>
            )}
          </section>

          <footer className="actionDock">
            {showExplainerDock ? (
              <>
                <button
                  className="btnSoft dockFull"
                  onClick={undoLast}
                  disabled={paused || !canUndo || undoCount <= 0}
                  type="button"
                >
                  ↩️ Desfazer ponto
                </button>

                <button
                  className="btnSoft dockFull"
                  onClick={passCard}
                  disabled={paused || passLeft <= 0}
                  type="button"
                >
                  🔄 Trocar carta ({passLeft}/{swapsPerTurn})
                </button>

                <button className="btnSoft dockFull" onClick={passToMate} disabled={paused} type="button">
                  👥 Passar para colega
                </button>

                <div className="dock2">
                  <button className="btnSoft" onClick={togglePause} type="button">
                    {paused ? "▶️ Retomar" : "⏸️ Pausa"}
                  </button>

                  <button className="btnDanger" onClick={endTurn} disabled={paused} type="button">
                    ⛔ Terminar turno
                  </button>
                </div>
              </>
            ) : phase === "lobby" && isHost ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["GLOBAL","🌍 Global"], ["MZ","🇲🇿 MZ"]].map(([cat, label]) => (
                    <button
                      key={cat}
                      type="button"
                      className="btnSoft"
                      onClick={() => setCat(cat)}
                      style={{
                        flex: 1,
                        background: category === cat ? "rgba(99,102,241,.28)" : undefined,
                        border: category === cat ? "1px solid rgba(99,102,241,.6)" : undefined,
                        fontWeight: category === cat ? 900 : undefined,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, opacity: 0.55, textAlign: "center" }}>
                  Tu és Equipa {me?.team ?? "A"} &nbsp;·&nbsp; Equipa A: {teamsCount.A} &nbsp;·&nbsp; Equipa B: {teamsCount.B}
                </div>
                <button
                  type="button"
                  className="btnPrimary"
                  onClick={startGame}
                  disabled={teamsCount.B === 0}
                >
                  {teamsCount.B === 0 ? "Aguardando Equipa B…" : "▶ Start Game"}
                </button>
              </div>
            ) : (
              <div className="footNoteDock" style={{ opacity: 0.85 }}>
                {phase === "lobby"
                  ? myTeam ? `Equipa ${myTeam} — aguardando o host…` : "Aguardando o host começar."
                  : phase === "finished"
                  ? "Partida terminou."
                  : "Aguarde a tua vez."}
              </div>
            )}
          </footer>

          {/* ✅ OVERLAY VITÓRIA — Premium mas suave */}
          {phase === "finished" && (
            <div className="victoryOverlay">
              <div className="victoryBackdrop" />
              <div className="victoryCard">
                <div className="victoryTitle">🏆</div>
                <div className="victoryTeam">Equipa {winnerTeam}</div>
                <div className="victorySub">{scores[winnerTeam]} pontos</div>

                <div className="victoryBtns">
                  <button className="victoryBtn share" onClick={handleShare} type="button">
                    📲 Partilhar
                  </button>
                  {isHost ? (
                    <>
                      <button className="victoryBtn restart" onClick={restart} type="button">🔁 Reiniciar Partida</button>
                      <button className="victoryBtn restart" onClick={onSwitchGame} type="button">🎮 Mudar Jogo</button>
                    </>
                  ) : (
                    <div className="waitingHostMsg"><div className="waitingHostDot" />Host a decidir próximo passo...</div>
                  )}
                  <button className="victoryBtn menu" onClick={leaveToMenu} type="button">
                    ← Menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
