import { io } from "socket.io-client";

const hostname = window.location.hostname;
// localhost → liga directo ao servidor de dev
// IP local (192.168.x / 10.x) → Vite proxy encaminha para :3001
// produção → mesma origem (Express serve tudo)
const SERVER_URL = (hostname === "localhost" || hostname === "127.0.0.1")
  ? "http://localhost:3001"
  : window.location.origin;

export const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});