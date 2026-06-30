import { BaseEngine } from "./baseEngine.js";
import { QUEM_SOU_EU_DB, CATEGORIAS, getDeckForCategory } from "./quemSouEuDB.js";

const READY_SECONDS = 3;
const PASSES_PER_TURN = 5;
const WIN_SCORE = 10;

function autoTurnSeconds(playerCount) {
  if (playerCount <= 2) return 90;
  if (playerCount === 3) return 75;
  if (playerCount === 4) return 60;
  if (playerCount === 5) return 50;
  if (playerCount === 6) return 45;
  return 40;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeCategory(cat) {
  const c = String(cat || "").trim().toLowerCase();
  const valid = CATEGORIAS.map(x => x.id);
  return valid.includes(c) ? c : "mix";
}

export class WhoIsWhoEngine extends BaseEngine {
  constructor({ io, roomCode, room }) {
    super({ io, roomCode, room });

    const initialCategory = normalizeCategory(room?.settings?.category || "mix");

    this.state = {
      phase: "lobby",
      turnPhase: "ready",
      playerOrder: [],
      currentIndex: 0,
      currentPlayerId: null,
      endsAt: null,
      paused: false,
      pausedRemainingMs: 0,
      category: initialCategory,
      deck: getDeckForCategory(initialCategory, { soNomes: false }),
      deckIndex: 0,
      item: null,
      scores: {},
      winner: null,
      passLeft: PASSES_PER_TURN,
      turnSeconds: 60,
      turnSecondsOverride: null,
    };
  }

  players() { return [...this.room.players.values()]; }
  currentPlayer() {
    if (!this.state.currentPlayerId) return null;
    return this.room.players.get(this.state.currentPlayerId) || null;
  }

  resetDeck(categoryId) {
    const cat = normalizeCategory(categoryId);
    this.state.category = cat;
    if (!this.room.settings) this.room.settings = {};
    this.room.settings.category = cat;
    this.state.deck = getDeckForCategory(cat, { soNomes: false });
    this.state.deckIndex = 0;
    this.state.item = null;
  }

  ensureDeck() {
    if (!this.state.deck || this.state.deck.length === 0) {
      this.state.deck = getDeckForCategory(this.state.category, { soNomes: false });
      this.state.deckIndex = 0;
    }
  }

  nextItem() {
    this.ensureDeck();
    const deck = this.state.deck;
    const idx = this.state.deckIndex % deck.length;
    this.state.item = deck[idx] || null;
    this.state.deckIndex = (this.state.deckIndex + 1) % deck.length;
  }

  computeTurnSeconds() {
    if (this.state.turnSecondsOverride) return this.state.turnSecondsOverride;
    return autoTurnSeconds(this.players().length);
  }

  setCategory(socketId, category) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "lobby") return this.emitError(socketId, "NOT_IN_LOBBY");
    const cat = normalizeCategory(category);
    this.resetDeck(cat);
    this.emitEvent({ type: "CATEGORY_SET", by: socketId, category: cat });
    this.emitState();
  }

  setSettings(socketId, settings) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "lobby") return this.emitError(socketId, "NOT_IN_LOBBY");

    if (settings.category != null) {
      this.resetDeck(normalizeCategory(settings.category));
    }
    if (settings.turnSecondsOverride != null) {
      const v = parseInt(settings.turnSecondsOverride, 10);
      this.state.turnSecondsOverride = (isNaN(v) || v <= 0) ? null : Math.min(Math.max(v, 15), 180);
    }
    this.emitState();
  }

  startGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "lobby") return this.emitError(socketId, "GAME_ALREADY_STARTED");
    const allPlayers = this.players();
    if (allPlayers.length < 2) return this.emitError(socketId, "NOT_ENOUGH_PLAYERS");

    const cat = normalizeCategory(this.room?.settings?.category || this.state.category || "mix");
    this.resetDeck(cat);

    const playerOrder = shuffle(allPlayers.map(pl => pl.id));
    const scores = {};
    for (const pl of allPlayers) scores[pl.id] = 0;

    this.state.phase = "playing";
    this.state.turnPhase = "ready";
    this.state.playerOrder = playerOrder;
    this.state.currentIndex = 0;
    this.state.currentPlayerId = playerOrder[0];
    this.state.scores = scores;
    this.state.winner = null;
    this.state.turnSeconds = this.computeTurnSeconds();
    this.emitEvent({ type: "GAME_STARTED", by: socketId, category: cat, playerOrder });
    this.startTurn();
  }

  startTurn() {
    if (this.state.phase !== "playing") return;
    this.clearTimers();
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;
    this.state.passLeft = PASSES_PER_TURN;
    this.state.turnSeconds = this.computeTurnSeconds();

    const order = this.state.playerOrder;
    // skip players who left
    let idx = this.state.currentIndex % order.length;
    let tries = 0;
    while (!this.room.players.has(order[idx]) && tries < order.length) {
      idx = (idx + 1) % order.length;
      tries++;
    }
    if (tries >= order.length) {
      this.state.phase = "lobby"; this.state.turnPhase = "ready";
      this.state.currentPlayerId = null; this.state.item = null;
      this.emitState(); return;
    }
    this.state.currentIndex = idx;
    this.state.currentPlayerId = order[idx];

    this.nextItem();
    this.state.turnPhase = "ready";
    this.state.endsAt = Date.now() + READY_SECONDS * 1000;
    this.emitEvent({ type: "TURN_READY", by: this.state.currentPlayerId });
    this._setInterval(() => this.emitState(), 250);
    this.emitState();
    this._setTimeout(() => {
      if (this.state.phase !== "playing") return;
      this.clearTimers();
      this.startPlayTimers(this.state.turnSeconds * 1000);
    }, READY_SECONDS * 1000);
  }

  startPlayTimers(ms) {
    const time = Math.max(0, ms);
    this.state.turnPhase = "play";
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;
    this.state.endsAt = Date.now() + time;
    this.emitEvent({ type: "TURN_STARTED", by: this.state.currentPlayerId });
    this._setInterval(() => this.emitState(), 300);
    this._setTimeout(() => this.endTurn("TIME_UP"), time);
    this.emitState();
  }

  endTurn(reason) {
    if (this.state.phase !== "playing") return;
    this.clearTimers();
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;
    this.emitEvent({ type: "TURN_ENDED", reason, by: this.state.currentPlayerId });

    const order = this.state.playerOrder;
    this.state.currentIndex = (this.state.currentIndex + 1) % order.length;

    if (this.players().length >= 2) {
      this.startTurn();
    } else {
      this.state.phase = "lobby"; this.state.turnPhase = "ready";
      this.state.currentPlayerId = null; this.state.item = null; this.state.endsAt = null;
      this.emitState();
    }
  }

  pauseTurn(socketId) {
    const cur = this.currentPlayer();
    if (!cur || socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return;
    if (this.state.turnPhase !== "play") return;
    if (this.state.paused) return;
    const remaining = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;
    this.clearTimers();
    this.state.paused = true;
    this.state.pausedRemainingMs = remaining;
    this.state.endsAt = null;
    this.emitState();
  }

  resumeTurn(socketId) {
    const cur = this.currentPlayer();
    if (!cur || socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return;
    if (this.state.turnPhase !== "play") return;
    if (!this.state.paused) return;
    const remaining = Math.max(0, this.state.pausedRemainingMs || 0);
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;
    this.clearTimers();
    this.state.endsAt = Date.now() + remaining;
    this._setInterval(() => this.emitState(), 300);
    this._setTimeout(() => this.endTurn("TIME_UP"), remaining);
    this.emitState();
  }

  handleCommand(socketId, command) {
    const cur = this.currentPlayer();
    if (!cur) return;
    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return;
    const type = command?.type;

    if (type === "PAUSE_TOGGLE") {
      if (this.state.turnPhase !== "play") return;
      if (this.state.paused) this.resumeTurn(socketId);
      else this.pauseTurn(socketId);
      return;
    }

    if (this.state.paused) return;
    if (this.state.turnPhase !== "play") return;

    if (type === "YES") {
      const playerId = this.state.currentPlayerId;
      this.state.scores[playerId] = (this.state.scores[playerId] || 0) + 1;
      const score = this.state.scores[playerId];
      this.emitEvent({ type: "YES", by: socketId, score });
      if (score >= WIN_SCORE) {
        const pl = this.room.players.get(playerId);
        this.state.winner = { id: playerId, name: pl?.name || "?", score };
        this.state.phase = "finished"; this.state.turnPhase = "ready";
        this.state.endsAt = null; this.state.paused = false;
        this.clearTimers();
        this.emitEvent({ type: "GAME_FINISHED", winner: this.state.winner });
        this.emitState(); return;
      }
      this.nextItem(); this.emitState(); return;
    }

    if (type === "NO") {
      this.emitEvent({ type: "NO", by: socketId });
      this.nextItem(); this.emitState(); return;
    }

    if (type === "PASS") {
      if ((this.state.passLeft || 0) <= 0) return this.emitError(socketId, "NO_PASSES_LEFT");
      this.state.passLeft -= 1;
      this.emitEvent({ type: "PASS", by: socketId, left: this.state.passLeft });
      this.nextItem(); this.emitState(); return;
    }
  }

  restartGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "finished") return this.emitError(socketId, "NOT_FINISHED");
    this.clearTimers();
    const cat = normalizeCategory(this.room?.settings?.category || this.state.category || "mix");
    this.state.phase = "lobby"; this.state.turnPhase = "ready";
    this.state.playerOrder = []; this.state.currentIndex = 0;
    this.state.currentPlayerId = null; this.state.endsAt = null;
    this.state.paused = false; this.state.pausedRemainingMs = 0;
    this.state.scores = {}; this.state.winner = null; this.state.passLeft = PASSES_PER_TURN;
    this.resetDeck(cat);
    this.emitState();
  }

  getPublicState() {
    const cur = this.currentPlayer();
    let remainingMs = 0;
    if (this.state.paused) remainingMs = Math.max(0, this.state.pausedRemainingMs || 0);
    else remainingMs = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;

    const allPlayers = this.players();
    const scoreboard = allPlayers.map(pl => ({
      id: pl.id,
      name: pl.name,
      score: this.state.scores[pl.id] ?? 0,
      isCurrent: pl.id === this.state.currentPlayerId,
    })).sort((a, b) => b.score - a.score);

    return {
      gameType: "whoIsWho",
      phase: this.state.phase,
      turnPhase: this.state.turnPhase,
      currentPlayer: cur ? { id: cur.id, name: cur.name } : null,
      paused: this.state.paused,
      remainingMs,
      scoreboard,
      winner: this.state.winner,
      category: this.state.category,
      passLeft: this.state.passLeft,
      turnSeconds: this.state.turnSeconds,
      turnSecondsOverride: this.state.turnSecondsOverride,
    };
  }

  getPrivateState(playerId) {
    const cur = this.currentPlayer();
    if (!cur) return { canAct: false, role: "NONE", item: null };
    const isExplainer = playerId === cur.id;
    return {
      role: isExplainer ? "EXPLAINER" : "GUESSER",
      canAct: isExplainer && this.state.phase === "playing" && this.state.turnPhase === "play" && !this.state.paused,
      item: isExplainer ? (this.state.item ? { type: "text", value: this.state.item.nome } : null) : null,
    };
  }

  onPlayerLeave(player) {
    const cur = this.currentPlayer();
    if (this.state.phase === "playing" && cur && player?.id === cur.id) {
      this.endTurn("EXPLAINER_LEFT"); return;
    }
    // remove from scores and order
    if (player?.id) {
      delete this.state.scores[player.id];
      this.state.playerOrder = this.state.playerOrder.filter(id => id !== player.id);
    }
    this.emitState();
  }
}
