import { BaseEngine } from "./baseEngine.js";

const READY_SECONDS = 3;
const TURN_SECONDS = 90;

const PASSES_PER_TURN = 10;
const WIN_SCORE = 10;

// ---- DECK PLACEHOLDER (substituir pelos teus items reais depois) ----
const ITEMS_MIX = [
  { type: "text", value: "Cristiano Ronaldo" },
  { type: "text", value: "Homem de Ferro" },
  { type: "text", value: "Pizza" },
  { type: "text", value: "Matrix" },
  { type: "img", src: "https://upload.wikimedia.org/wikipedia/commons/7/77/Google_Images_2015_logo.svg" },
];

const ITEMS_MZ = [
  { type: "text", value: "Moçambique" },
  { type: "text", value: "Maputo" },
];

const ITEMS_GLOBAL = [
  { type: "text", value: "Paris" },
  { type: "text", value: "Star Wars" },
];

const ITEMS_MZ_PIC = [
  { type: "img", src: "https://upload.wikimedia.org/wikipedia/commons/3/36/Flag_of_Mozambique.svg" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randInt(n) {
  return Math.floor(Math.random() * n);
}
function normalizeCategory(cat) {
  const c = String(cat || "").trim();
  // aceita keys parecidas do offline: mix | mz | mzPic | global
  if (c === "mz") return "mz";
  if (c === "mzPic") return "mzPic";
  if (c === "global") return "global";
  return "mix";
}

export class WhoIsWhoEngine extends BaseEngine {
  constructor({ io, roomCode, room }) {
    super({ io, roomCode, room });

    const initialCategory = normalizeCategory(room?.settings?.category || "mix");

    this.state = {
      phase: "lobby",      // lobby | playing | finished
      turnPhase: "ready",  // ready | play
      round: 0,

      winnerTeam: null,

      currentTeam: null,
      currentPlayerId: null, // explainer

      endsAt: null,

      paused: false,
      pausedRemainingMs: 0,

      category: initialCategory,
      deck: shuffle(this.getDeck(initialCategory)),
      deckIndex: 0,
      item: null,

      scores: { A: 0, B: 0 },
      passLeft: PASSES_PER_TURN,

      // rotação do explainer por equipa
      lastExplainerIdByTeam: { A: null, B: null },
    };
  }

  // ---------------- helpers ----------------
  players() {
    return [...this.room.players.values()];
  }
  playersByTeam(team) {
    return this.players().filter((p) => (p.team || "A") === team);
  }
  otherTeam(team) {
    return team === "A" ? "B" : "A";
  }
  currentPlayer() {
    if (!this.state.currentPlayerId) return null;
    return this.room.players.get(this.state.currentPlayerId) || null;
  }

  getDeck(categoryKey) {
    const k = normalizeCategory(categoryKey);
    if (k === "mzPic") return ITEMS_MZ_PIC;
    if (k === "mz") return ITEMS_MZ;
    if (k === "global") return ITEMS_GLOBAL;
    return ITEMS_MIX;
  }

  resetDeck(categoryKey) {
    const cat = normalizeCategory(categoryKey);
    this.state.category = cat;

    if (!this.room.settings) this.room.settings = {};
    this.room.settings.category = cat;

    this.state.deck = shuffle(this.getDeck(cat));
    this.state.deckIndex = 0;
    this.state.item = null;
  }

  ensureDeck() {
    if (!this.state.deck || this.state.deck.length === 0) {
      this.state.deck = shuffle(this.getDeck(this.state.category));
      this.state.deckIndex = 0;
    }
  }

  nextItem() {
    this.ensureDeck();
    const deck = this.state.deck;
    const idx = this.state.deckIndex % deck.length;
    this.state.item = deck[idx] || null;
    this.state.deckIndex = (this.state.deckIndex + 1) % deck.length;

    this.emitEvent({ type: "ITEM_CHANGED", by: this.state.currentPlayerId, team: this.state.currentTeam });
  }

  pickRandomStartingTeam() {
    const hasA = this.playersByTeam("A").length > 0;
    const hasB = this.playersByTeam("B").length > 0;

    if (hasA && hasB) return Math.random() < 0.5 ? "A" : "B";
    if (hasA) return "A";
    if (hasB) return "B";
    return null;
  }

  pickNextExplainer(team) {
    const list = this.playersByTeam(team);
    if (!list.length) return null;

    const last = this.state.lastExplainerIdByTeam?.[team] || null;

    if (!last) {
      const first = list[0];
      this.state.lastExplainerIdByTeam[team] = first.id;
      return first;
    }

    const idx = list.findIndex((p) => p.id === last);
    const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
    this.state.lastExplainerIdByTeam[team] = next.id;
    return next;
  }

  startPlayTimers(remainingMs) {
    const ms = Math.max(0, remainingMs);

    this.state.turnPhase = "play";
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.state.endsAt = Date.now() + ms;

    this.emitEvent({
      type: "TURN_STARTED",
      team: this.state.currentTeam,
      by: this.state.currentPlayerId,
    });

    this._setInterval(() => this.emitState(), 300);
    this._setTimeout(() => this.endTurn("TIME_UP"), ms);

    this.emitState();
  }

  pauseTurn(socketId) {
    const cur = this.currentPlayer();
    if (!cur) return;

    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
    if (this.state.paused) return;

    const remaining = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;

    this.clearTimers();
    this.state.paused = true;
    this.state.pausedRemainingMs = remaining;
    this.state.endsAt = null;

    this.emitEvent({ type: "PAUSED", by: socketId, remainingMs: remaining });
    this.emitState();
  }

  resumeTurn(socketId) {
    const cur = this.currentPlayer();
    if (!cur) return;

    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
    if (!this.state.paused) return;

    const remaining = Math.max(0, this.state.pausedRemainingMs || 0);

    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.emitEvent({ type: "RESUMED", by: socketId, remainingMs: remaining });

    this.clearTimers();
    this.state.endsAt = Date.now() + remaining;
    this._setInterval(() => this.emitState(), 300);
    this._setTimeout(() => this.endTurn("TIME_UP"), remaining);

    this.emitState();
  }

  // ---------------- lobby controls ----------------
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

  // ---------------- game flow ----------------
  startGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");

    if (this.state.phase !== "lobby") return this.emitError(socketId, "GAME_ALREADY_STARTED");
    if (this.players().length < 2) return this.emitError(socketId, "NOT_ENOUGH_PLAYERS");

    const startTeam = this.pickRandomStartingTeam();
    if (!startTeam) return this.emitError(socketId, "NO_TEAMS");

    const cat = normalizeCategory(this.room?.settings?.category || this.state.category || "mix");
    this.resetDeck(cat);

    this.state.phase = "playing";
    this.state.turnPhase = "ready";
    this.state.round = 1;

    this.state.winnerTeam = null;
    this.state.scores = { A: 0, B: 0 };

    this.state.currentTeam = startTeam;

    // reset passes/rotation state
    this.state.passLeft = PASSES_PER_TURN;
    this.state.lastExplainerIdByTeam = { A: null, B: null };

    this.emitEvent({ type: "GAME_STARTED", by: socketId, startingTeam: startTeam, category: cat });

    this.startTurn();
  }

  startTurn() {
    if (this.state.phase !== "playing") return;

    this.clearTimers();

    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.state.passLeft = PASSES_PER_TURN;

    // escolhe explainer da equipa atual (rotação)
    let explainer = this.pickNextExplainer(this.state.currentTeam);

    // fallback: se não houver ninguém nessa equipa, tenta a outra
    if (!explainer) {
      const other = this.otherTeam(this.state.currentTeam);
      explainer = this.pickNextExplainer(other);
      if (!explainer) {
        // ninguém em lado nenhum -> volta ao lobby
        this.state.phase = "lobby";
        this.state.turnPhase = "ready";
        this.state.currentTeam = null;
        this.state.currentPlayerId = null;
        this.state.item = null;
        this.state.endsAt = null;
        this.emitState();
        return;
      }
      this.state.currentTeam = other;
    }

    this.state.currentPlayerId = explainer.id;

    // prepara item do turno
    this.nextItem();

    // READY countdown
    this.state.turnPhase = "ready";
    this.state.endsAt = Date.now() + READY_SECONDS * 1000;

    this.emitEvent({
      type: "TURN_READY",
      team: this.state.currentTeam,
      by: this.state.currentPlayerId,
    });

    this._setInterval(() => this.emitState(), 250);
    this.emitState();

    this._setTimeout(() => {
      if (this.state.phase !== "playing") return;

      this.clearTimers();
      this.startPlayTimers(TURN_SECONDS * 1000);
    }, READY_SECONDS * 1000);
  }

  endTurn(reason) {
    if (this.state.phase !== "playing") return;

    this.clearTimers();

    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.emitEvent({
      type: "TURN_ENDED",
      reason,
      team: this.state.currentTeam,
      by: this.state.currentPlayerId,
    });

    if (this.state.currentTeam) this.state.currentTeam = this.otherTeam(this.state.currentTeam);

    this.state.round = (this.state.round || 0) + 1;

    if (this.players().length >= 2) {
      this.startTurn();
    } else {
      this.state.phase = "lobby";
      this.state.turnPhase = "ready";
      this.state.currentTeam = null;
      this.state.currentPlayerId = null;
      this.state.item = null;
      this.state.endsAt = null;
      this.emitState();
    }
  }

  restartGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "finished") return this.emitError(socketId, "NOT_FINISHED");

    this.clearTimers();

    const cat = normalizeCategory(this.room?.settings?.category || this.state.category || "mix");

    this.state.phase = "lobby";
    this.state.turnPhase = "ready";
    this.state.round = 0;

    this.state.winnerTeam = null;

    this.state.currentTeam = null;
    this.state.currentPlayerId = null;

    this.state.endsAt = null;

    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.state.scores = { A: 0, B: 0 };
    this.state.passLeft = PASSES_PER_TURN;

    this.state.lastExplainerIdByTeam = { A: null, B: null };

    this.resetDeck(cat);

    this.emitEvent({ type: "GAME_RESTARTED", by: socketId, category: cat });
    this.emitState();
  }

  handleCommand(socketId, command) {
    const cur = this.currentPlayer();
    if (!cur) return;

    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");

    const type = command?.type;

    if (type === "PAUSE_TOGGLE") {
      if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
      if (this.state.paused) this.resumeTurn(socketId);
      else this.pauseTurn(socketId);
      return;
    }

    if (this.state.paused) return this.emitError(socketId, "PAUSED");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");

    // ✅ SIM -> +1
    if (type === "YES") {
      const team = this.state.currentTeam || cur.team || "A";
      this.state.scores[team] = (this.state.scores[team] || 0) + 1;

      this.emitEvent({ type: "YES", by: socketId, team, score: this.state.scores[team] });

      // vitória aos 10, sem mostrar regra antes
      if (this.state.scores[team] >= WIN_SCORE) {
        this.state.winnerTeam = team;
        this.state.phase = "finished";
        this.state.turnPhase = "ready";
        this.state.endsAt = null;

        this.state.paused = false;
        this.state.pausedRemainingMs = 0;

        this.clearTimers();

        this.emitEvent({ type: "GAME_FINISHED", winnerTeam: team });
        this.emitState();
        return;
      }

      this.nextItem();
      this.emitState();
      return;
    }

    // ❌ ERRO -> sem ponto, avança item
    if (type === "NO") {
      this.emitEvent({ type: "NO", by: socketId, team: this.state.currentTeam });
      this.nextItem();
      this.emitState();
      return;
    }

    // ⏭ PASSAR -> gasta pass
    if (type === "PASS") {
      if ((this.state.passLeft || 0) <= 0) return this.emitError(socketId, "NO_PASSES_LEFT");
      this.state.passLeft -= 1;

      this.emitEvent({ type: "PASS", by: socketId, left: this.state.passLeft, team: this.state.currentTeam });

      this.nextItem();
      this.emitState();
      return;
    }

    return this.emitError(socketId, "UNKNOWN_COMMAND");
  }

  // ---------------- states ----------------
  getPublicState() {
    const cur = this.currentPlayer();

    let remainingMs = 0;
    if (this.state.paused) remainingMs = Math.max(0, this.state.pausedRemainingMs || 0);
    else remainingMs = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;

    return {
      gameType: "whoIsWho",

      phase: this.state.phase,
      turnPhase: this.state.turnPhase,
      round: this.state.round,

      winnerTeam: this.state.winnerTeam,

      category: this.state.category,

      currentTeam: this.state.currentTeam,
      currentPlayer: cur ? { id: cur.id, name: cur.name, team: cur.team } : null,

      paused: this.state.paused,

      remainingMs,
      scores: this.state.scores,

      passLeft: this.state.passLeft,

      // item só com id/meta pública (o conteúdo real é privado)
      item: this.state.item
        ? {
            type: this.state.item.type,
            id: `${this.state.deckIndex}-${this.state.item.type}`,
          }
        : null,
    };
  }

  getPrivateState(playerId) {
    const me = this.room.players.get(playerId);
    const cur = this.currentPlayer();

    if (!me || !cur) return { canAct: false, role: "NONE", item: null };

    const isExplainer = playerId === cur.id;

    return {
      role: isExplainer ? "EXPLAINER" : "GUESSER",
      canAct:
        isExplainer &&
        this.state.phase === "playing" &&
        this.state.turnPhase === "play" &&
        !this.state.paused,

      team: me.team ?? null,

      // só o explainer vê o item real
      item: isExplainer ? this.state.item : null,
    };
  }

  onPlayerLeave(player) {
    const cur = this.currentPlayer();

    // se o explainer sair a meio do turno, termina turno
    if (this.state.phase === "playing" && cur && player?.id === cur.id) {
      this.endTurn("EXPLAINER_LEFT");
      return;
    }

    this.emitState();
  }
}