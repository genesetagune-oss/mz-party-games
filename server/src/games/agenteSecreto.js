import { BaseEngine } from "./baseEngine.js";
import {
  CATEGORIAS,
  pickWord,
  suggestedImpostorCount,
  maxImpostorCount,
  filterWordsByCategorias,
} from "./agenteSecretoDB.js";

// Nova mecânica (Undercover-style):
//  - Grupo recebe uma palavra concreta.
//  - Impostor(es) sabem que são impostores desde o reveal e vêem uma hint
//    curta (ex.: "Animal", "Comida").
//  - Fluxo: lobby → reveal (curta, com botão Pronto) → play (timer único,
//    chat + carta consultável) → vote → result.

const REVEAL_MS_MAX  = 15_000;        // tecto de espera antes de forçar avanço
const VOTE_MS        = 45_000;
const RESULT_MS      = null;          // manual — host clica "Nova ronda"

const MIN_PLAYERS   = 3;
const MAX_PLAYERS   = 20;
const CHAT_MAX      = 400;
const CHAT_TEXT_MAX = 240;

const DEFAULT_DURACAO_MIN = 3;         // duração default da fase Play
const VALID_DURACOES      = [3, 5, 10]; // opções que o host pode escolher

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sanitizeText(s, max) {
  if (typeof s !== "string") return "";
  return s.replace(/\s+/g, " ").trim().slice(0, max);
}

export class AgenteSecretoEngine extends BaseEngine {
  constructor(params) {
    super(params);
    this.state = {
      phase: "lobby",       // lobby | reveal | play | vote | result
      endsAt: null,

      // Host-controlled settings (mudam só no lobby)
      settings: {
        impostorCount: 1,                                   // 1..3
        hintEnabled: true,
        categoriaIds: CATEGORIAS.map(c => c.id),            // todas por defeito
        duracaoMinutos: DEFAULT_DURACAO_MIN,
      },

      // Round state
      word: null,           // palavra do grupo
      wordHint: null,       // hint curta mostrada ao impostor
      categoriaId: null,    // categoria seleccionada para esta partida (info)
      impostorIds: [],
      revealed: {},         // { playerId: boolean } — clicou "Pronto" no reveal
      chat: [],             // [{ id, playerId, name, text, ts }]
      votes: {},            // { voterId: targetId }

      lastResult: null,     // { winner, mostVoted, impostorIds, word, tally }
    };
    this._chatSeq = 0;
  }

  players()          { return [...this.room.players.values()]; }
  connectedPlayers() { return this.players().filter(p => p.connected !== false); }

  remapPlayerId(oldId, newId) {
    if (oldId === newId) return;
    this.state.impostorIds = this.state.impostorIds.map(id => (id === oldId ? newId : id));
    if (this.state.revealed[oldId] != null) {
      this.state.revealed[newId] = this.state.revealed[oldId];
      delete this.state.revealed[oldId];
    }
    if (this.state.votes[oldId] != null) {
      this.state.votes[newId] = this.state.votes[oldId];
      delete this.state.votes[oldId];
    }
    for (const k of Object.keys(this.state.votes)) {
      if (this.state.votes[k] === oldId) this.state.votes[k] = newId;
    }
    for (const m of this.state.chat) {
      if (m.playerId === oldId) m.playerId = newId;
    }
    if (this.state.lastResult) {
      if (Array.isArray(this.state.lastResult.impostorIds)) {
        this.state.lastResult.impostorIds =
          this.state.lastResult.impostorIds.map(id => (id === oldId ? newId : id));
      }
      if (this.state.lastResult.mostVoted === oldId) this.state.lastResult.mostVoted = newId;
    }
  }

  // ── SETTINGS ─────────────────────────────────────────
  setSettings(socketId, settings = {}) {
    const p = this.room.players.get(socketId);
    if (!p?.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "lobby") return this.emitError(socketId, "NOT_IN_LOBBY");

    const s = this.state.settings;
    const playerCount = this.connectedPlayers().length;

    if (typeof settings.impostorCount === "number") {
      const cap = maxImpostorCount(Math.max(playerCount, MIN_PLAYERS));
      s.impostorCount = Math.max(1, Math.min(cap, Math.floor(settings.impostorCount)));
    }
    if (typeof settings.hintEnabled === "boolean") {
      s.hintEnabled = settings.hintEnabled;
    }
    if (Array.isArray(settings.categoriaIds)) {
      const valid = new Set(CATEGORIAS.map(c => c.id));
      const filtered = settings.categoriaIds.filter(id => valid.has(id));
      // não permitimos lista vazia — cairia numa partida sem palavras
      s.categoriaIds = filtered.length ? filtered : CATEGORIAS.map(c => c.id);
    }
    if (typeof settings.duracaoMinutos === "number") {
      s.duracaoMinutos = VALID_DURACOES.includes(settings.duracaoMinutos)
        ? settings.duracaoMinutos
        : DEFAULT_DURACAO_MIN;
    }

    this.emitState();
  }

  // ── LIFECYCLE ────────────────────────────────────────
  startGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "lobby") return this.emitError(socketId, "NOT_IN_LOBBY");

    const players = this.connectedPlayers();
    if (players.length < MIN_PLAYERS)
      return this.emitError(socketId, "NEED_MIN_PLAYERS", `Precisas de pelo menos ${MIN_PLAYERS} jogadores.`);
    if (players.length > MAX_PLAYERS)
      return this.emitError(socketId, "TOO_MANY_PLAYERS", `Máximo ${MAX_PLAYERS} jogadores.`);

    // Sanity-check das settings: cap de impostores pode ter mudado se o número
    // de jogadores mudou entre setup e Start.
    const cap = maxImpostorCount(players.length);
    const impostorK = Math.max(1, Math.min(cap, this.state.settings.impostorCount));

    // Pool com base nas categorias seleccionadas.
    const pool = filterWordsByCategorias(this.state.settings.categoriaIds);
    if (pool.length === 0)
      return this.emitError(socketId, "EMPTY_POOL", "Categorias sem palavras.");
    const picked = pickWord(this.state.settings.categoriaIds);
    if (!picked) return this.emitError(socketId, "PICK_FAILED");

    this.state.word = picked.palavra;
    this.state.wordHint = picked.hint;
    this.state.categoriaId = picked.categoriaId;

    // Impostores aleatórios.
    const shuffled = shuffle(players.map(pl => pl.id));
    this.state.impostorIds = shuffled.slice(0, impostorK);

    // Reset per-round state
    this.state.revealed = {};
    this.state.chat = [];
    this.state.votes = {};
    this.state.lastResult = null;

    this._enterPhase("reveal", REVEAL_MS_MAX);
    this.emitEvent({ type: "GAME_STARTED" });
  }

  restartGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    this.clearTimers();
    this.state.phase = "lobby";
    this.state.endsAt = null;
    this.state.word = null;
    this.state.wordHint = null;
    this.state.categoriaId = null;
    this.state.impostorIds = [];
    this.state.revealed = {};
    this.state.chat = [];
    this.state.votes = {};
    // Manter lastResult para poder mostrar o último resultado no lobby.
    this.emitState();
  }

  // Central phase controller. `ms=null` → open-ended (host will advance).
  _enterPhase(phase, ms) {
    this.clearTimers();
    this.state.phase = phase;
    this.state.endsAt = ms ? Date.now() + ms : null;
    if (ms) {
      this._setInterval(() => this.emitState(), 500);
      this._setTimeout(() => this._advancePhase(), ms);
    }
    this.emitEvent({ type: "PHASE", phase });
    this.emitState();
  }

  _advancePhase() {
    const cur = this.state.phase;
    if (cur === "reveal") {
      // Duração escolhida pelo host, em milissegundos.
      const playMs = (this.state.settings.duracaoMinutos || DEFAULT_DURACAO_MIN) * 60_000;
      return this._enterPhase("play", playMs);
    }
    if (cur === "play")  return this._enterPhase("vote", VOTE_MS);
    if (cur === "vote")  return this._resolveVote();
    // lobby, result: nada.
  }

  _resolveVote() {
    const tally = {};
    for (const target of Object.values(this.state.votes)) {
      tally[target] = (tally[target] || 0) + 1;
    }
    let mostVoted = null;
    let topCount = 0;
    let tied = false;
    for (const [id, count] of Object.entries(tally)) {
      if (count > topCount) { topCount = count; mostVoted = id; tied = false; }
      else if (count === topCount) { tied = true; }
    }

    // Sem votos → impostor(es) escapam.
    if (!mostVoted) {
      this._finishRound({ winner: "impostors", mostVoted: null, tally });
      return;
    }
    // Empate → impostor(es) escapam (sem tie-break neste modelo simples).
    if (tied) {
      this._finishRound({ winner: "impostors", mostVoted: null, tally });
      return;
    }
    const winner = this.state.impostorIds.includes(mostVoted) ? "group" : "impostors";
    this._finishRound({ winner, mostVoted, tally });
  }

  _finishRound(payload) {
    this.state.lastResult = {
      winner: payload.winner,
      mostVoted: payload.mostVoted,
      tally: payload.tally,
      impostorIds: [...this.state.impostorIds],
      word: this.state.word,
      wordHint: this.state.wordHint,
      categoriaId: this.state.categoriaId,
    };
    this.emitEvent({ type: "RESULT", ...this.state.lastResult });
    this._enterPhase("result", RESULT_MS);
  }

  // ── COMMANDS ─────────────────────────────────────────
  handleCommand(socketId, command) {
    const type = command?.type;
    const player = this.room.players.get(socketId);
    if (!player) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");

    switch (type) {
      case "READY":         return this._cmdReady(socketId);
      case "SEND_CHAT":     return this._cmdSendChat(socketId, command);
      case "VOTE":          return this._cmdVote(socketId, command);
      case "ADVANCE_PHASE": return this._cmdAdvancePhase(socketId);
      default: return;
    }
  }

  // Reveal: cada jogador clica "Pronto" depois de ver a carta.
  _cmdReady(socketId) {
    if (this.state.phase !== "reveal") return;
    this.state.revealed[socketId] = true;
    this.emitState();
    // Auto-avança se todos os conectados estiverem prontos.
    const connected = this.connectedPlayers();
    if (connected.every(p => this.state.revealed[p.id])) {
      this._advancePhase();
    }
  }

  _cmdSendChat(socketId, command) {
    // Chat disponível durante play, vote, result.
    const allowed = ["play", "vote", "result"];
    if (!allowed.includes(this.state.phase)) return;
    const text = sanitizeText(command?.text, CHAT_TEXT_MAX);
    if (!text) return;
    const player = this.room.players.get(socketId);
    const msg = {
      id: ++this._chatSeq,
      playerId: socketId,
      name: player?.name ?? "?",
      text,
      ts: Date.now(),
    };
    this.state.chat.push(msg);
    if (this.state.chat.length > CHAT_MAX) {
      this.state.chat.splice(0, this.state.chat.length - CHAT_MAX);
    }
    this.emitEvent({ type: "CHAT", message: msg });
    this.emitState();
  }

  _cmdVote(socketId, command) {
    if (this.state.phase !== "vote") return this.emitError(socketId, "NOT_IN_VOTE_PHASE");
    const target = command?.target;
    if (!target || !this.room.players.has(target)) return this.emitError(socketId, "INVALID_TARGET");
    if (target === socketId) return this.emitError(socketId, "CANNOT_VOTE_SELF");
    this.state.votes[socketId] = target;
    this.emitState();
    // Auto-resolve se todos os conectados votaram.
    const connected = this.connectedPlayers();
    if (connected.every(p => this.state.votes[p.id])) {
      this._resolveVote();
    }
  }

  _cmdAdvancePhase(socketId) {
    const p = this.room.players.get(socketId);
    if (!p?.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase === "lobby") return;
    this._advancePhase();
  }

  // ── STATE VIEWS ──────────────────────────────────────
  getPublicState() {
    const remainingMs = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;
    const players = this.players().map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected !== false,
      ready: this.state.phase === "reveal" ? !!this.state.revealed[p.id] : false,
      voted: this.state.phase === "vote"   ? !!this.state.votes[p.id]   : false,
    }));

    const playerCount = this.connectedPlayers().length;
    const suggestedK  = suggestedImpostorCount(Math.max(playerCount, MIN_PLAYERS));
    const cap         = maxImpostorCount(Math.max(playerCount, MIN_PLAYERS));

    return {
      gameType: "agenteSecreto",
      phase: this.state.phase,
      remainingMs,
      players,
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,

      // Settings expostos ao cliente para renderizar o setup.
      settings: {
        impostorCount:  this.state.settings.impostorCount,
        hintEnabled:    this.state.settings.hintEnabled,
        categoriaIds:   this.state.settings.categoriaIds,
        duracaoMinutos: this.state.settings.duracaoMinutos,
      },
      impostorCountSuggested: suggestedK,
      impostorCountMax:       cap,
      validDuracoes:          VALID_DURACOES,
      categorias:             CATEGORIAS,

      chat: this.state.chat,
      votes: (this.state.phase === "vote" || this.state.phase === "result")
        ? Object.fromEntries(Object.entries(this.state.votes))
        : {},

      // Só no result revelamos palavra + impostor(es).
      result: this.state.phase === "result" ? this.state.lastResult : null,
    };
  }

  getPrivateState(playerId) {
    const isImpostor = this.state.impostorIds.includes(playerId);
    // Palavra visível do reveal até ao vote; escondida no result para focar
    // no outcome. Impostor NÃO recebe a palavra do grupo — recebe hint.
    const wordPhases = new Set(["reveal", "play", "vote"]);
    let card = null;
    if (wordPhases.has(this.state.phase)) {
      card = isImpostor
        ? {
            role: "impostor",
            word: null,
            hint: this.state.settings.hintEnabled ? (this.state.wordHint || null) : null,
          }
        : {
            role: "civil",
            word: this.state.word,
            hint: null,
          };
    }
    return {
      card,
      // Só no result é que se assume publicamente que este jogador era impostor.
      wasImpostor: this.state.phase === "result" ? isImpostor : false,
      ready: !!this.state.revealed[playerId],
      myVote: this.state.votes[playerId] ?? null,
    };
  }

  // ── PLAYER JOIN / LEAVE ──────────────────────────────
  onPlayerJoin(_player) {
    // Ajusta impostorCount se ficou acima do novo cap.
    const cap = maxImpostorCount(Math.max(this.connectedPlayers().length, MIN_PLAYERS));
    if (this.state.settings.impostorCount > cap) this.state.settings.impostorCount = cap;
    this.emitState();
  }

  onPlayerLeave(player) {
    if (!player) return;
    if (this.state.phase === "lobby") {
      // reajusta o cap se a saída baixar o número de jogadores.
      const cap = maxImpostorCount(Math.max(this.connectedPlayers().length, MIN_PLAYERS));
      if (this.state.settings.impostorCount > cap) this.state.settings.impostorCount = cap;
      this.emitState();
      return;
    }
    // Impedir que um leaver bloqueie auto-advance.
    if (this.state.phase === "reveal") {
      const connected = this.connectedPlayers();
      if (connected.every(p => this.state.revealed[p.id])) this._advancePhase();
    }
    if (this.state.phase === "vote") {
      const connected = this.connectedPlayers();
      if (connected.every(p => this.state.votes[p.id])) this._resolveVote();
    }
    this.emitState();
  }
}
