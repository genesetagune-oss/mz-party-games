import { io } from "socket.io-client";

const hostname = window.location.hostname;
// localhost → liga directo ao servidor de dev
// IP local (192.168.x / 10.x) → Vite proxy encaminha para :3001
// produção → mesma origem (Express serve tudo)
const SERVER_URL = (hostname === "localhost" || hostname === "127.0.0.1")
  ? "http://localhost:3001"
  : window.location.origin;

// Persistent, cross-tab client identity so a socket reconnect (call,
// screen lock, tab switch) can be recognised as the same player and the
// server can restore their in-game state.
const LS_CLIENT_ID = "mzpg_client_id";
function ensureClientId() {
  try {
    let id = localStorage.getItem(LS_CLIENT_ID);
    if (!id) {
      id = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(LS_CLIENT_ID, id);
    }
    return id;
  } catch {
    return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const clientId = ensureClientId();

// Pre-warm the backend the moment the page loads. Render free tier sleeps
// after 15 min idle and takes ~10-30s to wake. Firing this /health ping
// during the app's own boot means the server is usually awake by the time
// the user has typed their name and reached for "Criar sala".
try { fetch(`${SERVER_URL}/health`, { cache: "no-store" }).catch(() => {}); } catch {}

export const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export { SERVER_URL };