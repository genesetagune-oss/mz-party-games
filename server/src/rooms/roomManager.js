// server/src/rooms/roomManager.js
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

// How long a disconnected player is kept in the room before being removed.
// Covers phone-calls, tab-switch, lock-screen — anything up to ~2 minutes.
export const GRACE_MS = 120_000;

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> room
  }

  createRoom({ gameType, hostSocketId, hostName = "Host", hostTeam, hostClientId }) {
    const code = nanoid();

    const team = hostTeam === "A" || hostTeam === "B" ? hostTeam : "A";

    const maxPlayers =
      gameType === "sporcleMZ"     ? 20 :
      gameType === "agenteSecreto" ? 20 : 8;

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
      clientId: hostClientId || hostSocketId,
      name: hostName,
      team,
      isHost: true,
      connected: true,
      disconnectedAt: null,
    });

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code);
  }

  joinRoom({ code, socketId, name = "Player", team, clientId }) {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };

    // Reconnect path: same clientId already in room (possibly disconnected).
    // Restore the slot instead of rejecting.
    if (clientId) {
      for (const p of room.players.values()) {
        if (p.clientId === clientId) {
          if (p.id !== socketId) this._remapSocketId(room, p.id, socketId);
          p.connected = true;
          p.disconnectedAt = null;
          if (name && name !== "Player") p.name = name;
          room.updatedAt = Date.now();
          return { ok: true, room, resumed: true };
        }
      }
    }

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
      clientId: clientId || socketId,
      name,
      team,
      isHost: false,
      connected: true,
      disconnectedAt: null,
    });

    // fecha quando encher
    if (room.config.closeWhenFull && room.players.size >= room.config.maxPlayers) {
      room.closed = true;
    }

    room.updatedAt = Date.now();
    return { ok: true, room };
  }

  // Re-keys a player from oldId → newId and asks the engine to migrate any
  // player-id references inside its state (scores, currentPlayerId, orders…).
  _remapSocketId(room, oldId, newId) {
    if (oldId === newId) return;
    const player = room.players.get(oldId);
    if (!player) return;
    room.players.delete(oldId);
    player.id = newId;
    room.players.set(newId, player);
    room.engine?.remapPlayerId?.(oldId, newId);
  }

  // Called on socket disconnect. Marks the player disconnected but keeps
  // them (and their game state) around for GRACE_MS so a phone call or tab
  // switch doesn't reset the game.
  markDisconnected({ code, socketId }) {
    const room = this.rooms.get(code);
    if (!room) return null;
    const player = room.players.get(socketId);
    if (!player) return null;
    player.connected = false;
    player.disconnectedAt = Date.now();
    room.updatedAt = Date.now();
    return player;
  }

  // Find a player in any room by their persistent clientId.
  findByClientId(clientId) {
    if (!clientId) return null;
    for (const [code, room] of this.rooms.entries()) {
      for (const p of room.players.values()) {
        if (p.clientId === clientId) return { code, room, player: p };
      }
    }
    return null;
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

    const allDisconnected = [...room.players.values()].every((p) => !p.connected);
    if (room.players.size === 0 || allDisconnected) {
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
      // Evict players whose grace window has expired.
      const evict = [];
      for (const [pid, p] of room.players.entries()) {
        if (!p.connected && p.disconnectedAt && now - p.disconnectedAt > GRACE_MS) {
          evict.push(pid);
        }
      }
      for (const pid of evict) this.leaveRoom({ code, socketId: pid });

      // Drop empty (or all-disconnected) rooms after their TTL.
      if (room.players.size === 0 && room.emptySince) {
        if (now - room.emptySince > room.config.emptyTtlMs) {
          room.engine?.destroy?.();
          this.rooms.delete(code);
        }
      }
    }
  }
}