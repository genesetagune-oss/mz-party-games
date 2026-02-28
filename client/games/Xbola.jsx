import React, { useEffect, useMemo, useRef, useState } from "react";
import "../src/App.css";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinLine(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return { winner: v, line };
  }
  return { winner: null, line: null };
}

function initMatch() {
  return {
    board: Array(9).fill(null),
    turn: "X",
    movesX: [],
    movesO: [],
    winner: null,
    winLine: null,
  };
}

const COLOR_POOL = [
  "#7B5CFF",
  "#00FFAA",
  "#2DD4FF",
  "#3B82F6",
  "#EF4444",
  "#F43F5E",
  "#22C55E",
  "#10B981",
];

function pickTwoDistinctColors() {
  const a = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
  let b = a;
  let guard = 0;
  while (b === a && guard < 30) {
    b = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
    guard++;
  }
  return { x: a, o: b };
}

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

export default function XBola({ onBack }) {
  // duelo
  const [winsX, setWinsX] = useState(0);
  const [winsO, setWinsO] = useState(0);
  const [duelWinner, setDuelWinner] = useState(null);

  // partida
  const [match, setMatch] = useState(initMatch);

  // cores por partida
  const [colors, setColors] = useState(() => pickTwoDistinctColors());

  // animações
  const [poppedIdx, setPoppedIdx] = useState(null);
  const [fadedIdx, setFadedIdx] = useState(null);
  const [fadeSymbol, setFadeSymbol] = useState(null);

  // auto next
  const nextRoundTimeoutRef = useRef(null);

  // ✅ guard anti-duplicação (StrictMode)
  const handledWinRef = useRef(false);

  const round = useMemo(() => winsX + winsO + 1, [winsX, winsO]);

  const headerStatus = useMemo(() => {
  if (duelWinner) {
    const who = duelWinner === "X" ? "Jogador 1" : "Jogador 2";
    return `${who} venceu 🏆`;
  }
  if (match.winner) return `Vencedor da partida: ${match.winner}`;
  return `Vez: ${match.turn}`;
}, [duelWinner, match.winner, match.turn]);

  const clearNextTimeout = () => {
    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
  };

  const resetMatchOnly = () => {
    clearNextTimeout();
    handledWinRef.current = false; // ✅ nova partida = pode contar win novamente
    setMatch(initMatch());
    setPoppedIdx(null);
    setFadedIdx(null);
    setFadeSymbol(null);
    setColors(pickTwoDistinctColors());
  };

  const resetDuel = () => {
    clearNextTimeout();
    handledWinRef.current = false;
    setWinsX(0);
    setWinsO(0);
    setDuelWinner(null);
    setMatch(initMatch());
    setPoppedIdx(null);
    setFadedIdx(null);
    setFadeSymbol(null);
    setColors(pickTwoDistinctColors());
  };

  // pop
  useEffect(() => {
    if (poppedIdx == null) return;
    const t = setTimeout(() => setPoppedIdx(null), 160);
    return () => clearTimeout(t);
  }, [poppedIdx]);

  // fade
  useEffect(() => {
    if (fadedIdx == null) return;
    const t = setTimeout(() => {
      setFadedIdx(null);
      setFadeSymbol(null);
    }, 180);
    return () => clearTimeout(t);
  }, [fadedIdx]);

  // ✅ AQUI é onde contamos a vitória (1x) e agendamos o próximo round
  useEffect(() => {
    if (!match.winner) return;
    if (handledWinRef.current) return; // ✅ impede duplicar
    handledWinRef.current = true;

    const winner = match.winner;

    // atualiza placar 1x
    if (winner === "X") {
      setWinsX((prev) => {
        const next = prev + 1;
        if (next >= 2) setDuelWinner("X");
        return next;
      });
    } else {
      setWinsO((prev) => {
        const next = prev + 1;
        if (next >= 2) setDuelWinner("O");
        return next;
      });
    }

    // agenda próximo round em 3s, MAS só se o duelo ainda não acabou
    clearNextTimeout();
    nextRoundTimeoutRef.current = setTimeout(() => {
      // se alguém já ganhou o duelo, não avança
      // (não dá para confiar no state aqui 100% sem refs, então checamos de forma simples pelo DOM state atual)
      // melhor: se duelWinner já está setado, ele re-renderiza e o botão reiniciar fica ativo — mas aqui só resetamos a partida.
      // ainda assim, protegemos:
      if (winner === "X") {
        // se X acabou de ganhar e isso fez 2, não reset
        // (não temos o valor "next" aqui, então verificamos a condição no render pelo duelWinner; se já tiver, o reset do duelo fica manual)
      }
      // Se duelWinner já foi setado até aqui, o efeito do duelWinner vai rerender;
      // mas este timeout pode disparar antes — então colocamos um guard leve:
      // se o duelo já terminou, não mexer:
      // (guard real abaixo)
      resetMatchOnly();
    }, 1000);

    return () => clearNextTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.winner]);

  // ✅ se o duelo terminar (2 vitórias), cancelamos o auto-next
  useEffect(() => {
    if (duelWinner) clearNextTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelWinner]);

  const clickCell = (idx) => {
    setMatch((prev) => {
      if (duelWinner) return prev;
      if (prev.winner) return prev;
      if (prev.board[idx] != null) return prev;

      const next = {
        board: [...prev.board],
        turn: prev.turn,
        movesX: [...prev.movesX],
        movesO: [...prev.movesO],
        winner: null,
        winLine: null,
      };

      const isX = next.turn === "X";
      const moves = isX ? next.movesX : next.movesO;

      moves.push(idx);

      if (moves.length > 3) {
        const removed = moves.shift();
        setFadedIdx(removed);
        setFadeSymbol(isX ? "X" : "O");
        next.board[removed] = null;
      }

      next.board[idx] = next.turn;
      setPoppedIdx(idx);

      const { winner, line } = getWinLine(next.board);
      if (winner) {
        next.winner = winner;
        next.winLine = line;
        return next; // ✅ sem side effects aqui
      }

      next.turn = isX ? "O" : "X";
      return next;
    });
  };

  const renderWinOverlay = () => {
    if (!match.winLine) return null;
    const [a, , c] = match.winLine;
    const p1 = CENTER[a];
    const p2 = CENTER[c];

    return (
      <svg className="xbola-winSvg" viewBox="0 0 3 3" preserveAspectRatio="none" aria-hidden="true">
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="xbola-winLine" />
      </svg>
    );
  };

  const renderCell = (idx) => {
    const v = match.board[idx];
    const showFade = fadedIdx === idx;
    const display = showFade ? fadeSymbol : v;

    const classes = ["xbola-cell"];
    if (poppedIdx === idx) classes.push("is-pop");
    if (showFade) classes.push("is-fade");

    return (
      <button
        key={idx}
        type="button"
        className={classes.join(" ")}
        onClick={() => clickCell(idx)}
        aria-label={`célula ${idx + 1}`}
      >
        <span className={`xbola-mark ${display === "X" ? "is-x" : display === "O" ? "is-o" : ""}`}>
          {display ?? ""}
        </span>
      </button>
    );
  };

  return (
    <div
      className="imposterBg xbola-bg"
      style={{
        ["--xColor"]: colors.x,
        ["--oColor"]: colors.o,
      }}
    >
      <div className="shell xbola-shell">
        <div className="imposterTop">
          <div>
            <div className="muted">
              {headerStatus} • Placar: X {winsX} — {winsO} O • Jogo {Math.min(round, 3)}
            </div>
            <div className="bigName">X-Bola Infinito</div>
          </div>

          
        </div>

        <div className="imposterPanel xbola-panel">
          <div className="block xbola-hintBlock">
            <div className="muted">
              Cada jogador só pode ter 3 marcas. Ao jogar a 4ª, a mais antiga desaparece.
            </div>
          </div>

          <div className="xbola-stage">
            <div className="xbola-board" aria-label="Tabuleiro">
              <div className="xbola-grid" role="grid" aria-label="Tabuleiro 3 por 3">
                {Array.from({ length: 9 }, (_, i) => renderCell(i))}
                {renderWinOverlay()}
              </div>
            </div>
          </div>
         {duelWinner && (
  <div className="xbola-winOverlay" role="dialog" aria-live="polite">
    <div className="xbola-winCard">
      <div className="xbola-winTitle">
        {duelWinner === "X" ? "Jogador 1 venceu 🏆" : "Jogador 2 venceu 🏆"}
      </div>
      <div className="xbola-winSub">
        Placar final: X {winsX} — {winsO} O
      </div>

      <button className="pickBtn xbola-winBtn" type="button" onClick={resetDuel}>
        Reiniciar
      </button>
    </div>
  </div>
)}
{duelWinner && (
  <div className="xbola-winOverlay" role="dialog" aria-live="polite">
    <div className="xbola-winCard">
      <div className="xbola-winTitle">
        {duelWinner === "X" ? "Jogador 1 venceu 🏆" : "Jogador 2 venceu 🏆"}
      </div>
      <div className="xbola-winSub">
        Placar final: X {winsX} — {winsO} O
      </div>

      <button className="pickBtn xbola-winBtn" type="button" onClick={resetDuel}>
        Reiniciar
      </button>
    </div>
  </div>
)}
        <div className="xbola-footer">
  <button
    className="pickBtn xbola-menuBtn"
    type="button"
    onClick={() => (onBack ? onBack() : null)}
  >
    Voltar ao menu
  </button>
</div>
        </div>
      </div>
    </div>
  );
}