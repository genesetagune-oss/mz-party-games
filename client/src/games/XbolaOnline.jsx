// client/src/games/XbolaOnline.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../socket";
import { playSound } from "../utils/sound";

const CENTER = [
  { x: 0.5, y: 0.5 },
  { x: 1.5, y: 0.5 },
  { x: 2.5, y: 0.5 },
  { x: 0.5, y: 1.5 },
  { x: 1.5, y: 1.5 },
  { x: 2.5, y: 1.5 },
  { x: 0.5, y: 2.5 },
  { x: 1.5, y: 2.5 },
  { x: 2.5, y: 2.5 },
];

export default function XbolaOnline({ onBack, room, roomCode, gamePublic, gamePrivate, onSwitchGame }) {
  const me = room?.players?.find((p) => p.id === socket.id) || null;
  const isHost = !!me?.isHost;

  const phase = gamePublic?.phase ?? "lobby";
  const playerCount = room?.players?.length ?? 0;

  const hostWants = gamePublic?.hostWants ?? null;
  const winsX = gamePublic?.winsX ?? 0;
  const winsO = gamePublic?.winsO ?? 0;
  const duelWinner = gamePublic?.duelWinner ?? null;
  const duelWinsToWin = gamePublic?.duelWinsToWin ?? 3;

  const match = gamePublic?.match ?? null;
  const board = match?.board ?? Array(9).fill(null);
  const turn = match?.turn ?? "X";
  const winner = match?.winner ?? null;
  const winLine = match?.winLine ?? null;

  const colors = gamePublic?.colors ?? { x: "#7B5CFF", o: "#2DD4FF" };
  const fx = gamePublic?.fx ?? { poppedIdx: null, fadedIdx: null, fadeSymbol: null };

  const mySymbol = gamePrivate?.symbol ?? null;
  const canAct = !!gamePrivate?.canAct;

  const hostSymbol = gamePublic?.hostSymbol ?? null;
  const p2Symbol = gamePublic?.p2Symbol ?? null;

  const [poppedIdxLocal, setPoppedIdxLocal] = useState(null);
  const [fadedIdxLocal, setFadedIdxLocal] = useState(null);
  const [fadeSymbolLocal, setFadeSymbolLocal] = useState(null);

  useEffect(() => {
    if (fx?.poppedIdx == null) return;
    setPoppedIdxLocal(fx.poppedIdx);
    const t = setTimeout(() => setPoppedIdxLocal(null), 160);
    return () => clearTimeout(t);
  }, [fx?.poppedIdx]);

  useEffect(() => {
    if (fx?.fadedIdx == null) return;
    setFadedIdxLocal(fx.fadedIdx);
    setFadeSymbolLocal(fx?.fadeSymbol ?? null);
    const t = setTimeout(() => {
      setFadedIdxLocal(null);
      setFadeSymbolLocal(null);
    }, 180);
    return () => clearTimeout(t);
  }, [fx?.fadedIdx, fx?.fadeSymbol]);

  const prevPhaseRefX = useRef(phase);
  useEffect(() => {
    if (prevPhaseRefX.current !== "finished" && phase === "finished") playSound("win");
    prevPhaseRefX.current = phase;
  }, [phase]);

  const leaveToMenu = () => {
    socket.emit("room:leave");
    onBack?.();
  };

  const chooseSymbol = (symbol) => {
    socket.emit("game:command", { type: "CHOOSE_SYMBOL", symbol });
  };

  const restartDuel = () => {
    socket.emit("game:restart");
  };

  const handleShare = async () => {
    const text = `🎮 Acabei de jogar MZ Party Games! Vem jogar também → https://mz-party-games.onrender.com`;
    if (navigator.share) {
      try { await navigator.share({ title: "MZ Party Games", text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  };

  const place = (idx) => {
    if (!canAct) return;
    socket.emit("game:command", { type: "PLACE", idx });
  };

  const shareRoomCode = async () => {
    const code = (roomCode || "").trim();
    if (!code) return;
    const url = `https://mz-party-games.onrender.com/?join=${code}`;
    const text = `🎮 Joga MZ Party Games comigo!\nEntra directo → ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "MZ Party Games", text, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); } catch {
      window.prompt("Copia o link:", url);
    }
  };

  const headerStatus = useMemo(() => {
    if (phase === "lobby") return "Lobby";
    if (phase === "finished" && duelWinner) return "Duelo terminado";
    if (winner) return `Vencedor da partida: ${winner}`;
    return `Vez: ${turn}`;
  }, [phase, duelWinner, winner, turn]);

  const duelWinnerPlayerText = useMemo(() => {
    if (!duelWinner) return "";
    if (hostSymbol && duelWinner === hostSymbol) return "Jogador 1 venceu 🏆";
    if (p2Symbol && duelWinner === p2Symbol) return "Jogador 2 venceu 🏆";
    return duelWinner === "X" ? "X venceu 🏆" : "O venceu 🏆";
  }, [duelWinner, hostSymbol, p2Symbol]);

  const guestLobbyText = useMemo(() => {
    if (playerCount < 2) return "Aguardando mais 1 jogador…";
    return "Aguardando o host iniciar…";
  }, [playerCount]);

  const renderWinOverlay = () => {
    if (!winLine) return null;
    const [a, , c] = winLine;
    const p1 = CENTER[a];
    const p2 = CENTER[c];

    return (
      <svg className="xbola-winSvg" viewBox="0 0 3 3" preserveAspectRatio="none" aria-hidden="true">
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="xbola-winLine" />
      </svg>
    );
  };

  const pillBox = {
    pointerEvents: "auto",
    width: "min(520px, 92vw)",
    maxWidth: 520,
    padding: 18,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.35)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.45)",
  };

  const pillBoxSmall = {
    pointerEvents: "auto",
    width: "min(420px, 92vw)",
    maxWidth: 420,
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.30)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.40)",
  };

  const bigBtn = (active) => ({
    width: "100%",
    padding: 14,
    borderRadius: 16,
    fontWeight: 950,
    letterSpacing: 0.2,
    border: active ? "1px solid rgba(0,255,170,.35)" : "1px solid rgba(255,255,255,.14)",
    background: active ? "rgba(0,255,170,.10)" : "rgba(0,0,0,.22)",
    color: "var(--txt)",
    cursor: "pointer",
  });

  return (
    <div
      className="appBg xbola-bg"
      style={{
        ["--xColor"]: colors.x,
        ["--oColor"]: colors.o,
      }}
    >
      <div className="shell xbola-shell">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">
            ← Menu
          </button>

          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">X-Bola Infinito (Online)</div>
            <div style={{ opacity: 0.8, marginTop: 4, fontSize: 12 }}>
              Sala: <b>{roomCode || "-"}</b>
              {mySymbol ? (
                <>
                  {" "}
                  • Tu és: <b>{mySymbol}</b>
                </>
              ) : null}
            </div>
          </div>

          <div className="timerPill">
            {phase === "playing" ? (canAct ? "✅ Tua vez" : "⏳ Aguarde") : ""}
          </div>
        </header>

        <div
          className="xbola-hintBlock"
          style={{
            display: "flex",
            gap: 8,
            padding: "0 14px 14px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ opacity: 0.85 }}>
            {headerStatus} • Placar: <b>X {winsX}</b> — <b>{winsO} O</b>
          </div>
          <div style={{ opacity: 0.75 }}>
            Jogadores: <b>{playerCount}</b>
          </div>
        </div>

        <main className="gameMain">
          <section className="turnRow">
            <div className="turnText">
              Cada jogador só pode ter 3 marcas. Ao jogar a 4ª, a mais antiga desaparece.
            </div>
            <div className="winRule">Primeiro a {duelWinsToWin}</div>
          </section>

          <section className="xbola-panel">
            <div className="xbola-stage">
              <div className="xbola-board" aria-label="Tabuleiro">
                <div className="xbola-grid" role="grid" aria-label="Tabuleiro 3 por 3">
                  {Array.from({ length: 9 }, (_, idx) => {
                    const v = board[idx];
                    const showFade = fadedIdxLocal === idx;
                    const display = showFade ? fadeSymbolLocal : v;
                    const isPop = poppedIdxLocal === idx;
                    const disabled = phase !== "playing" || !canAct || v != null;

                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`xbola-cell ${display ? "is-filled" : ""} ${isPop ? "is-pop" : ""} ${
                          showFade ? "is-fade" : ""
                        }`}
                        onClick={() => place(idx)}
                        disabled={disabled}
                        aria-label={`célula ${idx + 1}`}
                      >
                        <span
                          className={`xbola-mark ${
                            display === "X" ? "is-x" : display === "O" ? "is-o" : ""
                          }`}
                        >
                          {display ?? ""}
                        </span>
                      </button>
                    );
                  })}
                  {renderWinOverlay()}
                </div>
              </div>
            </div>
          </section>

          {phase === "lobby" ? (
            <div className="cardReadyOverlay" aria-live="polite" style={{ pointerEvents: "auto" }}>
              {isHost ? (
                <div style={pillBox}>
                  <div style={{ fontWeight: 950, fontSize: 16 }}>X-Bola</div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                    <div style={{ opacity: 0.85, fontSize: 13 }}>
                      Código: <b>{roomCode || "-"}</b>
                    </div>
                    <button
                      type="button"
                      className="btnPrimary"
                      onClick={shareRoomCode}
                      style={{ padding: "8px 12px" }}
                    >
                      Partilhar
                    </button>
                  </div>

                  <div style={{ opacity: 0.8, marginTop: 10, fontSize: 13, lineHeight: 1.35 }}>
                    {playerCount < 2
                      ? "Aguarda mais 1 jogador para começar."
                      : "Prontos! Clica em Começar."}
                  </div>

                  {playerCount >= 2 && (
                    <button
                      type="button"
                      className="btnPrimary"
                      onClick={() => socket.emit("game:start")}
                      style={{ marginTop: 12 }}
                    >
                      ▶ Começar
                    </button>
                  )}

                  <button
                    className="btnGhost"
                    style={{ marginTop: 12 }}
                    onClick={leaveToMenu}
                    type="button"
                  >
                    ← Menu
                  </button>
                </div>
              ) : (
                <div style={pillBoxSmall}>
                  <div style={{ fontWeight: 950, fontSize: 14 }}>Lobby</div>

                  <div style={{ opacity: 0.85, marginTop: 10, fontSize: 13, lineHeight: 1.35 }}>
                    {guestLobbyText}
                  </div>

                  <button
                    className="btnGhost"
                    style={{ marginTop: 10 }}
                    onClick={leaveToMenu}
                    type="button"
                  >
                    ← Menu
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {phase === "finished" && duelWinner ? (
            <div className="cardReadyOverlay" aria-live="polite" style={{ pointerEvents: "auto" }}>
              <div style={pillBox}>
                <div style={{ fontWeight: 950, fontSize: 16 }}>🏆 Duelo terminado</div>
                <div style={{ fontWeight: 950, fontSize: 34, marginTop: 8, lineHeight: 1.05 }}>
                  {duelWinnerPlayerText}
                </div>
                <div style={{ opacity: 0.8, marginTop: 8, fontSize: 13 }}>
                  Primeiro a chegar a {duelWinsToWin} vitórias
                </div>

                <button
                  className="victoryBtn share"
                  style={{ marginTop: 14, width: "100%" }}
                  onClick={handleShare}
                  type="button"
                >
                  📲 Partilhar
                </button>

                {isHost ? (
                  <>
                    <button className="btnPrimary" style={{ marginTop: 10 }} onClick={restartDuel} type="button">🔁 Reiniciar</button>
                    <button className="btnPrimary" style={{ marginTop: 6 }} onClick={onSwitchGame} type="button">🎮 Mudar Jogo</button>
                  </>
                ) : (
                  <div className="waitingHostMsg" style={{ marginTop: 10 }}><div className="waitingHostDot" />Host a decidir próximo passo...</div>
                )}

                <button
                  className="btnGhost"
                  style={{ marginTop: 10 }}
                  onClick={leaveToMenu}
                  type="button"
                >
                  ← Menu
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}