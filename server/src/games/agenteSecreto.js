import { BaseEngine } from "./baseEngine.js";
import { AGENTE_SECRETO_TRIOS, impostorCount, pickTrio } from "./agenteSecretoDB.js";

// Phase timings (ms). Kept short so a round doesn't drag between friends.
const REVEAL_MS   = 10_000;   // 10s to peek at your word
const CLUE_MS     = 60_000;   // 60s per clue round (or advance early)
const CHAT_MS     = 90_000;   // 90s open discussion
const VOTE_MS     = 45_000;   // 45s to vote
const RESULT_MS   = null;     // manual — host clicks "Nova ronda"

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const CHAT_MAX    = 400;      // messages kept in memory per game
const CHAT_TEXT_MAX = 240;    // per-message character cap
const CLUE_MAX    = 60;       // per-clue character cap

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
      phase: "lobby",           // lobby | reveal | clue1 | clue2 | clue3 | chat | vote | result
      endsAt: null,
      trio: null,               // { real, impostor: [a, b], tipo }
      impostorWord: null,       // one of trio.impostor, chosen once per game
      impostorIds: [],          // socketId[]
      clues: { 1: {}, 2: {}, 3: {} },   // round -> { playerId: text }
      chat: [],                 // [{ id, playerId, name, text, ts }]
      votes: {},                // playerId -> targetPlayerId
      resolvedRound: 1,         // 1 or 2 — which vote we're on (3 = tie-break vote)
      tieBreak: false,
      lastResult: null,         // { winner: "group" | "impostors", impostorIds, mostVoted, tally }
    };
    this._chatSeq = 0;
  }

  players() {
    return [...this.room.players.values()];
  }

  connectedPlayers() {
    return this.players().filter(p => p.connected !== false);
  }

  remapPlayerId(oldId, newId) {
    if (oldId === newId) return;
    // impostorIds
    this.state.impostorIds = this.state.impostorIds.map(id => (id === oldId ? newId : id));
    // clues (per round)
    for (const r of [1, 2, 3]) {
      const bucket = this.state.clues[r];
      if (bucket && bucket[oldId] != null) {
        bucket[newId] = bucket[oldId];
        delete bucket[oldId];
      }
    }
    // votes — both keys AND values (someone may have voted FOR the reconnected slot)
    if (this.state.votes[oldId] != null) {
      this.state.votes[newId] = this.state.votes[oldId];
      delete this.state.votes[oldId];
    }
    for (const k of Object.keys(this.state.votes)) {
      if (this.state.votes[k] === oldId) this.state.votes[k] = newId;
    }
    // chat authorship
    for (const m of this.state.chat) {
      if (m.playerId === oldId) m.playerId = newId;
    }
    // lastResult references
    if (this.state.lastResult) {
      if (Array.isArray(this.state.lastResult.impostorIds)) {
        this.state.lastResult.impostorIds =
          this.state.lastResult.impostorIds.map(id => (id === oldId ? newId : id));
      }
      if (this.state.lastResult.mostVoted === oldId) this.state.lastResult.mostVoted = newId;
    }
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

    // Pick trio + which of the two impostor options is used this game.
    const trio = pickTrio();
    const impostorWord = trio.impostor[Math.floor(Math.random() * trio.impostor.length)];
    // Assign impostor(s).
    const k = impostorCount(players.length);
    const shuffled = shuffle(players.map(pl => pl.id));
    const impostorIds = shuffled.slice(0, k);

    this.state.trio = trio;
    this.state.impostorWord = impostorWord;
    this.state.impostorIds = impostorIds;
    this.state.clues = { 1: {}, 2: {}, 3: {} };
    this.state.chat = [];
    this.state.votes = {};
    this.state.resolvedRound = 1;
    this.state.tieBreak = false;
    this.state.lastResult = null;

    this._enterPhase("reveal", REVEAL_MS);
    this.emitEvent({ type: "GAME_STARTED" });
  }

  restartGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    this.clearTimers();
    this.state.phase = "lobby";
    this.state.endsAt = null;
    this.state.trio = null;
    this.state.impostorWord = null;
    this.state.impostorIds = [];
    this.state.clues = { 1: {}, 2: {}, 3: {} };
    this.state.chat = [];
    this.state.votes = {};
    this.state.resolvedRound = 1;
    this.state.tieBreak = false;
    // Keep lastResult so the lobby can still show "última ronda ganhou X" briefly.
    this.emitState();
  }

  // Central phase controller. `ms=null` → open-ended (host will advance).
  _enterPhase(phase, ms) {
    this.clearTimers();
    this.state.phase = phase;
    this.state.endsAt = ms ? Date.now() + ms : null;

    if (ms) {
      // Emit state periodically so the countdown stays fresh across clients.
      this._setInterval(() => this.emitState(), 500);
      this._setTimeout(() => this._advancePhase(), ms);
    }
    this.emitEvent({ type: "PHASE", phase });
    this.emitState();
  }

  _advancePhase() {
    const cur = this.state.phase;
    if (cur === "reveal") return this._enterPhase("clue1", CLUE_MS);
    if (cur === "clue1")  return this._enterPhase("clue2", CLUE_MS);
    if (cur === "clue2")  return this._enterPhase("chat",  CHAT_MS);
    if (cur === "clue3")  return this._enterPhase("vote",  VOTE_MS);
    if (cur === "chat")   return this._enterPhase("vote",  VOTE_MS);
    if (cur === "vote")   return this._resolveVote();
    // result & lobby: nothing.
  }

  _resolveVote() {
    // Tally votes: only from currently connected players who voted.
    const tally = {};
    for (const target of Object.values(this.state.votes)) {
      tally[target] = (tally[target] || 0) + 1;
    }
    // Include all connected players as possible targets (0-count entries omitted).
    let mostVoted = null;
    let topCount = 0;
    let tied = false;
    for (const [id, count] of Object.entries(tally)) {
      if (count > topCount) { topCount = count; mostVoted = id; tied = false; }
      else if (count === topCount) { tied = true; }
    }

    if (tied && !this.state.tieBreak && topCount > 0) {
      // First tie: extra clue round + revote.
      this.state.tieBreak = true;
      this.state.votes = {};
      this.state.resolvedRound = 3;
      this.emitEvent({ type: "TIE" });
      return this._enterPhase("clue3", CLUE_MS);
    }

    // No votes at all → impostor wins by default.
    if (!mostVoted) {
      this._finishRound({ winner: "impostors", mostVoted: null, tally });
      return;
    }
    // Tie after tie-break → group loses (impostor escapes).
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
      trio: this.state.trio,
      impostorWord: this.state.impostorWord,
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
      case "SUBMIT_CLUE":   return this._cmdSubmitClue(socketId, command);
      case "SEND_CHAT":     return this._cmdSendChat(socketId, command);
      case "VOTE":          return this._cmdVote(socketId, command);
      case "ADVANCE_PHASE": return this._cmdAdvancePhase(socketId);
      default: return;
    }
  }

  _cmdSubmitClue(socketId, command) {
    const round =
      this.state.phase === "clue1" ? 1 :
      this.state.phase === "clue2" ? 2 :
      this.state.phase === "clue3" ? 3 : null;
    if (!round) return this.emitError(socketId, "NOT_IN_CLUE_PHASE");
    const text = sanitizeText(command?.text, CLUE_MAX);
    if (!text) return this.emitError(socketId, "EMPTY_CLUE");
    this.state.clues[round][socketId] = text;
    this.emitState();
    // Auto-advance when every connected player has submitted.
    const connected = this.connectedPlayers();
    const submitted = connected.every(p => this.state.clues[round][p.id]);
    if (submitted) this._advancePhase();
  }

  _cmdSendChat(socketId, command) {
    // Chat is open during chat / vote / result — anywhere post-clue2.
    const allowed = ["chat", "vote", "result", "clue1", "clue2", "clue3"];
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
    // Broadcast just the new message so clients don't have to diff the array.
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
    // Auto-advance when every connected player has voted.
    const connected = this.connectedPlayers();
    const voted = connected.every(p => this.state.votes[p.id]);
    if (voted) this._resolveVote();
  }

  _cmdAdvancePhase(socketId) {
    const p = this.room.players.get(socketId);
    if (!p?.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase === "lobby") return;
    // Host force-skip current phase (useful for chat / stalled clue rounds).
    this._advancePhase();
  }

  // ── STATE VIEWS ──────────────────────────────────────
  getPublicState() {
    const remainingMs = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;
    const players = this.players().map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected !== false,
      submittedClue: this._hasSubmittedCurrent(p.id),
      voted: this.state.phase === "vote" ? !!this.state.votes[p.id] : false,
    }));

    // Public clues per round: revealed only from clue2 onward
    // (round 1 is public once round 1 ends, so clients can show both together).
    const publicClues = { 1: null, 2: null, 3: null };
    const currentPhase = this.state.phase;
    // Clue 1 becomes public once clue1 is over (i.e. we're in clue2 or later).
    if (["clue2", "chat", "vote", "result", "clue3"].includes(currentPhase)) {
      publicClues[1] = this._cluesForRound(1);
    }
    if (["chat", "vote", "result", "clue3"].includes(currentPhase)) {
      publicClues[2] = this._cluesForRound(2);
    }
    if (["vote", "result"].includes(currentPhase) && this.state.tieBreak) {
      publicClues[3] = this._cluesForRound(3);
    }

    return {
      gameType: "agenteSecreto",
      phase: this.state.phase,
      remainingMs,
      players,
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
      impostorCount: impostorCount(this.connectedPlayers().length || 0),
      publicClues,
      chat: this.state.chat,
      votes: this.state.phase === "vote" || this.state.phase === "result"
        ? Object.fromEntries(Object.entries(this.state.votes)) : {},
      tieBreak: this.state.tieBreak,
      result: this.state.phase === "result" ? this.state.lastResult : null,
      // Reveal the trio (real word + both impostor options + which was used) only
      // once the round is over, so mid-game screens can't leak it.
      trio: this.state.phase === "result" ? {
        real: this.state.trio?.real ?? null,
        impostor: this.state.trio?.impostor ?? [],
        impostorWord: this.state.impostorWord,
      } : null,
    };
  }

  getPrivateState(playerId) {
    const isImpostor = this.state.impostorIds.includes(playerId);
    // Word visible during reveal → chat (hidden again during result so screen
    // focuses on the outcome). The impostor NEVER learns they are the impostor.
    const wordVisible = ["reveal", "clue1", "clue2", "clue3", "chat", "vote"].includes(this.state.phase);
    const word = wordVisible
      ? (isImpostor ? this.state.impostorWord : this.state.trio?.real ?? null)
      : null;
    // The player's own clue for each round (they can only see their own, others' show up after publicClues opens).
    const myClues = {
      1: this.state.clues[1]?.[playerId] ?? null,
      2: this.state.clues[2]?.[playerId] ?? null,
      3: this.state.clues[3]?.[playerId] ?? null,
    };
    return {
      word,
      // The result payload includes impostorIds publicly, so this flag is only
      // an early "you were an impostor" hint if you happened to be one. It only
      // becomes true at result — never mid-game.
      wasImpostor: this.state.phase === "result" ? isImpostor : false,
      myClues,
      myVote: this.state.votes[playerId] ?? null,
    };
  }

  _hasSubmittedCurrent(playerId) {
    const round =
      this.state.phase === "clue1" ? 1 :
      this.state.phase === "clue2" ? 2 :
      this.state.phase === "clue3" ? 3 : null;
    if (!round) return false;
    return !!this.state.clues[round]?.[playerId];
  }

  _cluesForRound(round) {
    const out = [];
    for (const p of this.players()) {
      const text = this.state.clues[round]?.[p.id];
      if (text) out.push({ playerId: p.id, name: p.name, text });
    }
    return out;
  }

  // ── PLAYER JOIN / LEAVE ──────────────────────────────
  onPlayerJoin(_player) {
    // Nothing special — public state will show them in the lobby.
    this.emitState();
  }

  onPlayerLeave(player) {
    if (!player) return;
    // If the game is running and the person leaving was an impostor, keep them
    // in the record — result screen still needs to know who was impostor.
    if (this.state.phase === "lobby") return;
    // Prevent a leaver from blocking auto-advance.
    if (this.state.phase.startsWith("clue")) {
      const round = Number(this.state.phase.slice(4));
      if (round) {
        const connected = this.connectedPlayers();
        const submitted = connected.every(p => this.state.clues[round]?.[p.id]);
        if (submitted) this._advancePhase();
      }
    }
    if (this.state.phase === "vote") {
      const connected = this.connectedPlayers();
      const voted = connected.every(p => this.state.votes[p.id]);
      if (voted) this._resolveVote();
    }
    this.emitState();
  }
}
