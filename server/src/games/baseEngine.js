export class BaseEngine {
  constructor({ io, roomCode, room }) {
    this.io = io;
    this.roomCode = roomCode;
    this.room = room;

    this._timers = new Set();
    this._intervals = new Set();
  }

  // ---------- timers ----------
  _setTimeout(fn, ms) {
    const id = setTimeout(() => {
      this._timers.delete(id);
      fn();
    }, ms);
    this._timers.add(id);
    return id;
  }

  _setInterval(fn, ms) {
    const id = setInterval(fn, ms);
    this._intervals.add(id);
    return id;
  }

  clearTimers() {
    for (const id of this._timers) clearTimeout(id);
    for (const id of this._intervals) clearInterval(id);
    this._timers.clear();
    this._intervals.clear();
  }

  destroy() {
    this.clearTimers();
  }

  // ---------- emits ----------
  emitEvent(evt) {
    this.io.to(this.roomCode).emit("game:event", evt);
  }

  emitError(socketId, code, message) {
    const payload = { code, message: message ?? code };
    if (socketId) this.io.to(socketId).emit("game:error", payload);
    else this.io.to(this.roomCode).emit("game:error", payload);
  }

  emitState() {
    const pub = this.getPublicState();

    // envia privado + público para cada socket da sala
    for (const p of this.room.players.values()) {
      const priv = this.getPrivateState(p.id);
      this.io.to(p.id).emit("game:state", { public: pub, private: priv });
    }
  }

  // contrato
  startGame(socketId) {}
  restartGame(socketId) {}
  handleCommand(socketId, command) {}
  getPublicState() { return {}; }
  getPrivateState(playerId) { return {}; }

  onPlayerJoin(player) {}
  onPlayerLeave(player) {}
}