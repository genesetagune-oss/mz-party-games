import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { Server } from "socket.io";
import { RoomManager } from "./rooms/roomManager.js";
import { createEngine } from "./games/index.js";
import { analyticsRouter } from "./analytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.on("uncaughtException", (err) => console.error("🔥 uncaughtException:", err));
process.on("unhandledRejection", (err) => console.error("🔥 unhandledRejection:", err));

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/api", analyticsRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const roomManager = new RoomManager();
const socketRoom = new Map(); // socket.id -> roomCode

setInterval(() => roomManager.cleanupExpiredRooms(), 10_000);

function getRoomBySocket(socketId) {
  const code = socketRoom.get(socketId);
  if (!code) return null;
  const room = roomManager.getRoom(code);
  if (!room) return null;
  return { code, room };
}

io.on("connection", (socket) => {
  console.log("✅ conectado:", socket.id);
  socket.emit("session:welcome", { socketId: socket.id });

  // ---------- ROOM PREVIEW (para saber gameType antes de entrar) ----------
socket.on("room:preview", ({ roomCode } = {}, callback) => {
  try {
    // validação básica
    if (!roomCode || typeof roomCode !== "string") {
      return callback?.({ ok: false, error: "INVALID_ROOM_CODE" });
    }

    const room = roomManager.getRoom(roomCode.trim());
    if (!room) {
      return callback?.({ ok: false, error: "ROOM_NOT_FOUND" });
    }

    return callback?.({
      ok: true,
      gameType: room.gameType,
    });
  } catch (err) {
    console.error("room:preview error:", err);
    return callback?.({ ok: false, error: "SERVER_ERROR" });
  }
});

  // ---------- CREATE ROOM ----------
  socket.on("room:create", ({ gameType, name, team, clientId }) => {
    try {
      const room = roomManager.createRoom({
        gameType,
        hostSocketId: socket.id,
        hostName: name,
        hostTeam: team,
        hostClientId: clientId,
      });

      room.engine = createEngine(room.gameType, {
        io,
        roomCode: room.code,
        room,
      });

      socket.join(room.code);
      socketRoom.set(socket.id, room.code);

      socket.emit("room:created", {
        roomCode: room.code,
        room: roomManager.publicRoomState(room),
      });

      room.engine?.emitState?.();
    } catch (err) {
      console.error("🔥 room:create error:", err);
      socket.emit("room:error", { code: err.message || "CREATE_FAILED" });
    }
  });

  // ---------- JOIN ROOM ----------
  socket.on("room:join", ({ roomCode, name, team, clientId }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit("room:error", { code: "ROOM_NOT_FOUND" });
      return;
    }

    const result = roomManager.joinRoom({
      code: roomCode,
      socketId: socket.id,
      name,
      team,
      clientId,
    });

    if (!result.ok) {
      socket.emit("room:error", { code: result.error });
      return;
    }

    socket.join(roomCode);
    socketRoom.set(socket.id, roomCode);

    const player = result.room.players.get(socket.id);
    if (!result.resumed) result.room.engine?.onPlayerJoin?.(player);
    result.room.engine?.emitState?.();

    io.to(roomCode).emit("room:update", {
      roomCode,
      room: roomManager.publicRoomState(result.room),
    });

    if (result.resumed) {
      socket.emit("room:resumed", {
        roomCode,
        room: roomManager.publicRoomState(result.room),
      });
    }
  });

  // ---------- RESUME (auto-reconnect after disconnect) ----------
  // Emits a "room:resume:failed" (not room:error) on failure so the client
  // can silently fall back to a fresh room:join without wiping localStorage
  // or showing an alert. Successful resumes emit "room:resumed" + broadcast
  // "room:update" so every player sees the reattachment.
  socket.on("room:resume", ({ roomCode, clientId } = {}, callback) => {
    if (!roomCode || !clientId) {
      const err = { code: "RESUME_INVALID" };
      socket.emit("room:resume:failed", err);
      callback?.({ ok: false, ...err });
      return;
    }
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      const err = { code: "ROOM_NOT_FOUND" };
      socket.emit("room:resume:failed", err);
      callback?.({ ok: false, ...err });
      return;
    }
    let matched = null;
    for (const p of room.players.values()) {
      if (p.clientId === clientId) { matched = p; break; }
    }
    if (!matched) {
      const err = { code: "RESUME_NOT_FOUND" };
      socket.emit("room:resume:failed", err);
      callback?.({ ok: false, ...err });
      return;
    }
    const oldId = matched.id;
    roomManager._remapSocketId(room, oldId, socket.id);
    matched.connected = true;
    matched.disconnectedAt = null;
    socket.join(roomCode);
    socketRoom.set(socket.id, roomCode);

    room.engine?.emitState?.();
    io.to(roomCode).emit("room:update", {
      roomCode,
      room: roomManager.publicRoomState(room),
    });
    const payload = { roomCode, room: roomManager.publicRoomState(room) };
    socket.emit("room:resumed", payload);
    callback?.({ ok: true, ...payload });
  });

  // SET CATEGORY (host-only, lobby only)
  socket.on("game:setCategory", ({ category }) => {
    const ctx = getRoomBySocket(socket.id);
    if (!ctx) return;
    ctx.room.engine?.setCategory?.(socket.id, category);
  });

  // SET SETTINGS (host-only, lobby only)
  socket.on("game:setSettings", (settings) => {
    const ctx = getRoomBySocket(socket.id);
    if (!ctx) return;
    ctx.room.engine?.setSettings?.(socket.id, settings);
  });

  // ---------- GAME START ----------
  socket.on("game:start", () => {
    const ctx = getRoomBySocket(socket.id);
    if (!ctx) return;
    ctx.room.engine?.startGame(socket.id);
  });

  // ---------- GAME COMMAND ----------
  socket.on("game:command", (command) => {
    const ctx = getRoomBySocket(socket.id);
    if (!ctx) return;
    ctx.room.engine?.handleCommand(socket.id, command);
  });

  // ---------- GAME RESTART ----------
  socket.on("game:restart", () => {
    const ctx = getRoomBySocket(socket.id);
    if (!ctx) return;
    ctx.room.engine?.restartGame?.(socket.id);
  });

  // ---------- SWITCH GAME (same room, new engine) ----------
  socket.on("game:switch", ({ gameType }) => {
    const ctx = getRoomBySocket(socket.id);
    if (!ctx) return;
    const { code, room } = ctx;
    const player = room.players.get(socket.id);
    if (!player?.isHost) return;

    const valid = ["thirtySeconds", "whoIsWho", "sporcleMZ", "agenteSecreto"];
    if (!valid.includes(gameType)) return;

    room.engine?.destroy?.();
    room.gameType = gameType;
    room.status = "lobby";
    room.config.maxPlayers =
      gameType === "sporcleMZ"     ? 20 :
      gameType === "agenteSecreto" ? 20 : 8;
    room.closed = room.players.size >= room.config.maxPlayers;
    room.engine = createEngine(gameType, { io, roomCode: code, room });

    io.to(code).emit("room:gameChanged", { gameType });
    room.engine.emitState();
    io.to(code).emit("room:update", { roomCode: code, room: roomManager.publicRoomState(room) });
  });

  // ---------- LEAVE ROOM ----------
  socket.on("room:leave", () => {
    const ctx = getRoomBySocket(socket.id);
    if (!ctx) return;

    const { code, room } = ctx;
    const player = room.players.get(socket.id);

    roomManager.leaveRoom({ code, socketId: socket.id });
    socketRoom.delete(socket.id);
    socket.leave(code);

    room.engine?.onPlayerLeave?.(player);

    const updated = roomManager.getRoom(code);
    if (updated) {
      io.to(code).emit("room:update", {
        roomCode: code,
        room: roomManager.publicRoomState(updated),
      });
      updated.engine?.emitState?.();
    }
  });

  // ---------- DISCONNECT ----------
  // Graceful: keep the player in the room for GRACE_MS so a phone call, screen
  // lock or tab switch does NOT reset the game. If they don't reconnect within
  // the grace window, cleanupExpiredRooms will actually remove them.
  socket.on("disconnect", () => {
    const ctx = getRoomBySocket(socket.id);
    console.log("❌ desconectou:", socket.id);
    if (!ctx) return;

    const { code, room } = ctx;
    roomManager.markDisconnected({ code, socketId: socket.id });
    socketRoom.delete(socket.id);

    io.to(code).emit("room:update", {
      roomCode: code,
      room: roomManager.publicRoomState(room),
    });
  });
});

// Serve built client (only when dist exists — i.e. production)
const CLIENT_DIST = path.join(__dirname, "../../client/dist");
if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/.*/, (_, res) => res.sendFile(path.join(CLIENT_DIST, "index.html")));
} else {
  app.get(/.*/, (_, res) => res.status(503).send(
    "<!DOCTYPE html><html><head><title>MZ Party Games</title></head><body style='font-family:sans-serif;padding:40px;background:#1a1a2e;color:#fff'>" +
    "<h2>🎮 MZ Party Games</h2><p>Servidor online. A aguardar o build do cliente…</p></body></html>"
  ));
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 server rodando em http://localhost:${PORT}`);
});