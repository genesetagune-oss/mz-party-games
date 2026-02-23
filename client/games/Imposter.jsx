// /games/Imposter.jsx
// MZ Party Games — "Quem Está a Mentir?" (offline pass-and-play)
// Usa apenas App.css global (sem Imposter.css)

import React, { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   SWIPE CARD (abre com swipe UP, fecha com swipe DOWN)
   - fechado: mostra NOME do jogador + instrução
   - aberto: mostra conteúdo secreto/ação
   - allowClose: se false, bloqueia swipe down (até confirmar ação)
========================================================= */
function SwipeCardSecret({
  closedTitle,
  closedSub = "Arrasta a carta para cima 👆",
  openHint = "Arrasta para baixo para fechar 👇",
  onOpened,
  onClosed,
  children,
  disabled = false,
  allowClose = true,
}) {
  const [open, setOpen] = useState(false);
  const startYRef = useRef(null);
  const draggingRef = useRef(false);

  const OPEN_THRESHOLD = 85;
  const CLOSE_THRESHOLD = 65;
  const DEADZONE = 6;

  function openNow() {
    if (open) return;
    setOpen(true);
    startYRef.current = null;
    draggingRef.current = false;
    onOpened?.();
  }

  function closeNow() {
    if (!open) return;
    if (!allowClose) return;
    setOpen(false);
    startYRef.current = null;
    draggingRef.current = false;
    onClosed?.();
  }

  function onStart(clientY) {
    if (disabled) return;
    startYRef.current = clientY;
    draggingRef.current = false;
  }

  function onMove(clientY, mode) {
    if (disabled) return;
    if (startYRef.current == null) return;

    const delta = startYRef.current - clientY; // + sobe / - desce

    if (!draggingRef.current) {
      if (Math.abs(delta) < DEADZONE) return;
      draggingRef.current = true;
    }

    if (mode === "open" && delta <= -CLOSE_THRESHOLD) closeNow();
    if (mode === "closed" && delta >= OPEN_THRESHOLD) openNow();
  }

  function onEnd() {
    startYRef.current = null;
    draggingRef.current = false;
  }

  // handlers para TOUCH
  function tStart(e) {
    if (!e.touches?.length) return;
    onStart(e.touches[0].clientY);
  }
  function tMove(e, mode) {
    if (!e.touches?.length) return;
    onMove(e.touches[0].clientY, mode);
  }
  function tEnd() {
    onEnd();
  }

  // handlers para MOUSE (desktop)
  function mDown(e) {
    onStart(e.clientY);
  }
  function mMove(e, mode) {
    if (!draggingRef.current && startYRef.current == null) return;
    onMove(e.clientY, mode);
  }
  function mUp() {
    onEnd();
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,.10)",
        background: "rgba(0,0,0,.22)",
        overflow: "hidden",
        animation: "fadeSlideIn 180ms ease-out",
      }}
    >
      {/* Conteúdo secreto */}
      <div
        onTouchStart={tStart}
        onTouchMove={(e) => tMove(e, "open")}
        onTouchEnd={tEnd}
        onMouseDown={mDown}
        onMouseMove={(e) => mMove(e, "open")}
        onMouseUp={mUp}
        onMouseLeave={mUp}
        style={{
          position: "absolute",
          inset: 0,
          padding: 14,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0px)" : "translateY(10px)",
          transition: "opacity 160ms ease, transform 160ms ease",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {children}

        {/* Handle */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 62,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0))",
            borderTop: "1px solid rgba(255,255,255,.06)",
            touchAction: "none",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.78, fontWeight: 850 }}>
            {allowClose ? openHint : "Confirma a tua ação para poderes fechar 👇"}
          </div>
        </div>
      </div>

      {/* Capa fechada */}
      {!open && (
        <div
          onTouchStart={tStart}
          onTouchMove={(e) => tMove(e, "closed")}
          onTouchEnd={tEnd}
          onMouseDown={mDown}
          onMouseMove={(e) => mMove(e, "closed")}
          onMouseUp={mUp}
          onMouseLeave={mUp}
          style={{
            position: "absolute",
            inset: 0,
            color: "rgba(233,236,246,.92)",
            background:
              "radial-gradient(1200px 700px at 20% 0%, rgba(123,92,255,.18), transparent 60%), radial-gradient(900px 600px at 80% 10%, rgba(0,255,170,.12), transparent 60%), rgba(0,0,0,.40)",
            display: "grid",
            placeItems: "center",
            touchAction: "none",
          }}
          aria-label="Arrastar para abrir"
        >
          <div
            style={{
              textAlign: "center",
              padding: "16px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(0,0,0,.28)",
              width: "min(520px, 88%)",
            }}
          >
            <div style={{ fontWeight: 950, letterSpacing: ".2px", fontSize: 18 }}>{closedTitle}</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8, fontWeight: 850 }}>{closedSub}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Helpers
========================================================= */
function randInt(max) {
  return Math.floor(Math.random() * max);
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
function roleLabel(role) {
  if (role === "IMPOSTOR") return "IMPOSTOR";
  if (role === "INVESTIGATOR") return "INVESTIGADOR";
  if (role === "DOCTOR") return "MÉDICO";
  return "CIVIL";
}

/* =========================================================
   Role logic
   - 4–6: 1 impostor
   - 7–10: 2 impostores
========================================================= */
function impostorCountFor(n) {
  return n >= 7 ? 2 : 1;
}

function assignRoles(players, enableDoctor) {
  const ids = shuffle(players.map((p) => p.id));
  const roles = {};
  const impCount = impostorCountFor(players.length);

  for (let i = 0; i < impCount; i++) roles[ids[i]] = "IMPOSTOR";
  roles[ids[impCount]] = "INVESTIGATOR";

  let idx = impCount + 1;
  if (enableDoctor) {
    roles[ids[idx]] = "DOCTOR";
    idx++;
  }

  for (; idx < ids.length; idx++) roles[ids[idx]] = "CIVILIAN";
  return roles;
}

function checkWin(aliveIds, roles) {
  let imp = 0;
  let civ = 0;

  for (const pid of aliveIds) {
    if (roles[pid] === "IMPOSTOR") imp++;
    else civ++;
  }

  if (imp === 0) return { winner: "GROUP" };
  if (imp >= civ) return { winner: "IMPOSTORS" };
  return { winner: null };
}

/* =========================================================
   Component
========================================================= */
export default function Imposter({ onBack }) {
  // screens: setup | night_pass | resolve | day | vote | result | gameover
  const [screen, setScreen] = useState("setup");

  // setup
  const [playerCount, setPlayerCount] = useState(6);
  const enableDoctor = true; // ✅ médico sempre presente
  const [namesOpen, setNamesOpen] = useState(false); // ✅ overlay dos nomes
  const [useNames, setUseNames] = useState(true);
  const [names, setNames] = useState(() => Array.from({ length: 10 }, (_, i) => `Jogador ${i + 1}`));

  // debate fixo 3 min
  const debateSeconds = 180;

  // game
  const [game, setGame] = useState(null);

  // day timer
  const [timeLeft, setTimeLeft] = useState(debateSeconds);

  // vote pick
  const [votePick, setVotePick] = useState(null);

  // Night local confirms per current player card
  const [nightConfirmed, setNightConfirmed] = useState(false);

  // Night: garantir que nunca avança 2x no mesmo jogador
  const nightAdvanceLockRef = useRef(false);

  const namesDraftRef = useRef([]);
const [namesDraftKey, setNamesDraftKey] = useState(0);

useEffect(() => {
  if (!namesOpen) return;

  // snapshot para edição (não-controlado)
  namesDraftRef.current = Array.from({ length: playerCount }, (_, i) => names[i] || "");
  // força re-mount dos inputs quando abre (para aplicar defaultValue)
  setNamesDraftKey((k) => k + 1);
}, [namesOpen, playerCount]); // names não precisa aqui de propósito
  function advanceNightPassOnce() {
    if (nightAdvanceLockRef.current) return;
    nightAdvanceLockRef.current = true;
    advanceNightPass();
  }

  useEffect(() => {
    if (screen !== "night_pass") return;
    nightAdvanceLockRef.current = false;
  }, [screen, game?.passIndex]);

  const rolePlan = useMemo(() => {
  if (playerCount < 4) return null;
  const imp = impostorCountFor(playerCount);
  const inv = 1;
  const doc = 1; // ✅ sempre presente
  const civ = playerCount - imp - inv - doc;
  return { imp, inv, doc, civ };
}, [playerCount]);

  function resetAll() {
    setGame(null);
    setVotePick(null);
    setTimeLeft(debateSeconds);
    setNightConfirmed(false);
    setScreen("setup");
  }

  function alivePlayers(g = game) {
    if (!g) return [];
    return g.players.filter((p) => g.aliveIds.includes(p.id));
  }

  // ✅ PARTE A/B: começa a noite com ordem aleatória (só vivos) + chooser baseado nessa ordem
  function beginNightPass() {
    setNightConfirmed(false);

    setGame((g) => {
      if (!g) return g;

      // ordem base segura deste round: só vivos, na ordem original dos players
      const baseAliveOrderIds = g.players
        .map((pp) => pp.id)
        .filter((id) => g.aliveIds.includes(id));

      // ordem aleatória da noite: só vivos
      const nightOrderIds = shuffle(baseAliveOrderIds);

      // impostores vivos
      const aliveImpostors = (g.impostorIds || []).filter((id) => g.aliveIds.includes(id));

      // chooser = primeiro impostor que aparece na ordem aleatória
      let chooserImpostorId = null;
      if (aliveImpostors.length === 1) {
        chooserImpostorId = aliveImpostors[0];
      } else if (aliveImpostors.length >= 2) {
        chooserImpostorId =
          nightOrderIds.find((id) => aliveImpostors.includes(id)) || aliveImpostors[0];
      }

      return {
        ...g,
        passIndex: 0,
        nightOrderIds,
        night: {
          chooserImpostorId,
          targetsByImpostor: {},
          targetId: null,
          saveId: null,
          investigateId: null,
          investigateResult: null,
          diedId: null,
          saved: false,
        },
      };
    });

    setScreen("night_pass");
  }

  function startNewGame() {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `p${i + 1}`,
      name: useNames ? (names[i]?.trim() || `Jogador ${i + 1}`) : `Jogador ${i + 1}`,
    }));

    const roles = assignRoles(players, true);
    const aliveIds = players.map((p) => p.id);

    const impostorIds = aliveIds.filter((id) => roles[id] === "IMPOSTOR");
    const doctorId = aliveIds.find((id) => roles[id] === "DOCTOR") || null;
    const investigatorId = aliveIds.find((id) => roles[id] === "INVESTIGATOR") || null;

    // ✅ PARTE A/B também na PRIMEIRA NOITE (para não começar sem nightOrder/chooser)
    const baseAliveOrderIds = aliveIds; // todos vivos no início
    const nightOrderIds = shuffle(baseAliveOrderIds);
    const chooserImpostorId =
      impostorIds.length === 1
        ? impostorIds[0]
        : nightOrderIds.find((id) => impostorIds.includes(id)) || impostorIds[0];

    setGame({
      round: 1,
      players,
      roles,
      aliveIds,
      impostorIds,
      doctorId,
      investigatorId,

      passIndex: 0,
      nightOrderIds,

      doctorSelfSaveUsed: false,

      night: {
        chooserImpostorId,
        targetsByImpostor: {},
        targetId: null,
        saveId: null,
        investigateId: null,
        investigateResult: null,
        diedId: null,
        saved: false,
      },

      last: {
        diedId: null,
        saved: false,
        accusedId: null,
        accusedRole: null,
      },
    });

    setVotePick(null);
    setTimeLeft(debateSeconds);
    setNightConfirmed(false);
    setScreen("night_pass");
  }

  // Avançar para o próximo jogador na noite
  function advanceNightPass() {
    setNightConfirmed(false);
    setGame((g) => {
      if (!g) return g;
      return { ...g, passIndex: g.passIndex + 1 };
    });
  }

  // Quando acabou a noite (todos do round passaram), vai resolver automaticamente
  useEffect(() => {
    if (screen !== "night_pass") return;
    if (!game) return;

    const baseAliveLen = game.players.filter((pp) => game.aliveIds.includes(pp.id)).length;

    const total =
      Array.isArray(game.nightOrderIds) && game.nightOrderIds.length === baseAliveLen
        ? game.nightOrderIds.length
        : baseAliveLen;

    if (game.passIndex >= total) {
      setScreen("resolve");
    }
  }, [screen, game?.passIndex, game?.nightOrderIds, game?.aliveIds, game?.players]);

  // Day timer
  useEffect(() => {
    if (screen !== "day") return;
    setTimeLeft(debateSeconds);

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setScreen("vote");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [screen]);

  // Resolve: calcula morte/salvo e vai para day
  useEffect(() => {
    if (screen !== "resolve") return;

    setGame((g) => {
      if (!g) return g;

      const target = g.night.targetId; // pode ser null
      const save = g.night.saveId;

      const saved = !!target && !!save && target === save;
      const diedId = target && !saved ? target : null;

      const nextAlive = diedId ? g.aliveIds.filter((id) => id !== diedId) : g.aliveIds;

      return {
        ...g,
        aliveIds: nextAlive,
        last: {
          ...g.last,
          diedId,
          saved,
          accusedId: null,
          accusedRole: null,
        },
        night: {
          ...g.night,
          diedId,
          saved,
        },
      };
    });

    setScreen("day");
  }, [screen]);

  // Wrapper
  function Wrapper({ children }) {
    return (
      <div className="appBg">
        <div className="shell" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    );
  }

  /* =========================================================
     SETUP
  ========================================================= */
  if (screen === "setup") {
    return (
      <Wrapper>
        <header className="topHero">
          <div className="brandLine">
            <div className="logoDot" />
            <div>
              <div className="brandTitle">Quem Está a Mentir?</div>
              <div className="brandSub">Modo Normal • rondas rápidas • debate 3 min</div>
            </div>
          </div>
        </header>

        <section className="panel" style={{ flex: "1 1 auto" }}>
          <div className="panelTitle">Setup</div>
        
        <div className="turnRow" style={{ padding: "0 2px" }}>
  <div className="turnText">Jogadores</div>
  <div className="dock2" style={{ width: 210 }}>
    <button
      className="btnGhost"
      type="button"
      onClick={() => setPlayerCount((n) => clamp(n - 1, 4, 10))}
    >
      −
    </button>
    <button
      className="btnGhost"
      type="button"
      onClick={() => setPlayerCount((n) => clamp(n + 1, 4, 10))}
    >
      +
    </button>
  </div>
</div>

<div className="footNote" style={{ marginTop: 6 }}>
  Total: <b>{playerCount}</b>
</div>
          <div className="turnRow" style={{ padding: "8px 2px 0" }}>
  <div className="turnText">Nomes</div>

  <div className="dock2" style={{ width: 240 }}>
    <button
      className="btnGhost"
      type="button"
      onClick={() => {
  setUseNames(true);
  setNames(namesDraftRef.current.slice(0, playerCount));
  setNamesOpen(true);
}}
      style={{ borderColor: "rgba(0,255,170,.28)" }}
    >
      Adicionar (opcional)
    </button>

    <button
      className="btnGhost"
      type="button"
      onClick={() => setUseNames(false)}
      style={!useNames ? { borderColor: "rgba(0,255,170,.28)" } : null}
    >
      Sem nomes
    </button>
  </div>
</div>
          <div className="footNote" style={{ marginTop: 6 }}>
            Total: <b>{playerCount}</b>
          </div>

          
          

          {!rolePlan ? (
            <div className="footNote">Mínimo 4 jogadores.</div>
          ) : (
            <div className="footNote">
              Papéis: <b>{rolePlan.imp} Impostor(es)</b> • <b>1 Investigador</b>
              {enableDoctor ? " • 1 Médico" : ""} • <b>{rolePlan.civ} Civis</b>
            </div>
          )}

          <div className="actionDock" style={{ marginTop: 12 }}>
            <button className="btnPrimary" type="button" onClick={startNewGame} disabled={!rolePlan}>
              Começar
            </button>
            <button className="btnGhost" type="button" onClick={onBack}>
              Voltar
            </button>
          </div>
          {namesOpen && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,.55)",
      display: "grid",
      placeItems: "center",
      padding: 14,
    }}
    onMouseDown={(e) => {
      // clicar fora fecha
      if (e.target === e.currentTarget) setNamesOpen(false);
    }}
    onTouchStart={(e) => {
      if (e.target === e.currentTarget) setNamesOpen(false);
    }}
  >
    <div
      style={{
        width: "min(560px, 96vw)",
        maxHeight: "85dvh",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(10,12,18,.92)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          background: "rgba(0,0,0,.20)",
        }}

      >
        <div>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Adicionar nomes (opcional)</div>
          <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 850 }}>
            Só esta lista faz scroll. Depois é só fechar.
          </div>
        </div>

        <button className="btnGhost" type="button" onClick={() => setNamesOpen(false)}>
          Fechar
        </button>
      </div>

      {/* Body scroll */}
      <div style={{ padding: 14, overflowY: "auto" }}>
  {Array.from({ length: playerCount }, (_, i) => (
    <input
      key={`name-${namesDraftKey}-${i}`}
      className="nameInput"
      defaultValue={namesDraftRef.current[i] || ""}
      onInput={(e) => {
        namesDraftRef.current[i] = e.currentTarget.value;
      }}
      placeholder={`Jogador ${i + 1}`}
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      inputMode="text"
    />
  ))}
</div>

      {/* Footer */}
      <div
        style={{
          padding: 14,
          borderTop: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          background: "rgba(0,0,0,.20)",
        }}
      >
        <button
          className="btnPrimary"
          type="button"
          onClick={() => {
            setUseNames(true);
            setNamesOpen(false);
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
)}
        </section>

        <footer className="footNote" style={{ marginTop: "auto" }}>
          Debate é sempre <b>3:00</b>. Impostores vencem se <b>Impostores ≥ Civis</b>.
        </footer>
      </Wrapper>
    );
  }

  if (!game) return null;

  /* =========================================================
     NIGHT_PASS
  ========================================================= */
  if (screen === "night_pass") {
    // ✅ ordem base segura (vivos) + fallback seguro
    const baseAliveOrderIds = game.players
      .map((pp) => pp.id)
      .filter((id) => game.aliveIds.includes(id));

    const order =
      Array.isArray(game.nightOrderIds) && game.nightOrderIds.length === baseAliveOrderIds.length
        ? game.nightOrderIds
        : baseAliveOrderIds;

    const currentId = order[game.passIndex];
    const p = game.players.find((pp) => pp.id === currentId);

    // Segurança visual enquanto troca
    if (!p) {
      return (
        <Wrapper>
          <div className="gameMain">
            <section className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontWeight: 900, opacity: 0.8 }}>A preparar…</div>
            </section>
          </div>
        </Wrapper>
      );
    }

    const role = game.roles[p.id];
    const alive = alivePlayers();
    const aliveIdsSet = new Set(game.aliveIds);

    const isAlive = aliveIdsSet.has(p.id);
    const aliveImpostorsCount = (game.impostorIds || []).filter((id) => game.aliveIds.includes(id)).length;

    const impostorAllies =
      role === "IMPOSTOR"
        ? game.players
            .filter((x) => x.id !== p.id && game.roles[x.id] === "IMPOSTOR")
            .map((x) => x.name)
        : [];

    // ✅ chooser depende do estado calculado no início da noite
    const isImpostorChooser = role === "IMPOSTOR" && isAlive && game.night?.chooserImpostorId === p.id;

    const mustConfirmAction =
      isAlive &&
      ((role === "IMPOSTOR" && isImpostorChooser) || role === "DOCTOR" || role === "INVESTIGATOR");

    // ✅ se já escolheu alvo/ação, deixa fechar
    const hasSelectedAction =
      isAlive &&
      ((role === "IMPOSTOR" && !!game.night?.targetId) ||
        (role === "DOCTOR" && !!game.night?.saveId) ||
        (role === "INVESTIGATOR" && !!game.night?.investigateId));

    const allowClose = !mustConfirmAction || nightConfirmed || hasSelectedAction;

    const deadBlock = !isAlive ? (
      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(0,0,0,.22)",
        }}
      >
        <div style={{ fontWeight: 950, fontSize: 16 }}>Estás fora desta partida.</div>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75, fontWeight: 850 }}>
          Fecha e passa ao próximo.
        </div>
      </div>
    ) : null;

    const RoleHeader = (
      <>
        <div style={{ fontWeight: 950, fontSize: 14, opacity: 0.9 }}>O teu papel</div>
        <div style={{ marginTop: 10, fontSize: 30, fontWeight: 950, letterSpacing: ".2px" }}>
          {roleLabel(role)}
        </div>
      </>
    );

    return (
      <Wrapper>
        <header className="gameHeader">
          <button className="btnGhost" onClick={resetAll} type="button">
            Sair
          </button>

          <div className="headerTitleBlock">
            <div className="h1Brand">Noite</div>
            <div className="h2Game">Passa o telemóvel</div>
          </div>

          <div className="timerPill">
            {game.passIndex + 1}/{order.length}
          </div>
        </header>

        <div className="gameMain">
          <section className="card" style={{ flex: "1 1 auto", minHeight: 0 }}>
            <div className="cardTop">
              <div className="cardTitle">{p.name}</div>
              <div className="cardHint">Revela em privado</div>
            </div>

            <div style={{ flex: "1 1 auto", minHeight: 0 }}>
              <SwipeCardSecret
                key={p.id}
                closedTitle={p.name}
                closedSub="Arrasta a carta para cima 👆"
                allowClose={allowClose}
                onOpened={() => setNightConfirmed(false)}
                onClosed={() => {
                  // Ao fechar: avança sempre
                  advanceNightPassOnce();
                }}
              >
                {RoleHeader}

                {role === "IMPOSTOR" && isAlive && (
                  <div style={{ marginTop: 14 }}>
                    {impostorAllies.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 900, opacity: 0.9 }}>Outros impostores</div>
                        <div style={{ marginTop: 6, fontWeight: 900, opacity: 0.85 }}>
                          {impostorAllies.join(" • ")}
                        </div>
                      </div>
                    )}

                    {isImpostorChooser ? (
                      <>
                        <div style={{ fontWeight: 900, opacity: 0.9, marginBottom: 8 }}>
                          Escolhe a vítima (o teu nome não aparece).
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          {alive
                            .filter((x) => x.id !== p.id)
                            .map((x) => (
                              <button
                                key={x.id}
                                type="button"
                                className="btnSoft"
                                style={game.night?.targetId === x.id ? { borderColor: "rgba(0,255,170,.30)" } : null}
                                onClick={() => {
                                  setGame((g) => ({
                                    ...g,
                                    night: { ...g.night, targetId: x.id },
                                  }));
                                  // chooser avança logo
                                  advanceNightPassOnce();
                                }}
                              >
                                {x.name}
                              </button>
                            ))}
                        </div>
                      </>
                    ) : aliveImpostorsCount >= 2 ? (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 12,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,.10)",
                          background: "rgba(0,0,0,.22)",
                        }}
                      >
                        <div style={{ fontWeight: 950 }}>Vítima escolhida</div>

                        <div style={{ marginTop: 6, fontWeight: 900, opacity: 0.85 }}>
                          {game.night?.targetId
                            ? game.players.find((pp) => pp.id === game.night.targetId)?.name || "—"
                            : "O outro impostor ainda não escolheu."}
                        </div>

                        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.72, fontWeight: 850 }}>
                          Faz swipe down para fechar e passar.
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {role === "DOCTOR" && isAlive && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 900, opacity: 0.9, marginBottom: 8 }}>
                      Escolhe quem queres proteger.
                    </div>

                    <div style={{ marginBottom: 10, fontSize: 12, opacity: 0.75, fontWeight: 850 }}>
                      Podes auto-salvar <b>1 vez</b> no jogo.
                      {game.doctorSelfSaveUsed ? " (Já usado.)" : ""}
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      {alive.map((x) => {
                        const isSelf = x.id === p.id;
                        const disabled = isSelf && game.doctorSelfSaveUsed;
                        const picked = game.night.saveId === x.id;

                        return (
                          <button
                            key={x.id}
                            type="button"
                            className="btnSoft"
                            disabled={disabled}
                            style={
                              picked
                                ? { borderColor: "rgba(0,255,170,.30)", opacity: disabled ? 0.5 : 1 }
                                : disabled
                                ? { opacity: 0.45 }
                                : null
                            }
                            onClick={() => {
                              if (disabled) return;

                              setGame((g) => {
                                const usedSelf = x.id === p.id;
                                return {
                                  ...g,
                                  night: { ...g.night, saveId: x.id },
                                  doctorSelfSaveUsed: g.doctorSelfSaveUsed || usedSelf,
                                };
                              });

                              advanceNightPassOnce();
                            }}
                          >
                            {x.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {role === "INVESTIGATOR" && isAlive && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 900, opacity: 0.9, marginBottom: 8 }}>
                      Escolhe alguém para investigar (o teu nome não aparece).
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      {alive
                        .filter((x) => x.id !== p.id)
                        .map((x) => {
                          return (
                            <button
                              key={x.id}
                              type="button"
                              className="btnSoft"
                              onClick={() => {
                                const result = game.roles[x.id] === "IMPOSTOR" ? "SUS" : "OK";

                                setGame((g) => ({
                                  ...g,
                                  night: {
                                    ...g.night,
                                    investigateId: x.id,
                                    investigateResult: result,
                                  },
                                }));

                                advanceNightPassOnce();
                              }}
                            >
                              {x.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {role === "CIVILIAN" && isAlive && (
                  <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75, fontWeight: 850 }}>
                    Fecha para bloquear. Passa ao próximo.
                  </div>
                )}

                {deadBlock}
              </SwipeCardSecret>
            </div>

            <div className="footNoteDock" style={{ marginTop: 10 }}>
              Regra: na mesma passagem, quem tem ação faz já. Depois fecha e passa.
            </div>
          </section>
        </div>
      </Wrapper>
    );
  }

  /* =========================================================
     RESOLVE
  ========================================================= */
  if (screen === "resolve") {
    const target = game.night.targetId ? game.players.find((x) => x.id === game.night.targetId) : null;
    const save = game.night.saveId ? game.players.find((x) => x.id === game.night.saveId) : null;

    return (
      <Wrapper>
        <header className="gameHeader">
          <div className="headerTitleBlock" style={{ gridColumn: "1 / -1" }}>
            <div className="h1Brand">A resolver…</div>
            <div className="h2Game">Coloca o telemóvel no centro</div>
          </div>
        </header>

        <div className="gameMain">
          <section className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Noite terminou</div>

            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75, fontWeight: 850 }}>
              (Isto resolve automaticamente. Ninguém precisa mexer.)
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,.10)",
                  background: "rgba(0,0,0,.22)",
                }}
              >
                <div style={{ fontWeight: 950, fontSize: 12, opacity: 0.75 }}>Alvo</div>
                <div style={{ marginTop: 4, fontWeight: 950 }}>{target ? target.name : "Ninguém"}</div>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,.10)",
                  background: "rgba(0,0,0,.22)",
                }}
              >
                <div style={{ fontWeight: 950, fontSize: 12, opacity: 0.75 }}>Protegido</div>
                <div style={{ marginTop: 4, fontWeight: 950 }}>{save ? save.name : "Ninguém"}</div>
              </div>
            </div>
          </section>
        </div>
      </Wrapper>
    );
  }

  /* =========================================================
     DAY
  ========================================================= */
  if (screen === "day") {
    const died = game.last.diedId ? game.players.find((p) => p.id === game.last.diedId) : null;

    return (
      <Wrapper>
        <header className="gameHeader">
          <button className="btnGhost" onClick={resetAll} type="button">
            Sair
          </button>
          <div className="headerTitleBlock">
            <div className="h1Brand">Dia</div>
            <div className="h2Game">Debate (3:00)</div>
          </div>
          <div className="timerPill">{formatTime(timeLeft)}</div>
        </header>

        <div className="gameMain">
          <section className="card" style={{ flex: "1 1 auto", minHeight: 0 }}>
            <div className="cardTop">
              <div className="cardTitle">Anúncio</div>
              <div className="cardHint">Telefone no centro</div>
            </div>

            <div style={{ padding: 12 }}>
              {died ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 950 }}>
                    <span style={{ opacity: 0.85 }}>Morreu: </span>
                    {died.name}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 22, fontWeight: 950 }}>
                  {game.last.saved ? "Ninguém morreu (foi salvo)." : "Ninguém morreu."}
                </div>
              )}

              <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75, fontWeight: 850 }}>
                Debate livre durante 3:00. “Votar agora” se quiserem encurtar.
              </div>

              <div className="actionDock" style={{ marginTop: 14 }}>
                <button className="btnPrimary" type="button" onClick={() => setScreen("vote")}>
                  Votar agora
                </button>
              </div>
            </div>
          </section>
        </div>
      </Wrapper>
    );
  }

  /* =========================================================
     VOTE
  ========================================================= */
  if (screen === "vote") {
    const alive = alivePlayers();

    return (
      <Wrapper>
        <header className="gameHeader">
          <button className="btnGhost" onClick={resetAll} type="button">
            Sair
          </button>
          <div className="headerTitleBlock">
            <div className="h1Brand">Votação</div>
            <div className="h2Game">Escolham 1 nome</div>
          </div>
          <div className="timerPill">{alive.length} vivos</div>
        </header>

        <div className="gameMain">
          <section className="card" style={{ flex: "1 1 auto", minHeight: 0 }}>
            <div className="cardTop">
              <div className="cardTitle">Lista</div>
              <div className="cardHint">1 voto</div>
            </div>

            <div style={{ padding: 12, display: "grid", gap: 10 }}>
              {alive.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="btnSoft"
                  style={votePick === p.id ? { borderColor: "rgba(0,255,170,.30)" } : null}
                  onClick={() => setVotePick(p.id)}
                >
                  {p.name}
                </button>
              ))}

              <button
                className="btnPrimary"
                type="button"
                disabled={!votePick}
                onClick={() => {
  const accusedId = votePick;
  const accusedRole = game.roles[accusedId];

  setGame((g) => ({
    ...g,
    // ✅ elimina SEMPRE o acusado (civil ou impostor ou médico ou investigador)
    aliveIds: g.aliveIds.filter((id) => id !== accusedId),
    last: {
      ...g.last,
      accusedId,
      accusedRole,
    },
  }));

  setVotePick(null);
  setScreen("result");
}}
              >
                Confirmar voto
              </button>
            </div>
          </section>
        </div>
      </Wrapper>
    );
  }

  /* =========================================================
     RESULT
  ========================================================= */
  if (screen === "result") {
    const accused = game.last.accusedId ? game.players.find((p) => p.id === game.last.accusedId) : null;
    const accusedRole = game.last.accusedRole;

    const win = checkWin(game.aliveIds, game.roles);

    return (
      <Wrapper>
        <header className="gameHeader">
          <button className="btnGhost" onClick={resetAll} type="button">
            Sair
          </button>
          <div className="headerTitleBlock">
            <div className="h1Brand">Resultado</div>
            <div className="h2Game">Revelação</div>
          </div>
          <div className="timerPill">Round {game.round}</div>
        </header>

        <div className="gameMain">
          <section className="card" style={{ flex: "1 1 auto", minHeight: 0 }}>
            <div className="cardTop">
              <div className="cardTitle">Voto</div>
              <div className="cardHint">Revela</div>
            </div>

            <div style={{ padding: 14 }}>
              {accused ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 950 }}>{accused.name}</div>
                  <div style={{ marginTop: 8, fontSize: 28, fontWeight: 950, letterSpacing: ".2px" }}>
                    {roleLabel(accusedRole)}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 13, opacity: 0.78, fontWeight: 850 }}>
                    {accusedRole === "IMPOSTOR" ? "Expulsaram um Impostor." : "Expulsaram um Civil."}
                  </div>
                </>
              ) : (
                <div style={{ fontWeight: 900, opacity: 0.8 }}>Sem acusado.</div>
              )}

              {win.winner ? (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,.10)",
                    background: "rgba(0,0,0,.22)",
                  }}
                >
                  <div style={{ fontWeight: 950, fontSize: 18 }}>
                    {win.winner === "GROUP" ? "Grupo venceu." : "Impostores venceram."}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75, fontWeight: 850 }}>
                    {win.winner === "GROUP"
                      ? "Todos os impostores foram eliminados."
                      : "Impostores ficaram em maioria (ou empate)."}
                  </div>

                  <div className="actionDock" style={{ marginTop: 12 }}>
                    <button className="btnPrimary" type="button" onClick={() => setScreen("gameover")}>
                      Ver fim
                    </button>
                  </div>
                </div>
              ) : (
                <div className="actionDock" style={{ marginTop: 14 }}>
                  <button
                    className="btnPrimary"
                    type="button"
                    onClick={() => {
                      setVotePick(null);
                      setGame((g) => ({ ...g, round: g.round + 1 }));
                      beginNightPass();
                    }}
                  >
                    Próximo round
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </Wrapper>
    );
  }

  /* =========================================================
     GAMEOVER
  ========================================================= */
  if (screen === "gameover") {
    const win = checkWin(game.aliveIds, game.roles);

    return (
      <Wrapper>
        <header className="topHero">
          <div className="brandLine">
            <div className="logoDot" />
            <div>
              <div className="brandTitle">Fim do jogo</div>
              <div className="brandSub">{win.winner === "GROUP" ? "Grupo venceu" : "Impostores venceram"}</div>
            </div>
          </div>
        </header>

        <section className="panel" style={{ flex: "1 1 auto" }}>
          <div className="panelTitle">Reiniciar</div>

          <div className="actionDock">
            <button className="btnPrimary" type="button" onClick={startNewGame}>
              Nova partida
            </button>
            <button className="btnGhost" type="button" onClick={resetAll}>
              Voltar ao setup
            </button>
            <button className="btnGhost" type="button" onClick={onBack}>
              Menu
            </button>
          </div>
        </section>
      </Wrapper>
    );
  }

  return null;
}