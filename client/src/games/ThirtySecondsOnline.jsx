import React, { useEffect, useMemo, useRef } from "react";
import { socket } from "../socket";
import "../App.css";

export default function ThirtySecondsOnline({ onBack, room, roomCode, gamePublic, gamePrivate }) {
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

  const canAct = !!gamePrivate?.canAct;
  const canUndo = !!gamePrivate?.canUndo;
  const undoCount = gamePrivate?.undoCount ?? 0;

  const card = gamePrivate?.card ?? null;
  const items = card?.items ?? null;
  const checked = card?.checked ?? null;

  // =====================
  // AUDIO (mantém como está)
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

  function beep(freq = 880, ms = 140, vol = 0.18) {
    try {
      const ctx = ensureAudio();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => o.stop(), ms);
    } catch {}
  }

  useEffect(() => {
    const onEvt = (evt) => {
      const t = evt?.type;
      if (t === "TURN_STARTED") beep(880, 140, 0.18);
      if (t === "CORRECT_ITEM") beep(980, 90, 0.18);
      if (t === "PASS") beep(700, 120, 0.14);
      if (t === "PASSED_TO_TEAMMATE") beep(360, 180, 0.22);
      if (t === "TURN_ENDED" && evt?.reason === "TIME_UP") beep(520, 160, 0.2);
      if (t === "UNDO") beep(420, 110, 0.15);
    };

    socket.on("game:event", onEvt);
    return () => socket.off("game:event", onEvt);
  }, []);

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

  const clickItem = (index) => {
    warmupAudio();
    socket.emit("game:command", { type: "CORRECT_ITEM", index });
  };

  const restart = () => {
    warmupAudio();
    socket.emit("game:restart");
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

  const showStart = isHost && phase === "lobby";
  const canShowLobbyControls = phase === "lobby";
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

  // ✅ PILL sempre “bonita” em qualquer ecrã
  const pillStyle = {
    pointerEvents: "auto",
    width: "min(520px, 92vw)",
    maxWidth: 520,
    padding: 18,
    borderRadius: 999,
  };

  // ✅ CARTA responsiva premium (mobile-first)
  // - mantém um tamanho confortável no telemóvel
  // - não explode no desktop
  const cardStyle = {
    width: "min(720px, 94vw)",
    margin: "0 auto",
    // altura alvo: ~55% da altura do ecrã, com limites
    minHeight: "clamp(320px, 55vh, 520px)",
    maxHeight: "clamp(360px, 62vh, 560px)",
    display: "flex",
    flexDirection: "column",
  };

  // ✅ Itens rolam dentro da carta (nunca estoura layout)
  const itemsListStyle = {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    paddingBottom: 6,
  };

  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">
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

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 14px 14px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* ✅ Só host vê */}
          {isHost ? (
            <button className="btnSoft" type="button" onClick={copyCode} disabled={!roomCode}>
              Copiar código
            </button>
          ) : null}

          {canShowLobbyControls ? (
            <>
              <button
                className="btnSoft"
                type="button"
                onClick={() => setCat("GLOBAL")}
                disabled={!isHost}
                style={category === "GLOBAL" ? { outline: "2px solid rgba(255,255,255,0.35)" } : null}
              >
                🌍 Global
              </button>

              <button
                className="btnSoft"
                type="button"
                onClick={() => setCat("MZ")}
                disabled={!isHost}
                style={category === "MZ" ? { outline: "2px solid rgba(255,255,255,0.35)" } : null}
              >
                🇲🇿 CulturaGeral_MZ
              </button>
            </>
          ) : null}

          {showStart ? (
            <button className="btnSoft" type="button" onClick={startGame} disabled={!roomCode}>
              Start Game
            </button>
          ) : null}

          <div style={{ opacity: 0.75 }}>
            Jogadores: <b>{room?.players?.length ?? 0}</b>
          </div>
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

          {/* ✅ CARTA com tamanho responsivo */}
          <section className={`card ${turnPhase === "ready" ? "isReady" : ""} ${paused ? "paused" : ""}`} style={cardStyle}>
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
                    Tempo congelado
                  </div>
                  <div className="readySub">Carrega em Pausa/Retomar para voltar</div>
                </div>
              </div>
            ) : null}

            {/* ✅ pausa esconde itens */}
            {phase === "playing" && turnPhase === "play" && paused ? null : (
              <div className="itemsList" style={itemsListStyle}>
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
                        <span className="tick">{done ? "✅" : "☐"}</span>
                        <span className="itemText">{item}</span>
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
                  👥 Passar para colega (1x/turno)
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
            ) : (
              <div className="footNoteDock" style={{ opacity: 0.85 }}>
                {phase === "lobby"
                  ? isHost
                    ? "Escolhe categoria e clica Start Game."
                    : "Aguardando o host começar."
                  : phase === "finished"
                  ? "Partida terminou."
                  : "Aguarde a tua vez."}
              </div>
            )}
          </footer>

          {phase === "finished" && (
            <div className="cardReadyOverlay" aria-live="polite" style={{ pointerEvents: "auto" }}>
              <div className="readyPill" style={pillStyle}>
                <div className="readyTitle">🏆 Vencedor</div>
                <div className="readyCount">Equipa {winnerTeam}</div>
                <div className="readySub">Primeiro a chegar a {winScore} pontos</div>

                {isHost ? (
                  <button className="btnPrimary" style={{ marginTop: 12 }} onClick={restart} type="button">
                    🔁 Reiniciar partida
                  </button>
                ) : null}

                <button className="btnGhost" style={{ marginTop: 10 }} onClick={leaveToMenu} type="button">
                  ← Menu
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}