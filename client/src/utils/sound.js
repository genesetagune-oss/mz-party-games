let _ctx = null;
let _muted = false;
let _interacted = false;

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

function unlock() {
  _interacted = true;
  try { getCtx().resume(); } catch {}
}

document.addEventListener("pointerdown", unlock, { once: true });
document.addEventListener("keydown",     unlock, { once: true });

export function setMuted(val) { _muted = val; }
export function isMuted()     { return _muted; }

export function playSound(type) {
  if (_muted || !_interacted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    if (type === "tick") {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = 800;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.15, now + 0.01);
      g.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);

    } else if (type === "correct") {
      [[660, 0], [880, 0.08]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now + delay);
        g.gain.linearRampToValueAtTime(0.18, now + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
        osc.start(now + delay); osc.stop(now + delay + 0.2);
      });

    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.22);
      g.gain.setValueAtTime(0.18, now);
      g.gain.linearRampToValueAtTime(0, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);

    } else if (type === "win") {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = now + i * 0.09;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t); osc.stop(t + 0.28);
      });

    } else if (type === "join") {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = 400;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now); osc.stop(now + 0.13);

    } else if (type === "turn_end") {
      // Two-note descending "time's up" — softer than wrong, cleaner than a buzz.
      [[520, 0], [340, 0.11]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now + delay);
        g.gain.linearRampToValueAtTime(0.16, now + delay + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);
        osc.start(now + delay); osc.stop(now + delay + 0.25);
      });

    } else if (type === "phase") {
      // Very subtle 1-note ping for phase transitions (reveal→clue→chat→vote).
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 720;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.08, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.16);

    } else if (type === "lose") {
      // Descending minor-ish chord for defeats (impostor escaped, etc.).
      [523, 415, 311].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = now + i * 0.12;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.14, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t); osc.stop(t + 0.32);
      });
    }
  } catch {}
}
