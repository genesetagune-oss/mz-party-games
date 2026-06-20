// client/games/sporcleMZEngine.js — pure JS, no React

export class GameTimer {
  constructor() {
    this._interval = null;
    this._timeMs   = 0;
    this._maxMs    = 0;
    this._paused   = false;
    this._lastTick = 0;
    this._onTick   = null;
    this._onEnd    = null;
  }

  start(totalSeconds, onTick, onEnd) {
    this.stop();
    this._timeMs   = totalSeconds * 1000;
    this._maxMs    = totalSeconds * 1000;
    this._paused   = false;
    this._onTick   = onTick;
    this._onEnd    = onEnd;
    this._lastTick = Date.now();
    this._interval = setInterval(() => this._tick(), 100);
  }

  _tick() {
    if (this._paused) return;
    const now     = Date.now();
    const elapsed = now - this._lastTick;
    this._lastTick = now;
    this._timeMs   = Math.max(0, this._timeMs - elapsed);
    this._onTick?.(this.getRemaining());
    if (this._timeMs <= 0) { this.stop(); this._onEnd?.(); }
  }

  pause()  { this._paused = true; }
  resume() { this._paused = false; this._lastTick = Date.now(); }
  stop()   { if (this._interval) { clearInterval(this._interval); this._interval = null; } }

  getRemaining() { return this._timeMs / 1000; }
  getMax()       { return this._maxMs  / 1000; }
  isPaused()     { return this._paused; }
  isRunning()    { return this._interval !== null; }
}

// Solo scoring
export function calcSoloPoints(tempoRestante, tempoTotal, streak) {
  const base      = 10;
  const timeBonus = Math.round(10 * (tempoRestante / tempoTotal));
  const raw       = base + timeBonus;
  const mult      = streak >= 3 ? 1.2 : 1;
  return Math.round(raw * mult);
}
