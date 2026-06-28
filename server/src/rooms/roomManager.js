// server/src/rooms/roomManager.js
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> room
  }

  createRoom({ gameType, hostSocketId, hostName = "Host", hostTeam }) {
    const code = nanoid();

    const team = hostTeam === "A" || hostTeam === "B" ? hostTeam : "A";

    const maxPlayers = 8;

    const room = {
      code,
      gameType,
      status: "lobby",
      closed: false,

      createdAt: Date.now(),
      updatedAt: Date.now(),

      config: {
        maxPlayers,
        emptyTtlMs: 120000,
        closeWhenFull: true,
      },

      settings: {
        category: "GLOBAL",
      },

      players: new Map(),
      engine: null,
    };

    room.players.set(hostSocketId, {
      id: hostSocketId,
      name: hostName,
      team,
      isHost: true,
      connected: true,
    });

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code);
  }

  joinRoom({ code, socketId, name = "Player", team }) {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    if (room.closed) return { ok: false, error: "ROOM_CLOSED" };

    if (room.players.has(socketId)) return { ok: true, room };

    if (team !== "A" && team !== "B") {
      return { ok: false, error: "TEAM_INVALID" };
    }

    const count = room.players.size;

    // ✅ bloqueio real quando está cheio
    if (count >= room.config.maxPlayers) {
      // se tu quiseres NÃO fechar a sala para sempre, comenta a linha abaixo:
      room.closed = true;
      return { ok: false, error: "ROOM_FULL" };
    }

    room.players.set(socketId, {
      id: socketId,
      name,
      team,
      isHost: false,
      connected: true,
    });

    // fecha quando encher
    if (room.config.closeWhenFull && room.players.size >= room.config.maxPlayers) {
      room.closed = true;
    }

    room.updatedAt = Date.now();
    return { ok: true, room };
  }

  leaveRoom({ code, socketId }) {
    const room = this.rooms.get(code);
    if (!room) return;

    room.players.delete(socketId);
    room.updatedAt = Date.now();

    // se alguém saiu e já não está cheio, reabre (opcional mas recomendado)
    if (room.closed && room.players.size < room.config.maxPlayers) {
      room.closed = false;
    }

    // promove host se necessário
    const hostExists = [...room.players.values()].some((p) => p.isHost);
    if (!hostExists) {
      const first = room.players.values().next().value;
      if (first) first.isHost = true;
    }

    if (room.players.size === 0) {
      room.emptySince = Date.now();
    }
  }

  publicRoomState(room) {
    return {
      code: room.code,
      gameType: room.gameType,
      status: room.status,
      closed: room.closed,

      settings: room.settings ?? { category: "GLOBAL" },

      players: [...room.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        team: p.team ?? null,
        isHost: p.isHost,
        connected: p.connected,
      })),

      config: room.config,
      updatedAt: room.updatedAt,
    };
  }

  cleanupExpiredRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.size === 0 && room.emptySince) {
        if (now - room.emptySince > room.config.emptyTtlMs) {
          room.engine?.destroy?.();
          this.rooms.delete(code);
        }
      }
    }
  }
}