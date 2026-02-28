import { io } from "socket.io-client";

const host = window.location.hostname; // localhost no PC, IP do PC no iPhone
export const socket = io(`http://${host}:3001`, {
  transports: ["websocket"],
});