import { io } from "socket.io-client";

const SERVER_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://mz-party-games.onrender.com";

export const socket = io(SERVER_URL, {
  transports: ["websocket"],
});