import React, { useEffect, useMemo, useRef } from "react";
import { socket } from "../socket";
import "../App.css";

export default function WhoIsWhoOnline({ onBack, room, roomCode, gamePublic, gamePrivate }) {
  const me = room?.players?.find((p) => p.id === socket.id) || null;
  const isHost = !!me?.isHost;

  const phase = gamePublic?.phase ?? "lobby";
  const turnPhase = gamePublic?.turnPhase ?? "ready";
  const paused = !!gamePublic?.paused;

  const scores = gamePublic?.scores ?? { A: 0, B: 0 };
  const teamTurn = gamePublic?.currentTeam ?? "-";
  const playerName = gamePublic?.currentPlayer?.name ?? "-";

  const remaining = Math.ceil((gamePublic?.remainingMs ?? 0) / 1000);

  const winnerTeam = gamePublic?.winnerTeam ?? null;

  const category = gamePublic?.category ?? room?.settings?.category ?? "mix";

  const passLeft = gamePublic?.passLeft ?? 0;

  const role = gamePrivate?.role ?? "NONE";
  const isExplainer = role === "EXPLAINER";
  const canAct = !!gamePrivate?.canAct;

  const item = gamePrivate?.item ?? null;

  // audio warmup (opcional, igual ao 30s: mantém UX)
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

  // actions
  const leaveToMenu = () => {
    socket.emit("room:leave");
    onBack?.();
  };

  const startGame = () => {
    warmupAudio();
    socket.emit("game:start");
  };

  const setCat = (cat) => {
    warmupAudio();
    socket.emit("game:setCategory", { category: cat });
  };

  const yes = () => {
    warmupAudio();
    socket.emit("game:command", { type: "YES" });
  };

  const no = () => {
    warmupAudio();
    socket.emit("game:command", { type: "NO" });
  };

  const pass = () => {
    warmupAudio();
    socket.emit("game:command", { type: "PASS" });
  };

  const togglePause = () => {
    warmupAudio();
    socket.emit("game:command", { type: "PAUSE_TOGGLE" });
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

  const title = useMemo(() => {
    if (phase === "finished") return `🏆 Vencedor: Equipa ${winnerTeam}`;
    if (phase !== "playing") return "Aguardando Start Game…";
    return `Vez da Equipa ${teamTurn} — ${playerName} está a ver`;
  }, [phase, winnerTeam, teamTurn, playerName]);

  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">
            ← Menu
          </button>

          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Quem sou eu? (Online)</div>
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
                onClick={() => setCat("mix")}
                disabled={!isHost}
                style={category === "mix" ? { outline: "2px solid rgba(255,255,255,0.35)" } : null}
              >
                🎲 Mix
              </button>

              <button
                className="btnSoft"
                type="button"
                onClick={() => setCat("mz")}
                disabled={!isHost}
                style={category === "mz" ? { outline: "2px solid rgba(255,255,255,0.35)" } : null}
              >
                🇲🇿 MZ (texto)
              </button>

              <button
                className="btnSoft"
                type="button"
                onClick={() => setCat("mzPic")}
                disabled={!isHost}
                style={category === "mzPic" ? { outline: "2px solid rgba(255,255,255,0.35)" } : null}
              >
                🖼️ MZ (fotos)
              </button>

              <button
                className="btnSoft"
                type="button"
                onClick={() => setCat("global")}
                disabled={!isHost}
                style={category === "global" ? { outline: "2px solid rgba(255,255,255,0.35)" } : null}
              >
                🌍 Global
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
              {title}
              {paused ? <span className="muted"> — (PAUSADO)</span> : null}
            </div>

            {/* regra de vitória NÃO aparece (como pediste) */}
            <div className="winRule">Passes: {passLeft}</div>
          </section>

          <section className={`card ${turnPhase === "ready" ? "isReady" : ""} ${paused ? "paused" : ""}`}>
            <div className="cardTop">
              <div className="cardTitle">{isExplainer ? "Tu estás a ver" : "Quem eu sou?"}</div>
              <div className="cardHint">
                {phase !== "playing"
                  ? ""
                  : turnPhase === "ready"
                  ? ""
                  : paused
                  ? "Pausado"
                  : isExplainer
                  ? "Usa os botões: SIM / ERRO / PASSAR"
                  : "Adivinha! (o item está escondido para ti)"}
              </div>
            </div>

            <div style={{ padding: 16, display: "grid", placeItems: "center", minHeight: 220 }}>
              {phase === "finished" ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 42, fontWeight: 900 }}>🏆</div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>Equipa {winnerTeam}</div>

                  {isHost ? (
                    <button className="btnPrimary" style={{ marginTop: 14 }} onClick={restart} type="button">
                      🔁 Reiniciar partida
                    </button>
                  ) : null}

                  <button className="btnGhost" style={{ marginTop: 10 }} onClick={leaveToMenu} type="button">
                    ← Menu
                  </button>
                </div>
              ) : phase !== "playing" ? (
                <div style={{ opacity: 0.85 }}>
                  {isHost ? "Escolhe categoria e clica Start Game." : "Aguardando o host começar."}
                </div>
              ) : turnPhase === "ready" ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Pronto…</div>
                  <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}>{remaining}</div>
                </div>
              ) : isExplainer ? (
                item?.type === "img" ? (
                  <img
                    src={item.src}
                    alt="item"
                    style={{ maxWidth: "min(86vw, 520px)", maxHeight: 320, borderRadius: 14, border: "1px solid #333" }}
                  />
                ) : (
                  <div style={{ fontSize: 46, fontWeight: 900, textAlign: "center", lineHeight: 1.05 }}>
                    {item?.value ?? ""}
                  </div>
                )
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 44, fontWeight: 900 }}>🤔</div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>Quem eu sou?</div>
                </div>
              )}
            </div>
          </section>

          <footer className="actionDock">
  {phase === "playing" && turnPhase === "play" ? (
    isExplainer ? (
      <>
        <button className="btnSoft dockFull" onClick={yes} disabled={!canAct} type="button">
          ✅ SIM
        </button>

        <button className="btnSoft dockFull" onClick={no} disabled={!canAct} type="button">
          ❌ ERRO
        </button>

        <div className="dock2">
          <button
            className="btnSoft"
            onClick={pass}
            disabled={!canAct || passLeft <= 0}
            type="button"
          >
            ⏭ PASSAR ({passLeft})
          </button>

          <button
            className="btnSoft"
            onClick={togglePause}
            disabled={!canTogglePause}
            type="button"
          >
            {paused ? "▶️ Retomar" : "⏸️ Pausa"}
          </button>
        </div>
      </>
    ) : (
      <div className="footNoteDock" style={{ opacity: 0.85 }}>
        Adivinha e fala em voz alta. {playerName} confirma com os botões.
      </div>
    )
  ) : (
    <div className="footNoteDock" style={{ opacity: 0.85 }}>
      {phase === "lobby"
        ? isHost
          ? "Escolhe categoria e clica Start Game."
          : "Aguardando o host começar."
        : phase === "finished"
        ? "Partida terminou."
        : "Aguarde…"}
    </div>
  )}
</footer>
        </main>
      </div>
    </div>
  );
}