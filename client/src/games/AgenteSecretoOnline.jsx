import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { CATEGORIAS, suggestedImpostorCount, maxImpostorCount } from "../../games/agenteSecretoDB.js";
import { playSound } from "../utils/sound";

const PHASE_LABEL = {
  lobby:  "Lobby",
  reveal: "A revelar carta",
  play:   "Discussão",
  vote:   "Votação",
  result: "Resultado",
};

const AVATAR_COLORS = [
  "#7c5dfa","#00D4B4","#f97316","#ef4444","#3b82f6",
  "#a855f7","#10b981","#f59e0b","#ec4899","#06b6d4",
  "#84cc16","#6366f1","#14b8a6","#fb923c","#f43f5e",
  "#8b5cf6","#22c55e","#eab308","#0ea5e9","#d946ef",
];
function colorFor(name = "") { return AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length]; }

function Avatar({ name, size = 30, dim }) {
  const c = colorFor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${c}${dim ? "18" : "22"}`, border: `2px solid ${c}${dim ? "33" : "55"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 900, color: c, flexShrink: 0,
      opacity: dim ? 0.5 : 1,
    }}>{(name || "?")[0].toUpperCase()}</div>
  );
}

function SectionHeader({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, paddingLeft: 2 }}>
      <div style={{
        fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "rgba(234,236,244,0.5)",
      }}>{children}</div>
      {right}
    </div>
  );
}

export default function AgenteSecretoOnline({ onBack, room, roomCode, gamePublic, gamePrivate }) {
  const me            = room?.players?.find(p => p.id === socket.id) || null;
  const isHost        = !!me?.isHost;
  const players       = gamePublic?.players ?? [];
  const playerCount   = players.filter(p => p.connected).length;
  const phase         = gamePublic?.phase ?? "lobby";
  const remaining     = Math.ceil((gamePublic?.remainingMs ?? 0) / 1000);
  const minPlayers    = gamePublic?.minPlayers ?? 3;
  const maxPlayers    = gamePublic?.maxPlayers ?? 20;
  const chat          = gamePublic?.chat ?? [];
  const result        = gamePublic?.result ?? null;

  const settings      = gamePublic?.settings ?? {
    impostorCount: 1,
    hintEnabled: true,
    categoriaIds: CATEGORIAS.map(c => c.id),
    duracaoMinutos: 3,
  };
  const suggestedK    = gamePublic?.impostorCountSuggested ?? suggestedImpostorCount(Math.max(playerCount, 3));
  const capK          = gamePublic?.impostorCountMax ?? maxImpostorCount(Math.max(playerCount, 3));
  const validDuracoes = gamePublic?.validDuracoes ?? [3, 5, 10];
  const categorias    = gamePublic?.categorias ?? CATEGORIAS;

  const card          = gamePrivate?.card ?? null;   // { role, word, hint }
  const myReady       = !!gamePrivate?.ready;
  const myVote        = gamePrivate?.myVote ?? null;
  const wasImpostor   = !!gamePrivate?.wasImpostor;

  const [chatDraft, setChatDraft] = useState("");
  const [shareFb, setShareFb]     = useState("");
  const [showRules, setShowRules] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const chatBoxRef = useRef(null);

  // Auto-scroll chat to newest.
  useEffect(() => {
    if (!chatBoxRef.current) return;
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chat.length]);

  // Play result sound based on outcome.
  useEffect(() => {
    const handle = (evt) => {
      if (evt?.type !== "RESULT") return;
      playSound(evt.winner === "group" ? "win" : "lose");
    };
    socket.on("game:event", handle);
    return () => socket.off("game:event", handle);
  }, []);

  // ── Actions ──────────────────────────────────────────
  const leaveToMenu = () => { socket.emit("room:leave"); onBack?.(); };
  const startGame   = () => socket.emit("game:start");
  const advance     = () => socket.emit("game:command", { type: "ADVANCE_PHASE" });
  const markReady   = () => socket.emit("game:command", { type: "READY" });
  const sendChat = () => {
    const t = chatDraft.trim();
    if (!t) return;
    socket.emit("game:command", { type: "SEND_CHAT", text: t });
    setChatDraft("");
  };
  const castVote = (target) => {
    if (!target || target === socket.id) return;
    socket.emit("game:command", { type: "VOTE", target });
  };
  const restart = () => socket.emit("game:restart");

  const updateSettings = (patch) => socket.emit("game:setSettings", patch);
  const changeImpostorK = (delta) => {
    const next = Math.max(1, Math.min(capK, (settings.impostorCount || 1) + delta));
    if (next !== settings.impostorCount) updateSettings({ impostorCount: next });
  };
  const toggleHint = () => updateSettings({ hintEnabled: !settings.hintEnabled });
  const setDuracao = (min) => updateSettings({ duracaoMinutos: min });
  const setCategorias = (ids) => updateSettings({ categoriaIds: ids });

  const handleShare = async () => {
    const url = `https://mz-party-games.onrender.com/?join=${roomCode}`;
    const text = `🕵️ Joga Agente Secreto comigo no MZ Party Games!\nEntra directo → ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "MZ Party Games", text, url }); setShareFb("Partilhado! ✓"); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setShareFb("Copiado! ✓"); } catch {}
    }
    setTimeout(() => setShareFb(""), 2500);
  };

  const catsSelectedLabel = (() => {
    const n = settings.categoriaIds?.length ?? 0;
    if (n === 0 || n === categorias.length) return "Todas";
    return `${n} seleccionada${n === 1 ? "" : "s"}`;
  })();

  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">🕵️ Agente Secreto</div>
            <div style={{ opacity: 0.6, marginTop: 2, fontSize: 11 }}>
              Sala: <b>{roomCode || "-"}</b> · {playerCount} jog. · {PHASE_LABEL[phase] || phase}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setShowRules(r => !r)} type="button"
              style={{ background: showRules ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${showRules ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.13)"}`, borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 16, cursor: "pointer" }}>❓</button>
            {(phase === "reveal" || phase === "play" || phase === "vote") && (
              <div className="timerPill">{remaining}s</div>
            )}
          </div>
        </header>

        <main className="gameMain">

          {showRules && <RulesPanel />}

          {phase === "lobby"  && (
            <LobbyView
              roomCode={roomCode}
              shareFb={shareFb}
              handleShare={handleShare}
              players={players}
              playerCount={playerCount}
              minPlayers={minPlayers}
              maxPlayers={maxPlayers}
              settings={settings}
              suggestedK={suggestedK}
              capK={capK}
              validDuracoes={validDuracoes}
              categorias={categorias}
              catsSelectedLabel={catsSelectedLabel}
              isHost={isHost}
              onChangeImpostorK={changeImpostorK}
              onToggleHint={toggleHint}
              onOpenCategories={() => setShowCategories(true)}
              onSetDuracao={setDuracao}
              onStart={startGame}
              lastResult={result || gamePublic?.result || null}
            />
          )}

          {phase === "reveal" && (
            <RevealView
              card={card}
              myReady={myReady}
              onReady={markReady}
              players={players}
              remaining={remaining}
            />
          )}

          {phase === "play" && (
            <PlayView
              card={card}
              chat={chat}
              chatBoxRef={chatBoxRef}
              chatDraft={chatDraft}
              setChatDraft={setChatDraft}
              onSendChat={sendChat}
              isHost={isHost}
              onAdvance={advance}
            />
          )}

          {phase === "vote" && (
            <VoteView
              players={players}
              myId={socket.id}
              myVote={myVote}
              onVote={castVote}
              chat={chat}
              chatBoxRef={chatBoxRef}
              chatDraft={chatDraft}
              setChatDraft={setChatDraft}
              onSendChat={sendChat}
            />
          )}

          {phase === "result" && (
            <ResultView
              result={result}
              players={players}
              isHost={isHost}
              onRestart={restart}
              wasImpostor={wasImpostor}
              chat={chat}
              chatBoxRef={chatBoxRef}
              chatDraft={chatDraft}
              setChatDraft={setChatDraft}
              onSendChat={sendChat}
            />
          )}
        </main>
      </div>

      {showCategories && (
        <CategoriesOverlay
          categorias={categorias}
          selectedIds={settings.categoriaIds}
          onChange={setCategorias}
          onClose={() => setShowCategories(false)}
          isHost={isHost}
        />
      )}
    </div>
  );
}

// ── LOBBY ────────────────────────────────────────────────
function LobbyView({
  roomCode, shareFb, handleShare, players, playerCount,
  minPlayers, maxPlayers, settings, suggestedK, capK, validDuracoes,
  categorias, catsSelectedLabel, isHost,
  onChangeImpostorK, onToggleHint, onOpenCategories, onSetDuracao,
  onStart, lastResult,
}) {
  const canStart = playerCount >= minPlayers && (settings.categoriaIds?.length ?? 0) > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 }}>

      {/* Share code */}
      <button className="lobbyCodeCard" onClick={handleShare} type="button">
        <div className="lobbyCodeLabel">{shareFb || "SHARE CODE"}</div>
        <div className="lobbyCodeRow">
          <div className="lobbyCodeValue">{(roomCode || "").match(/.{1,3}/g)?.join(" ")}</div>
          <div className="lobbyShareBtn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>Toca para partilhar</div>
      </button>

      {/* Players */}
      <div style={{
        background: "linear-gradient(160deg,#141628,#0e101c)",
        border: "1px solid rgba(124,93,250,0.28)",
        borderRadius: 18, padding: 16,
      }}>
        <SectionHeader>Jogadores · {playerCount}/{maxPlayers}</SectionHeader>
        <div style={{ display: "grid", gap: 8 }}>
          {players.map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "8px 10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, opacity: p.connected ? 1 : 0.55,
            }}>
              <Avatar name={p.name} dim={!p.connected} />
              <div style={{ flex: 1, fontWeight: 700 }}>
                {p.name}
                {p.id === socket.id && <span style={{ opacity: 0.45, fontWeight: 600 }}> (tu)</span>}
              </div>
              {!p.connected && <span style={{ fontSize: 11, opacity: 0.5 }}>offline</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={{
        background: "linear-gradient(160deg,#141628,#0e101c)",
        border: "1px solid rgba(124,93,250,0.28)",
        borderRadius: 18, padding: 16,
      }}>
        <SectionHeader>Definições da partida</SectionHeader>

        {/* Impostores */}
        <SettingRow
          label="🕵️ Impostores"
          hint={`Sugerido: ${suggestedK} · Máx: ${capK}`}
          disabled={!isHost}
        >
          <Stepper
            value={settings.impostorCount}
            min={1}
            max={capK}
            onChange={(delta) => onChangeImpostorK(delta)}
            disabled={!isHost}
          />
        </SettingRow>

        {/* Dica */}
        <SettingRow
          label="💡 Dica para o impostor"
          hint={settings.hintEnabled ? "Impostor vê pista curta ao levantar a carta." : "Impostor bluffa às cegas."}
          disabled={!isHost}
        >
          <Switch on={settings.hintEnabled} onChange={onToggleHint} disabled={!isHost} />
        </SettingRow>

        {/* Categorias */}
        <SettingRow
          label="🗂️ Categorias"
          hint={catsSelectedLabel}
          disabled={!isHost}
          onClick={isHost ? onOpenCategories : undefined}
        >
          <span style={{ fontSize: 20, opacity: 0.5 }}>›</span>
        </SettingRow>

        {/* Duração */}
        <SettingRow
          label="⏱️ Duração"
          hint={`${settings.duracaoMinutos} min de discussão`}
          disabled={!isHost}
          last
        >
          <div style={{ display: "flex", gap: 6 }}>
            {validDuracoes.map(m => {
              const sel = settings.duracaoMinutos === m;
              return (
                <button key={m} type="button" onClick={() => isHost && onSetDuracao(m)}
                  disabled={!isHost}
                  style={{
                    padding: "6px 12px", borderRadius: 999,
                    border: `1.5px solid ${sel ? "rgba(124,93,250,0.85)" : "rgba(255,255,255,0.14)"}`,
                    background: sel ? "rgba(124,93,250,0.25)" : "rgba(255,255,255,0.05)",
                    color: sel ? "#fff" : "rgba(234,236,244,0.7)",
                    fontSize: 12, fontWeight: 800, cursor: isHost ? "pointer" : "not-allowed",
                  }}>{m}min</button>
              );
            })}
          </div>
        </SettingRow>
      </div>

      {/* Last result summary */}
      {lastResult && (
        <div style={{
          background: lastResult.winner === "group" ? "rgba(0,212,180,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${lastResult.winner === "group" ? "rgba(0,212,180,0.4)" : "rgba(239,68,68,0.4)"}`,
          borderRadius: 14, padding: "10px 14px", fontSize: 13,
        }}>
          Última ronda: <b>{lastResult.winner === "group" ? "grupo ganhou 🏆" : "impostor escapou 🕵️"}</b>
          {lastResult.word ? <> · palavra era <b>{lastResult.word}</b></> : null}
        </div>
      )}

      {/* Start */}
      {isHost ? (
        <button type="button" className="btnPrimary"
          disabled={!canStart} onClick={onStart}>
          {playerCount < minPlayers
            ? `Aguarda mais ${minPlayers - playerCount} jogador…`
            : "▶ Começar"}
        </button>
      ) : (
        <div style={{ textAlign: "center", opacity: 0.65, padding: "10px 0", fontWeight: 700 }}>
          Aguardando o host iniciar…
        </div>
      )}
    </div>
  );
}

function SettingRow({ label, hint, children, disabled, last, onClick }) {
  const clickable = !!onClick && !disabled;
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        padding: "10px 6px",
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)",
        cursor: clickable ? "pointer" : "default",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, opacity: 0.55, marginTop: 2 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Stepper({ value, min, max, onChange, disabled }) {
  const canDown = !disabled && value > min;
  const canUp   = !disabled && value < max;
  const btnStyle = (enabled) => ({
    width: 30, height: 30, borderRadius: 999,
    background: enabled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${enabled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
    color: "#fff", fontSize: 18, fontWeight: 900,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: enabled ? "pointer" : "not-allowed",
    lineHeight: 1, padding: 0,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button type="button" style={btnStyle(canDown)} disabled={!canDown} onClick={() => onChange(-1)}>−</button>
      <div style={{ minWidth: 24, textAlign: "center", fontSize: 16, fontWeight: 900 }}>{value}</div>
      <button type="button" style={btnStyle(canUp)} disabled={!canUp} onClick={() => onChange(+1)}>+</button>
    </div>
  );
}

function Switch({ on, onChange, disabled }) {
  return (
    <span
      role="switch" aria-checked={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onChange(); }}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 999,
        background: on ? "linear-gradient(135deg,#00D4B4,#7c5dfa)" : "rgba(255,255,255,0.12)",
        border: `1px solid ${on ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)"}`,
        transition: "background 180ms ease", flexShrink: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "inline-block",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 22 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
        transition: "left 180ms ease",
      }} />
    </span>
  );
}

// ── REVEAL ───────────────────────────────────────────────
function RevealView({ card, myReady, onReady, players, remaining }) {
  const [lifted, setLifted] = useState(false);
  // Track if user has EVER lifted (to enable the "Pronto" button after first release).
  const [hasSeen, setHasSeen] = useState(false);

  const handleDown = () => setLifted(true);
  const handleUp   = () => { setLifted(false); if (!hasSeen) setHasSeen(true); };

  const readyCount = players.filter(p => p.ready).length;
  const totalCount = players.filter(p => p.connected).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "10px 0 24px" }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(234,236,244,0.55)" }}>
        Toca e segura para ver a tua carta
      </div>

      <LiftCard
        lifted={lifted}
        onDown={handleDown}
        onUp={handleUp}
        card={card}
        big
      />

      {/* Botão Pronto: só aparece depois de o user ter levantado ao menos 1× e soltado */}
      {hasSeen && !myReady && (
        <button type="button" onClick={onReady}
          style={{
            padding: "14px 28px", borderRadius: 999,
            background: "linear-gradient(135deg,#00D4B4,#7c5dfa)",
            border: "none", color: "#fff", fontWeight: 950, fontSize: 15,
            boxShadow: "0 8px 22px rgba(0,212,180,0.35)", cursor: "pointer",
          }}>
          ✓ Pronto, próximo →
        </button>
      )}

      {myReady && (
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          Pronto ✓ · A aguardar os outros ({readyCount}/{totalCount})
        </div>
      )}

      <div style={{ fontSize: 11, opacity: 0.5 }}>
        Se ninguém for pronto, avança em {remaining}s.
      </div>
    </div>
  );
}

// ── LIFT CARD ────────────────────────────────────────────
// Touch-and-hold reveals; release hides. Works on mouse + touch.
function LiftCard({ card, lifted, onDown, onUp, big, small }) {
  const width  = big ? "min(78vw, 340px)" : small ? 120 : 240;
  const height = big ? "min(52vw, 220px)" : small ? 76 : 150;
  const showBack = !lifted;

  const bg = lifted
    ? "linear-gradient(160deg,#151a30,#0d1120)"
    : "linear-gradient(160deg,#7c5dfa,#4a3dc8)";

  const border = lifted ? "rgba(124,93,250,0.55)" : "rgba(255,255,255,0.25)";

  const handleDown = (e) => { e.preventDefault(); onDown?.(); };
  const handleUp   = (e) => { e.preventDefault(); onUp?.(); };

  return (
    <div
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchEnd={handleUp}
      onTouchCancel={handleUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width, height,
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        userSelect: "none", WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        boxShadow: lifted ? "0 20px 40px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.35)",
        transform: lifted ? "translateY(-8px) rotate(-1deg)" : "translateY(0) rotate(0)",
        transition: "transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease",
        cursor: "pointer",
        padding: 16,
        textAlign: "center",
      }}
    >
      {showBack && (
        <div style={{ color: "#fff", opacity: 0.85 }}>
          <div style={{ fontSize: 42 }}>🎴</div>
          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6, letterSpacing: 1, textTransform: "uppercase" }}>
            Segura para ver
          </div>
        </div>
      )}
      {lifted && card && (
        <CardFront card={card} big={big} small={small} />
      )}
      {lifted && !card && (
        <div style={{ color: "#fff", opacity: 0.7, fontSize: 14 }}>—</div>
      )}
    </div>
  );
}

function CardFront({ card, big, small }) {
  const isImpostor = card.role === "impostor";
  if (isImpostor) {
    // Formato inspirado nas apps: título "Impostor" em vermelho + hint entre
    // aspas ("Dica: 'X'"). Uma só palavra evocativa em vez de categoria.
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: big ? 22 : small ? 13 : 18,
          fontWeight: 950, letterSpacing: 0.4,
          color: "#ef4444", marginBottom: 10, lineHeight: 1,
        }}>
          🕵️ IMPOSTOR
        </div>
        {card.hint ? (
          <>
            <div style={{ fontSize: big ? 13 : 11, fontWeight: 700, opacity: 0.7, color: "#fff", letterSpacing: 0.3, marginBottom: 4 }}>
              A tua dica:
            </div>
            <div style={{
              fontSize: big ? "clamp(28px, 7.5vw, 44px)" : small ? 16 : 24,
              fontWeight: 950, color: "#fff",
              letterSpacing: -0.3, lineHeight: 1.05,
            }}>
              "{card.hint}"
            </div>
          </>
        ) : (
          <div style={{ fontSize: big ? 14 : 12, opacity: 0.75, color: "#fff" }}>
            Boa sorte a bluffar.
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: big ? 13 : 11, fontWeight: 800, opacity: 0.6, color: "#fff", letterSpacing: 0.3, marginBottom: 6 }}>
        A tua palavra:
      </div>
      <div style={{
        fontSize: big ? "clamp(32px, 8.5vw, 52px)" : small ? 18 : 30,
        fontWeight: 950, color: "#fff",
        letterSpacing: -0.3, lineHeight: 1.05,
      }}>
        "{card.word}"
      </div>
    </div>
  );
}

// ── PLAY ─────────────────────────────────────────────────
function PlayView({ card, chat, chatBoxRef, chatDraft, setChatDraft, onSendChat, isHost, onAdvance }) {
  const [lifted, setLifted] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 }}>
      {/* Mini card — always visible; touch-and-hold to re-check */}
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
        <LiftCard
          card={card}
          lifted={lifted}
          onDown={() => setLifted(true)}
          onUp={() => setLifted(false)}
          small
        />
      </div>

      <div style={{ textAlign: "center", fontSize: 12, opacity: 0.55, marginTop: -4 }}>
        Segura a carta para reveres. Discutam abertamente.
      </div>

      <ChatBox
        chat={chat}
        chatBoxRef={chatBoxRef}
        draft={chatDraft}
        setDraft={setChatDraft}
        onSend={onSendChat}
      />

      {isHost && (
        <button type="button" onClick={onAdvance}
          style={{
            padding: "10px 14px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(234,236,244,0.75)",
            fontSize: 12, fontWeight: 800, cursor: "pointer",
          }}>
          ⏭ Ir para votação
        </button>
      )}
    </div>
  );
}

// ── VOTE ─────────────────────────────────────────────────
function VoteView({ players, myId, myVote, onVote, chat, chatBoxRef, chatDraft, setChatDraft, onSendChat }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 }}>
      <div style={{
        background: "linear-gradient(160deg,#141a30,#0d1120)",
        border: "1px solid rgba(124,93,250,0.32)",
        borderRadius: 16, padding: "12px 14px", textAlign: "center",
      }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.65 }}>
          Vota no impostor
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {players.filter(p => p.id !== myId).map(p => {
          const selected = myVote === p.id;
          return (
            <button key={p.id} type="button" onClick={() => onVote(p.id)}
              disabled={!p.connected}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: selected ? "linear-gradient(135deg,rgba(0,212,180,0.28),rgba(124,93,250,0.28))" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${selected ? "rgba(0,212,180,0.7)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12, cursor: p.connected ? "pointer" : "not-allowed",
                color: "#fff", textAlign: "left", opacity: p.connected ? 1 : 0.5,
              }}>
              <Avatar name={p.name} dim={!p.connected} />
              <div style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{p.name}</div>
              {p.voted && <span style={{ fontSize: 11, opacity: 0.5 }}>votou</span>}
              {selected && <span style={{ color: "#00D4B4", fontWeight: 900 }}>✓</span>}
            </button>
          );
        })}
      </div>

      <ChatBox
        chat={chat}
        chatBoxRef={chatBoxRef}
        draft={chatDraft}
        setDraft={setChatDraft}
        onSend={onSendChat}
        compact
      />
    </div>
  );
}

// ── RESULT ───────────────────────────────────────────────
function ResultView({ result, players, isHost, onRestart, wasImpostor, chat, chatBoxRef, chatDraft, setChatDraft, onSendChat }) {
  if (!result) return null;
  const groupWon  = result.winner === "group";
  const impostors = players.filter(p => result.impostorIds?.includes(p.id));
  const mostVoted = players.find(p => p.id === result.mostVoted);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 12 }}>
      <div style={{
        background: groupWon
          ? "linear-gradient(160deg,rgba(0,212,180,0.22),rgba(0,80,60,0.35))"
          : "linear-gradient(160deg,rgba(239,68,68,0.22),rgba(120,20,20,0.35))",
        border: `2px solid ${groupWon ? "rgba(0,212,180,0.55)" : "rgba(239,68,68,0.55)"}`,
        borderRadius: 20, padding: "18px 18px 16px",
        boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 40, lineHeight: 1 }}>{groupWon ? "🏆" : "🕵️"}</div>
          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>
            {groupWon ? "Grupo ganhou!" : "Impostor escapou!"}
          </div>
          {wasImpostor && (
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85, fontWeight: 800 }}>
              (Tu eras o impostor 🎭)
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <RowKV label="Palavra" value={result.word} />
          <RowKV
            label={impostors.length > 1 ? "Impostores" : "Impostor"}
            value={impostors.map(p => p.name).join(", ")}
            highlight
          />
          {mostVoted && (
            <RowKV
              label="Mais votado"
              value={`${mostVoted.name}${result.impostorIds?.includes(mostVoted.id) ? " ✅" : " ❌"}`}
            />
          )}
        </div>
      </div>

      {isHost ? (
        <button type="button" className="btnPrimary" onClick={onRestart}>
          🔄 Nova ronda
        </button>
      ) : (
        <div style={{ textAlign: "center", opacity: 0.6, fontSize: 13, padding: "10px 0" }}>
          Aguardando o host começar nova ronda…
        </div>
      )}

      <ChatBox
        chat={chat}
        chatBoxRef={chatBoxRef}
        draft={chatDraft}
        setDraft={setChatDraft}
        onSend={onSendChat}
        compact
      />
    </div>
  );
}

function RowKV({ label, value, highlight }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10,
      padding: "8px 12px",
      background: highlight ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.15)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.65 }}>{label}</div>
      <div style={{ fontWeight: 900, textAlign: "right", fontSize: 14 }}>{value || "—"}</div>
    </div>
  );
}

// ── CHAT ─────────────────────────────────────────────────
function ChatBox({ chat, chatBoxRef, draft, setDraft, onSend, compact }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14, padding: "10px 12px",
    }}>
      <SectionHeader>Chat da mesa</SectionHeader>
      <div ref={chatBoxRef} style={{
        maxHeight: compact ? 140 : 260, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 6, paddingRight: 4,
      }}>
        {chat.length === 0 && (
          <div style={{ opacity: 0.45, fontSize: 12, padding: "8px 4px" }}>
            Ainda sem mensagens. Discute quem é o impostor.
          </div>
        )}
        {chat.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Avatar name={m.name} size={20} />
            <div style={{ flex: 1, fontSize: 13, lineHeight: 1.35 }}>
              <b style={{ color: colorFor(m.name) }}>{m.name}:</b>{" "}
              <span style={{ opacity: 0.92 }}>{m.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
          maxLength={240}
          placeholder="Escreve…"
          style={{
            flex: 1, padding: "8px 10px", borderRadius: 10,
            background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.14)",
            color: "#fff", fontSize: 14, outline: "none",
          }}
        />
        <button type="button" onClick={onSend} disabled={!draft.trim()}
          style={{
            padding: "8px 14px", borderRadius: 10,
            background: draft.trim() ? "linear-gradient(135deg,#00D4B4,#7c5dfa)" : "rgba(255,255,255,0.06)",
            color: "#fff", fontWeight: 900, border: "none",
            cursor: draft.trim() ? "pointer" : "not-allowed",
            opacity: draft.trim() ? 1 : 0.55,
          }}>Enviar</button>
      </div>
    </div>
  );
}

// ── CATEGORIES OVERLAY ───────────────────────────────────
function CategoriesOverlay({ categorias, selectedIds, onChange, onClose, isHost }) {
  const [selected, setSelected] = useState(new Set(selectedIds || []));

  const toggle = (id) => {
    if (!isHost) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const save = () => {
    onChange(Array.from(selected));
    onClose();
  };
  const selectAll = () => setSelected(new Set(categorias.map(c => c.id)));
  const clearAll  = () => setSelected(new Set());

  return (
    <div className="teamOverlay" onClick={onClose}>
      <div className="teamCard" onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: 460 }}>
        <button
          type="button" onClick={onClose} aria-label="Fechar"
          style={{
            position: "absolute", top: 10, right: 10, width: 32, height: 32,
            borderRadius: 999, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(234,236,244,0.7)", fontSize: 16, fontWeight: 700,
            cursor: "pointer", padding: 0, lineHeight: 1,
          }}>✕</button>

        <div style={{ textAlign: "center" }}>
          <div className="teamTitle">🗂️ Categorias</div>
          <div style={{ fontSize: 13, opacity: 0.55, marginTop: 4 }}>
            Marca as categorias de onde saem as palavras.
          </div>
        </div>

        {isHost && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button type="button" onClick={selectAll}
              style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "rgba(234,236,244,0.75)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Todas
            </button>
            <button type="button" onClick={clearAll}
              style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "rgba(234,236,244,0.75)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Limpar
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {categorias.map(c => {
            const sel = selected.has(c.id);
            return (
              <button key={c.id} type="button" onClick={() => toggle(c.id)}
                disabled={!isHost}
                style={{
                  padding: "16px 12px", borderRadius: 16,
                  background: sel
                    ? "linear-gradient(135deg,rgba(0,212,180,0.28),rgba(124,93,250,0.28))"
                    : "rgba(255,255,255,0.05)",
                  border: `2px solid ${sel ? "rgba(0,212,180,0.7)" : "rgba(255,255,255,0.1)"}`,
                  color: "#fff",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  cursor: isHost ? "pointer" : "not-allowed",
                  opacity: isHost ? 1 : 0.7,
                }}>
                <div style={{ fontSize: 32 }}>{c.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 900, textAlign: "center" }}>{c.nome}</div>
                {sel && <div style={{ fontSize: 12, color: "#00D4B4" }}>✓ Seleccionada</div>}
              </button>
            );
          })}
        </div>

        {isHost && (
          <button type="button" className="btnPrimary"
            disabled={selected.size === 0}
            onClick={save}
            style={{ opacity: selected.size === 0 ? 0.5 : 1 }}>
            Guardar
          </button>
        )}
      </div>
    </div>
  );
}

function RulesPanel() {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>📖 Como jogar</div>
      {[
        "Todos vão receber uma carta virada para baixo. Segura para veres.",
        "A maioria vê uma palavra. O(s) impostor(es) vêem 'És o impostor' + uma dica curta.",
        "Depois de veres, clica 'Pronto'. Quando todos estiverem prontos, começa a discussão.",
        "Discutam abertamente e dêem dicas. Todos devem tentar identificar o impostor.",
        "Quando o tempo acabar (ou o host decidir), vão para votação.",
        "Se o mais votado for o impostor → grupo ganha. Se não → impostor escapa.",
      ].map((r, i) => (
        <div key={i} style={{ fontSize: 13, opacity: 0.85, marginBottom: 6, paddingLeft: 4 }}>
          <span style={{ opacity: 0.5, marginRight: 6 }}>{i + 1}.</span>{r}
        </div>
      ))}
    </div>
  );
}
