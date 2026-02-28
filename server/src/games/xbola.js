// server/src/games/xbola.js
import { BaseEngine } from "./baseEngine.js";

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

function emptyMatch() {
  return {
    board: Array(9).fill(null), // null | "X" | "O"
    turn: "X",
    movesX: [],
    movesO: [],
    winner: null, // "X" | "O" | null
    winLine: null, // [a,b,c] | null
  };
}

function getWinLine(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return { winner: v, line };
  }
  return { winner: null, line: null };
}

export class XbolaEngine extends BaseEngine {
  constructor(params) {
    super(params);

    this.state = {
      phase: "lobby", // lobby -> playing -> finished

      players: [], // 2 socketIds
      hostId: null,

      hostWants: null, // "X"|"O"
      symbolById: {}, // { [socketId]: "X"|"O" }

      winsX: 0,
      winsO: 0,
      duelWinner: null, // "X"|"O"|null

      match: emptyMatch(),
      colors: pickTwoDistinctColors(),

      fx: { poppedIdx: null, fadedIdx: null, fadeSymbol: null },

      nextRoundDelayMs: 3000,

      // ✅ anti-double start
      _starting: false,
    };
  }

  // ---------- helpers ----------
  getPlayer(socketId) {
    return this.room?.players?.get(socketId) ?? null;
  }

  isHost(socketId) {
    const p = this.getPlayer(socketId);
    if (this.state.hostId && socketId === this.state.hostId) return true;
    return !!p?.isHost;
  }

  _syncPlayers() {
    const ids = [...this.room.players.values()].map((p) => p.id);

    // X-Bola é 2 players
    this.state.players = ids.slice(0, 2);

    if (!this.state.hostId) {
      const host = [...this.room.players.values()].find((p) => p.isHost);
      this.state.hostId = host?.id ?? ids[0] ?? null;
    }
  }

  _otherSymbol(sym) {
    return sym === "X" ? "O" : "X";
  }

  _playerSymbol(socketId) {
    return this.state.symbolById?.[socketId] ?? null;
  }

  _resetMatch(firstTurn = "X") {
    this.clearTimers();
    this.state.match = emptyMatch();
    this.state.match.turn = firstTurn;
    this.state.colors = pickTwoDistinctColors();
    this.state.fx = { poppedIdx: null, fadedIdx: null, fadeSymbol: null };
  }

  _startNextRound() {
    const firstTurn = Math.random() < 0.5 ? "X" : "O";
    this._resetMatch(firstTurn);
    this.emitState();
    this.emitEvent({ type: "ROUND_STARTED", firstTurn });
  }

  _resetAllToLobby() {
    this.clearTimers();
    this._syncPlayers();

    this.state.phase = "lobby";
    this.state.hostWants = null;
    this.state.symbolById = {};

    this.state.winsX = 0;
    this.state.winsO = 0;
    this.state.duelWinner = null;

    this.state.match = emptyMatch();
    this.state.colors = pickTwoDistinctColors();
    this.state.fx = { poppedIdx: null, fadedIdx: null, fadeSymbol: null };

    this.state._starting = false;
  }

  // ---------- room lifecycle ----------
  onPlayerJoin() {
    this._syncPlayers();
    this.emitState();
  }

  onPlayerLeave() {
    this._resetAllToLobby();
    this.emitState();
  }

  // ---------- contract ----------
  startGame(socketId) {
    // ✅ idempotente: se já não está em lobby, ignora (anti double-start)
    if (this.state.phase !== "lobby") return;

    // ✅ lock curto anti duplo clique / lag
    if (this.state._starting) return;
    this.state._starting = true;
    this._setTimeout(() => (this.state._starting = false), 400);

    if (!this.isHost(socketId)) {
      this.emitError(socketId, "NOT_HOST", "Só o host pode iniciar.");
      return;
    }

    this._syncPlayers();

    if (this.state.players.length < 2) {
      this.emitError(socketId, "NEED_2_PLAYERS", "Precisa de 2 jogadores.");
      return;
    }

    if (!this.state.hostWants) {
      this.emitError(socketId, "CHOOSE_FIRST", "Escolhe X ou O antes de começar.");
      return;
    }

    const hostId = this.state.hostId;
    const p2Id = this.state.players.find((id) => id !== hostId) ?? null;

    if (!hostId || !p2Id) {
      this.emitError(socketId, "NEED_2_PLAYERS", "Precisa de 2 jogadores.");
      return;
    }

    // atribui símbolos
    this.state.symbolById = {
      [hostId]: this.state.hostWants,
      [p2Id]: this._otherSymbol(this.state.hostWants),
    };

    // inicia duelo
    this.state.phase = "playing";
    this.state.winsX = 0;
    this.state.winsO = 0;
    this.state.duelWinner = null;

    const firstTurn = Math.random() < 0.5 ? "X" : "O";
    this._resetMatch(firstTurn);

    this.emitState();
    this.emitEvent({ type: "GAME_STARTED", firstTurn });
  }

  restartGame(socketId) {
    if (!this.isHost(socketId)) {
      this.emitError(socketId, "NOT_HOST", "Só o host reinicia.");
      return;
    }

    this._resetAllToLobby();
    this.emitState();
    this.emitEvent({ type: "GAME_RESTARTED" });
  }

  handleCommand(socketId, command) {
    if (!command || typeof command.type !== "string") return;

    // Host escolhe símbolo no lobby
    if (command.type === "CHOOSE_SYMBOL") {
      this._syncPlayers();

      if (!this.state.hostId) this.state.hostId = socketId;

      if (!this.isHost(socketId)) {
        this.emitError(socketId, "NOT_HOST", "Só o host escolhe.");
        return;
      }
      if (this.state.phase !== "lobby") return;

      const want = command.symbol === "X" ? "X" : command.symbol === "O" ? "O" : null;
      if (!want) {
        this.emitError(socketId, "BAD_SYMBOL", "Símbolo inválido.");
        return;
      }

      this.state.hostWants = want;

      // 🔥 se tu queres auto-start ao escolher:
      // chama startGame aqui (vai respeitar anti-double e validações)
      this.startGame(socketId);

      this.emitState();
      return;
    }

    // Jogada
    if (command.type === "PLACE") {
      // ✅ validações server-side (corretas)
      if (this.state.phase !== "playing") {
        this.emitError(socketId, "NOT_PLAYING", "O jogo ainda não começou.");
        return;
      }
      if (this.state.duelWinner) return;

      const m = this.state.match;
      if (m.winner) return;

      const sym = this._playerSymbol(socketId);
      if (!sym) {
        this.emitError(socketId, "NO_SYMBOL", "Ainda não tens símbolo.");
        return;
      }
      if (sym !== m.turn) {
        this.emitError(socketId, "NOT_YOUR_TURN", "Não é a tua vez.");
        return;
      }

      const idx = command.idx;
      if (!Number.isInteger(idx) || idx < 0 || idx > 8) {
        this.emitError(socketId, "BAD_CELL", "Célula inválida.");
        return;
      }

      if (m.board[idx] != null) {
        return; // célula ocupada -> ignora suave
      }

      // limpa FX
      this.state.fx = { poppedIdx: null, fadedIdx: null, fadeSymbol: null };

      const moves = sym === "X" ? m.movesX : m.movesO;

      // adiciona nova jogada
      moves.push(idx);

      // FIFO: se passou de 3 remove o mais antigo
      if (moves.length > 3) {
        const removed = moves.shift();
        m.board[removed] = null;
        this.state.fx.fadedIdx = removed;
        this.state.fx.fadeSymbol = sym;
      }

      // marca no board
      m.board[idx] = sym;
      this.state.fx.poppedIdx = idx;

      // verifica vitória
      const { winner, line } = getWinLine(m.board);
      if (winner) {
        m.winner = winner;
        m.winLine = line;

        if (winner === "X") this.state.winsX += 1;
        else this.state.winsO += 1;

        // ✅ melhor de 3 = primeiro a 3 vitórias
        if (this.state.winsX >= 3) this.state.duelWinner = "X";
        if (this.state.winsO >= 3) this.state.duelWinner = "O";

        this.emitState();
        this.emitEvent({ type: "ROUND_FINISHED", winner });

        if (this.state.duelWinner) {
          this.state.phase = "finished";
          this.emitState();
          this.emitEvent({ type: "DUEL_FINISHED", winner: this.state.duelWinner });
        } else {
          this.clearTimers();
          this._setTimeout(() => this._startNextRound(), this.state.nextRoundDelayMs);
        }
        return;
      }

      // troca turno
      m.turn = sym === "X" ? "O" : "X";
      this.emitState();
      return;
    }

    // Reset do duelo (host-only)
    if (command.type === "RESET_DUEL") {
      if (!this.isHost(socketId)) {
        this.emitError(socketId, "NOT_HOST", "Só o host reinicia.");
        return;
      }
      this._resetAllToLobby();
      this.emitState();
      return;
    }
  }

  getPublicState() {
    const hostId = this.state.hostId;
    const p2Id = this.state.players.find((id) => id !== hostId) ?? null;

    const hostSymbol = hostId ? this.state.symbolById?.[hostId] ?? null : null;
    const p2Symbol = p2Id ? this.state.symbolById?.[p2Id] ?? null : null;

    return {
      phase: this.state.phase,
      players: this.state.players,
      hostId: this.state.hostId,

      hostWants: this.state.hostWants,

      hostSymbol,
      p2Symbol,

      winsX: this.state.winsX,
      winsO: this.state.winsO,
      duelWinner: this.state.duelWinner,

      match: this.state.match,
      colors: this.state.colors,
      fx: this.state.fx,

      nextRoundDelayMs: this.state.nextRoundDelayMs,
    };
  }

  getPrivateState(playerId) {
    const p = this.getPlayer(playerId);
    const sym = this._playerSymbol(playerId);

    const canAct =
      this.state.phase === "playing" &&
      !this.state.duelWinner &&
      !this.state.match?.winner &&
      sym &&
      sym === this.state.match?.turn;

    return {
      isHost: !!p?.isHost,
      symbol: sym,
      canAct: !!canAct,
    };
  }
}