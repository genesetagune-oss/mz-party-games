import { Router } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE  = path.join(__dirname, "../../analytics_data.json");
const STATS_KEY  = process.env.ANALYTICS_SECRET || "mzstats2024";
const VALID      = new Set(["app_opened", "room_joined", "game_started", "game_finished", "returned"]);
const FUNNEL     = ["app_opened", "room_joined", "game_started", "game_finished"];

// ── persistence ───────────────────────────────────────────────────────────────
let events = [];
try { if (existsSync(DATA_FILE)) events = JSON.parse(readFileSync(DATA_FILE, "utf8")); } catch {}

let flushTimer = null;
function scheduleSave() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try { writeFileSync(DATA_FILE, JSON.stringify(events)); } catch {}
  }, 5000);
}

// ── router ────────────────────────────────────────────────────────────────────
export const analyticsRouter = Router();

analyticsRouter.post("/track", (req, res) => {
  const { event_name, device_id, game_name } = req.body || {};
  if (!VALID.has(event_name))                  return res.status(400).json({ ok: false, error: "INVALID_EVENT" });
  if (!device_id || device_id.length > 64)     return res.status(400).json({ ok: false, error: "INVALID_DEVICE" });
  events.push({ event_name, device_id, game_name: game_name || null, timestamp: new Date().toISOString() });
  scheduleSave();
  res.json({ ok: true });
});

analyticsRouter.get("/stats", (req, res) => {
  if (req.query.key !== STATS_KEY) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  res.json({
    ok: true,
    generated_at: new Date().toISOString(),
    total_events: events.length,
    total: computeStats(events),
    per_game: perGameStats(),
  });
});

function perGameStats() {
  const names = [...new Set(events.map(e => e.game_name).filter(Boolean))];
  return Object.fromEntries(names.map(g => [g, computeStats(events.filter(e => e.game_name === g))]));
}

function computeStats(evs) {
  const map = {};
  for (const { event_name, device_id } of evs) {
    if (!map[event_name]) map[event_name] = { count: 0, devices: new Set() };
    map[event_name].count++;
    map[event_name].devices.add(device_id);
  }
  const counts  = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.count]));
  const uniq    = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.devices.size]));
  const funnel  = FUNNEL.map(e => ({ event: e, count: counts[e] ?? 0, unique_devices: uniq[e] ?? 0 }));
  const returning = new Set(evs.filter(e => e.event_name === "returned").map(e => e.device_id)).size;
  return { counts, unique_devices: uniq, funnel, returning_devices: returning };
}
