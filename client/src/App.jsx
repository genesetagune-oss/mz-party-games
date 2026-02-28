import { useEffect, useMemo, useState } from "react";
import { socket } from "./socket";

import ThirtySecondsOnline from "./games/ThirtySecondsOnline";
import XbolaOnline from "./games/XbolaOnline";
import WhoIsWhoOnline from "./games/WhoIsWhoOnline";

// ✅ OFFLINE (estão em client/games)
import ThirtySecondsOffline from "../games/ThirtySeconds.jsx";
import WhoIsWhoOffline from "../games/WhoIsWho.jsx";
import ImposterOffline from "../games/Imposter.jsx";
import XbolaOffline from "../games/Xbola.jsx";

import "./App.css";

const LS_NAME_KEY = "mzpg_name";
const LS_HIDE_ALERTS = "mzpg_hide_alerts";

export default function App() {
  const [connected, setConnected] = useState(socket.connected);

  const [room, setRoom] = useState(null);
  const [roomCode, setRoomCode] = useState("");

  const [name, setName] = useState(() => {
    const saved = localStorage.getItem(LS_NAME_KEY);
    return saved?.trim() ? saved.trim() : "Tony";
  });

  const [joinCode, setJoinCode] = useState("");

  // HOME | HOST | JOIN | OFFLINE_MENU | OFFLINE_GAME
  const [view, setView] = useState("HOME");

  // offline game selected: "30s" | "who" | "imposter" | "xbola"
  const [offlineGame, setOfflineGame] = useState(null);

  // overlay A/B (CREATE 30s e JOIN (30s/Who/…))
  const [showTeamOverlay, setShowTeamOverlay] = useState(false);
  const [overlayMode, setOverlayMode] = useState("CREATE");
  const [pendingJoinCode, setPendingJoinCode] = useState("");

  const [gamePublic, setGamePublic] = useState(null);
  const [gamePrivate, setGamePrivate] = useState(null);

  // ✅ aviso interno (substitui alert)
  const [notice, setNotice] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const hideAlerts = useMemo(() => localStorage.getItem(LS_HIDE_ALERTS) === "1", []);

  const showNotice = (title, message) => {
    if (localStorage.getItem(LS_HIDE_ALERTS) === "1") return;
    setDontShowAgain(false);
    setNotice({ title, message });
  };

  const closeNotice = () => {
    if (dontShowAgain) localStorage.setItem(LS_HIDE_ALERTS, "1");
    setNotice(null);
  };

  useEffect(() => {
    localStorage.setItem(LS_NAME_KEY, name.trim() || "Player");
  }, [name]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("room:created", ({ roomCode, room }) => {
      setRoomCode(roomCode);
      setRoom(room);
      setGamePublic(null);
      setGamePrivate(null);
    });

    socket.on("room:update", ({ room }) => setRoom(room));

    // ✅ sem alert()
    socket.on("room:error", (e) => {
      showNotice("Erro", `${e.code}${e.message ? " - " + e.message : ""}`);
    });

    socket.on("game:state", (s) => {
      setGamePublic(s.public);
      setGamePrivate(s.private);
    });

    // ✅ sem alert()
    socket.on("game:error", (e) => {
      showNotice("Game error", `${e.code}${e.message ? " - " + e.message : ""}`);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);

      socket.off("room:created");
      socket.off("room:update");
      socket.off("room:error");
      socket.off("game:state");
      socket.off("game:error");
    };
  }, []);

  const leaveRoom = (emit = true) => {
    if (emit) socket.emit("room:leave");
    setRoom(null);
    setRoomCode("");
    setGamePublic(null);
    setGamePrivate(null);
  };

  // =========================
  // CREATE ROOMS (ONLINE)
  // =========================
  const create30sRoom = () => {
    if (!connected) return showNotice("Servidor", "Servidor desconectado.");
    setOverlayMode("CREATE");
    setPendingJoinCode("");
    setShowTeamOverlay(true);
  };

  // ✅ X-BOLA: criar sempre com team A
  const createXBolaRoom = () => {
    if (!connected) return showNotice("Servidor", "Servidor desconectado.");
    const playerName = name.trim() || "Player";
    socket.emit("room:create", { gameType: "xbola", name: playerName, team: "A" });
  };

  // ✅ Quem sou eu? (host como A)
  const createWhoIsWhoRoom = () => {
    if (!connected) return showNotice("Servidor", "Servidor desconectado.");
    const playerName = name.trim() || "Player";
    socket.emit("room:create", { gameType: "whoIsWho", name: playerName, team: "A" });
  };

  // =========================
  // JOIN ROOM
  // =========================
  const joinRoom = () => {
    if (!connected) return showNotice("Servidor", "Servidor desconectado.");

    const code = joinCode.toUpperCase().trim();
    if (!code) return showNotice("Join", "Escreve o código da sala.");

    const playerName = name.trim() || "Player";

    socket.emit("room:preview", { roomCode: code }, (res) => {
      if (!res?.ok) {
        showNotice("Join", "Sala não encontrada.");
        return;
      }

      // ✅ X-Bola entra direto como B
      if (res.gameType === "xbola") {
        socket.emit("room:join", { roomCode: code, name: playerName, team: "B" });
        return;
      }

      // ✅ ThirtySeconds e WhoIsWho -> overlay A/B antes de entrar
      if (res.gameType === "thirtySeconds" || res.gameType === "whoIsWho") {
        setPendingJoinCode(code);
        setOverlayMode("JOIN");
        setShowTeamOverlay(true);
      }
    });
  };

  // =========================
  // OVERLAY A/B
  // =========================
  const cancelOverlay = () => {
    setShowTeamOverlay(false);
    setPendingJoinCode("");
  };

  const confirmTeam = (team) => {
    if (team !== "A" && team !== "B") return;

    const playerName = name.trim() || "Player";

    // CREATE (só 30s usa overlay no create)
    if (overlayMode === "CREATE") {
      socket.emit("room:create", {
        gameType: "thirtySeconds",
        name: playerName,
        team,
      });
    }

    // JOIN (30s e WhoIsWho)
    if (overlayMode === "JOIN") {
      socket.emit("room:join", {
        roomCode: pendingJoinCode,
        name: playerName,
        team,
      });
    }

    setShowTeamOverlay(false);
    setPendingJoinCode("");
  };

  // =========================
  // PREMIUM UI HELPERS
  // =========================
  const backToHome = () => setView("HOME");

  const Card = ({ icon, title, sub, onClick, rightText = "Jogar" }) => (
    <button
      onClick={onClick}
      type="button"
      style={{
        width: "100%",
        textAlign: "left",
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.25)",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 900, display: "flex", gap: 10, alignItems: "center" }}>
          <span>{icon}</span> <span>{title}</span>
        </div>
        <div style={{ opacity: 0.75, fontSize: 13 }}>{sub}</div>
      </div>

      <div
        style={{
          padding: "10px 16px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "linear-gradient(90deg, rgba(140,90,255,0.35), rgba(0,210,255,0.25))",
          fontWeight: 900,
        }}
      >
        {rightText}
      </div>
    </button>
  );

  // =========================
  // OFFLINE GAME RENDER
  // =========================
  if (view === "OFFLINE_GAME") {
    const goBackOfflineMenu = () => {
      setOfflineGame(null);
      setView("OFFLINE_MENU");
    };

    if (offlineGame === "30s") return <ThirtySecondsOffline onBack={goBackOfflineMenu} />;
    if (offlineGame === "who") return <WhoIsWhoOffline onBack={goBackOfflineMenu} />;
    if (offlineGame === "imposter") return <ImposterOffline onBack={goBackOfflineMenu} />;
    if (offlineGame === "xbola") return <XbolaOffline onBack={goBackOfflineMenu} />;

    // fallback
    return null;
  }

  // ✅ ONLINE: ThirtySeconds
  if (room && room.gameType === "thirtySeconds") {
    return (
      <ThirtySecondsOnline
        room={room}
        roomCode={roomCode}
        gamePublic={gamePublic}
        gamePrivate={gamePrivate}
        onBack={() => leaveRoom(false)}
      />
    );
  }

  // ✅ ONLINE: X-Bola
  if (room && room.gameType === "xbola") {
    return (
      <XbolaOnline
        room={room}
        roomCode={roomCode}
        gamePublic={gamePublic}
        gamePrivate={gamePrivate}
        onBack={() => leaveRoom(false)}
      />
    );
  }

  // ✅ ONLINE: Quem sou eu?
  if (room && room.gameType === "whoIsWho") {
    return (
      <WhoIsWhoOnline
        room={room}
        roomCode={roomCode}
        gamePublic={gamePublic}
        gamePrivate={gamePrivate}
        onBack={() => leaveRoom(false)}
      />
    );
  }

  // =========================
  // HOME MENU (premium)
  // =========================
  if (view === "HOME") {
    return (
      <div className="appBg">
        <div className="shell">
          <header className="topHero">
            <div>
              <div className="brandTitle">MZ Party Games</div>
              <div className="brandSub">Versão web • protótipo</div>
              <div style={{ marginTop: 8 }}>
                Status: {connected ? "🟢 conectado" : "🔴 desconectado"}
              </div>
            </div>
          </header>

          <section className="panel">
            {/* Nome */}
            <div
              style={{
                display: "grid",
                gap: 8,
                padding: 12,
                border: "1px solid #333",
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ opacity: 0.9, fontWeight: 700 }}>O teu nome</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Tony"
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #444",
                  background: "rgba(0,0,0,0.3)",
                  color: "white",
                  outline: "none",
                  fontSize: 16,
                }}
              />
              <div style={{ opacity: 0.65, fontSize: 12 }}>Fica guardado neste dispositivo.</div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <Card
                icon="🧑‍✈️"
                title="Host party"
                sub="Criar sala online e partilhar o código"
                onClick={() => setView("HOST")}
              />

              <Card
                icon="🔑"
                title="Join party"
                sub="Entrar numa sala com código"
                onClick={() => setView("JOIN")}
              />

              <Card
                icon="🎮"
                title="Jogar offline"
                sub="Jogar no mesmo dispositivo"
                onClick={() => setView("OFFLINE_MENU")}
              />

              <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>
                Dica: nos jogos o round muda sozinho quando o tempo acabar.
              </div>
            </div>
          </section>
        </div>

        {/* ✅ Notice overlay (substitui alert) */}
        {notice ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 10000,
            }}
            onClick={closeNotice}
          >
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: 16,
                border: "1px solid #333",
                background: "rgba(10,10,10,0.95)",
                padding: 16,
                display: "grid",
                gap: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>{notice.title}</div>
              <div style={{ opacity: 0.85, lineHeight: 1.35 }}>{notice.message}</div>

              <label style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.9 }}>
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                Não mostrar novamente
              </label>

              <button onClick={closeNotice} className="btnSoft" type="button">
                Fechar
              </button>
            </div>
          </div>
        ) : null}

        {/* Overlay A/B (mantido) */}
        {showTeamOverlay && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 9999,
            }}
            onClick={cancelOverlay}
          >
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: 16,
                border: "1px solid #333",
                background: "rgba(10,10,10,0.95)",
                padding: 16,
                display: "grid",
                gap: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 18, fontWeight: 800 }}>Escolhe a tua equipa</div>
              <div style={{ opacity: 0.8 }}>{overlayMode === "CREATE" ? "A criar sala…" : "A entrar na sala…"}</div>

              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={() => confirmTeam("A")} style={{ padding: 12, borderRadius: 12 }}>
                  🔵 Equipa A
                </button>
                <button onClick={() => confirmTeam("B")} style={{ padding: 12, borderRadius: 12 }}>
                  🔴 Equipa B
                </button>
              </div>

              <button onClick={cancelOverlay} style={{ opacity: 0.85 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // HOST MENU (premium)
  // =========================
  if (view === "HOST") {
    return (
      <div className="appBg">
        <div className="shell">
          <header className="topHero">
            <div>
              <div className="brandTitle">Host party</div>
              <div className="brandSub">Escolhe o jogo online</div>
              <div style={{ marginTop: 8 }}>
                Status: {connected ? "🟢 conectado" : "🔴 desconectado"}
              </div>
            </div>
          </header>

          <section className="panel">
            <div style={{ display: "grid", gap: 12 }}>
              <Card
                icon="⏱️"
                title="30 Segundos"
                sub="CulturaGeral_MZ ou Global • 30s"
                onClick={create30sRoom}
                rightText="Jogar"
              />

              <Card
                icon="⚽"
                title="X-Bola"
                sub="Online"
                onClick={createXBolaRoom}
                rightText="Jogar"
              />

              <Card
                icon="🎭"
                title="Quem Sou Eu?"
                sub="Adivinha com dicas • 90s"
                onClick={createWhoIsWhoRoom}
                rightText="Jogar"
              />

              <button onClick={backToHome} style={{ padding: 14, borderRadius: 14, opacity: 0.9 }} type="button">
                ← Voltar ao menu
              </button>
            </div>
          </section>
        </div>

        {/* Notice overlay */}
        {notice ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 10000,
            }}
            onClick={closeNotice}
          >
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: 16,
                border: "1px solid #333",
                background: "rgba(10,10,10,0.95)",
                padding: 16,
                display: "grid",
                gap: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>{notice.title}</div>
              <div style={{ opacity: 0.85, lineHeight: 1.35 }}>{notice.message}</div>

              <label style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.9 }}>
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                Não mostrar novamente
              </label>

              <button onClick={closeNotice} className="btnSoft" type="button">
                Fechar
              </button>
            </div>
          </div>
        ) : null}

        {/* overlay A/B */}
        {showTeamOverlay && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 9999,
            }}
            onClick={cancelOverlay}
          >
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: 16,
                border: "1px solid #333",
                background: "rgba(10,10,10,0.95)",
                padding: 16,
                display: "grid",
                gap: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 18, fontWeight: 800 }}>Escolhe a tua equipa (30s)</div>
              <div style={{ opacity: 0.8 }}>A criar sala…</div>

              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={() => confirmTeam("A")} style={{ padding: 12, borderRadius: 12 }}>
                  🔵 Equipa A
                </button>
                <button onClick={() => confirmTeam("B")} style={{ padding: 12, borderRadius: 12 }}>
                  🔴 Equipa B
                </button>
              </div>

              <button onClick={cancelOverlay} style={{ opacity: 0.85 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // JOIN MENU (premium)
  // =========================
  if (view === "JOIN") {
    return (
      <div className="appBg">
        <div className="shell">
          <header className="topHero">
            <div>
              <div className="brandTitle">Join party</div>
              <div className="brandSub">Cola o código e entra</div>
              <div style={{ marginTop: 8 }}>
                Status: {connected ? "🟢 conectado" : "🔴 desconectado"}
              </div>
            </div>
          </header>

          <section className="panel">
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ opacity: 0.9, fontWeight: 800 }}>Código da sala</div>

              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Ex: R3ABH2"
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  outline: "none",
                  fontSize: 16,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              />

              <button onClick={joinRoom} style={{ padding: 14, borderRadius: 14, fontWeight: 900 }} type="button">
                Entrar
              </button>

              <button onClick={backToHome} style={{ padding: 14, borderRadius: 14, opacity: 0.9 }} type="button">
                ← Voltar ao menu
              </button>

              <div style={{ opacity: 0.7, fontSize: 12 }}>O app abre automaticamente o jogo do host.</div>
            </div>
          </section>
        </div>

        {/* Notice overlay */}
        {notice ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 10000,
            }}
            onClick={closeNotice}
          >
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: 16,
                border: "1px solid #333",
                background: "rgba(10,10,10,0.95)",
                padding: 16,
                display: "grid",
                gap: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>{notice.title}</div>
              <div style={{ opacity: 0.85, lineHeight: 1.35 }}>{notice.message}</div>

              <label style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.9 }}>
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                Não mostrar novamente
              </label>

              <button onClick={closeNotice} className="btnSoft" type="button">
                Fechar
              </button>
            </div>
          </div>
        ) : null}

        {/* overlay A/B (join 30s e who) */}
        {showTeamOverlay && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 9999,
            }}
            onClick={cancelOverlay}
          >
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: 16,
                border: "1px solid #333",
                background: "rgba(10,10,10,0.95)",
                padding: 16,
                display: "grid",
                gap: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 18, fontWeight: 800 }}>Escolhe a tua equipa</div>
              <div style={{ opacity: 0.8 }}>A entrar na sala…</div>

              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={() => confirmTeam("A")} style={{ padding: 12, borderRadius: 12 }}>
                  🔵 Equipa A
                </button>
                <button onClick={() => confirmTeam("B")} style={{ padding: 12, borderRadius: 12 }}>
                  🔴 Equipa B
                </button>
              </div>

              <button onClick={cancelOverlay} style={{ opacity: 0.85 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // OFFLINE MENU (lista premium)
  // =========================
  if (view === "OFFLINE_MENU") {
    return (
      <div className="appBg">
        <div className="shell">
          <header className="topHero">
            <div>
              <div className="brandTitle">Jogos</div>
              <div className="brandSub">Modo offline • no mesmo dispositivo</div>
            </div>
          </header>

          <section className="panel">
            <div style={{ display: "grid", gap: 12 }}>
              <Card
                icon="⏱️"
                title="30 Segundos"
                sub="CulturaGeral_MZ ou Global • 30s"
                onClick={() => {
                  setOfflineGame("30s");
                  setView("OFFLINE_GAME");
                }}
              />

              <Card
                icon="🎭"
                title="Quem Sou Eu?"
                sub="Adivinha com dicas"
                onClick={() => {
                  setOfflineGame("who");
                  setView("OFFLINE_GAME");
                }}
              />

              <Card
                icon="🕵️"
                title="Quem Está a Mentir?"
                sub="Deduções • tensão • 5–10 min"
                onClick={() => {
                  setOfflineGame("imposter");
                  setView("OFFLINE_GAME");
                }}
              />

              <Card
                icon="⚽"
                title="X-Bola"
                sub="Offline"
                onClick={() => {
                  setOfflineGame("xbola");
                  setView("OFFLINE_GAME");
                }}
              />

              <button onClick={backToHome} style={{ padding: 14, borderRadius: 14, opacity: 0.9 }} type="button">
                ← Voltar ao menu
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return null;
}