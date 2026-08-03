import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIAS as CATEGORIAS_WHO } from "../games/quemSouEuDB.js";
import { socket, clientId } from "./socket";
import { playSound, setMuted } from "./utils/sound";
import { track, trackAppOpened } from "./analytics";

import ThirtySecondsOnline from "./games/ThirtySecondsOnline";
import WhoIsWhoOnline      from "./games/WhoIsWhoOnline";

import ThirtySecondsOffline from "../games/ThirtySeconds.jsx";
import WhoIsWhoOffline      from "../games/WhoIsWho.jsx";
import ImposterOffline      from "../games/Imposter.jsx";
import NuncaNuncaOffline    from "../games/NuncaNunca.jsx";
import FazOuBebeOffline     from "../games/FazOuBebe.jsx";
import SabeTudoOffline      from "../games/SabeTudo.jsx";
import SabeTudoOnline       from "./games/SabeTudoOnline.jsx";
import SporcleMZOffline     from "../games/SporcleMZ.jsx";
import SporcleMZOnline      from "./games/SporcleMZOnline.jsx";
import AgenteSecretoOnline  from "./games/AgenteSecretoOnline.jsx";

import "./App.css";

// ─── Storage keys ─────────────────────────────────────────
const LS_NAME        = "mzpg_name";
const LS_NAME_OK     = "mzpg_name_ok";   // set when user explicitly confirms a name
const LS_HIDE_ALERTS = "mzpg_hide_alerts";
const LS_ROOM_CODE   = "mzpg_room_code";
const LS_ROOM_GAME   = "mzpg_room_game";
const LS_ROOM_TEAM   = "mzpg_room_team";
const LS_RULES_SEEN  = (gt) => `mzpg_rules_seen_${gt}`;

// ─── Game meta ────────────────────────────────────────────
const GAME_META = {
  thirtySeconds: {
    icon: "⏱️", name: "30 Segundos", color: "#7c5dfa", minPlayers: 2,
    rules: [
      "Divide os jogadores em 2 equipas: A e B.",
      "O explicador vê 5 palavras e tem 30 segundos para as explicar sem dizer a palavra.",
      "Cada palavra certa vale 1 ponto. Podes trocar a carta 2x por turno.",
      "Passa a vez à equipa adversária quando o tempo acabar.",
      "Primeira equipa a chegar ao objetivo vence! 🏆",
    ],
  },
  whoIsWho: {
    icon: "🎭", name: "Quem Sou Eu?", color: "#4a9eff", minPlayers: 2,
    // Rules differ between contexts because the offline mode uses a single
    // phone on the forehead, while online each player has their own screen.
    rules: {
      offline: [
        "Cada jogador fica com o telemóvel na testa (ecrã virado para fora).",
        "Os outros fazem perguntas de SIM/NÃO para adivinhar.",
        "O jogador da vez confirma: ✅ Acertou ou ⏭ Passar.",
        "Cada acerto vale 1 ponto. Tempo automático consoante nº de jogadores.",
        "Primeiro a chegar a 10 pontos vence! 🏆",
      ],
      online: [
        "Cada jogador tem o seu telemóvel — quem está a jogar NÃO vê a palavra.",
        "Os outros vêem a palavra e respondem SIM/NÃO às perguntas do adivinho.",
        "Quando alguém acertar, um dos outros carrega ✅ Acertou no telemóvel dele.",
        "Cada acerto vale 1 ponto. A vez roda entre jogadores.",
        "Primeiro a chegar a 10 pontos vence! 🏆",
      ],
    },
  },
  sporcleMZ: {
    icon: "🧩", name: "Sporcle MZ", color: "#7c5dfa", minPlayers: 2,
    rules: [
      "São 5 perguntas de cultura moçambicana cronometradas.",
      "Perguntas de LISTA: acerta o maior número de respostas no tempo.",
      "Perguntas CURTAS: o mais rápido a acertar ganha mais pontos.",
      "Respostas 'quase certas' mostram uma dica — tenta de novo!",
      "Mais pontos no final vence! 🏆",
    ],
  },
  sabeTudo: {
    icon: "🧠", name: "Sabe Tudo?", color: "#f97316", minPlayers: 2,
    rules: [
      "5 perguntas de trivia sobre Moçambique.",
      "Todos respondem ao mesmo tempo no próprio telemóvel.",
      "Responde rápido — 1º correcto: 3 pts · 2º: 2 pts · resto: 1 pt.",
      "Tens 12 segundos por pergunta.",
      "Mais pontos no final vence! 🏆",
    ],
  },
  agenteSecreto: {
    icon: "🕵️", name: "Agente Secreto", color: "#00D4B4", minPlayers: 3,
    rules: [
      "Todos recebem a MESMA palavra — excepto o(s) impostor(es), que recebem outra parecida.",
      "O impostor NÃO sabe que é impostor.",
      "2 rondas de dicas: cada jogador dá 1 dica sobre a sua palavra (sem a dizer).",
      "Chat aberto para discutirem quem é o impostor.",
      "Votação: se apanharem o impostor, o grupo ganha. Empate → nova ronda de dicas.",
    ],
  },
};

// ─── Avatar ───────────────────────────────────────────────
const AVATAR_COLORS = ["#7c5dfa","#00e5b0","#4a9eff","#f97316","#ec4899","#22c55e","#eab308","#ef4444"];
function getAvatarColor(name = "") { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

function Avatar({ name, size = 36 }) {
  const color = getAvatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${color}22`, border: `2px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 900, color, flexShrink: 0,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

// ─── Share ────────────────────────────────────────────────
async function shareCode(code) {
  const url = `https://mz-party-games.onrender.com/?join=${code}`;
  const text = `🎮 Joga MZ Party Games comigo!\nEntra directo → ${url}`;
  if (navigator.share) {
    try { await navigator.share({ title: "MZ Party Games", text, url }); return "shared"; } catch {}
  }
  try { await navigator.clipboard.writeText(url); return "copied"; } catch {}
  window.prompt("Copia o link:", url);
  return "prompt";
}

// ─── Components ───────────────────────────────────────────
function NamePill({ name, setName }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const initial = name.trim()[0]?.toUpperCase() || "?";
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  const save = () => setEditing(false);
  return editing ? (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(0,212,180,0.15)",border:"1.5px solid rgba(0,212,180,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#00D4B4",flexShrink:0}}>{initial}</div>
      <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)} onBlur={save} onKeyDown={e=>e.key==="Enter"&&save()} placeholder="Ex: Tony" style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(0,212,180,0.35)",borderRadius:999,padding:"10px 14px",color:"#fff",fontSize:15,fontWeight:700,outline:"none"}} />
    </div>
  ) : (
    <div onClick={() => setEditing(true)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:999,marginBottom:14,cursor:"pointer"}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#fff",flexShrink:0}}>{initial}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{name||"Tony"}</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.30)"}}>Toca para alterar</div>
      </div>
      <span style={{fontSize:13,color:"rgba(255,255,255,0.30)"}}>✎</span>
    </div>
  );
}

// Shared nav bar for menu screens: subtle icon-only back on the left, title
// in the middle, optional status pill on the right. Replaces the old three-
// line ".topHero" (which repeated title / subtitle / status stacked).
function NavBar({ onBack, title, subtitle, rightHint, rightDotColor }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 8, marginBottom: 14, minHeight: 44,
    }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        style={{
          width: 40, height: 40, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", fontSize: 22, fontWeight: 800,
          cursor: "pointer", padding: 0, flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ←
      </button>
      <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
        <div style={{
          fontSize: 17, fontWeight: 800, letterSpacing: -0.1,
          color: "#fff", lineHeight: 1.1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontWeight: 600 }}>
            {subtitle}
          </div>
        )}
      </div>
      {rightHint ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 999,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${rightDotColor || "#00C9A7"}33`,
          fontSize: 10, fontWeight: 700, color: "rgba(234,236,244,0.75)",
          flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: rightDotColor || "#00C9A7", boxShadow: `0 0 6px ${rightDotColor || "#00C9A7"}` }} />
          {rightHint}
        </div>
      ) : (
        <div style={{ width: 40, flexShrink: 0 }} /> /* symmetric spacer so title stays centred */
      )}
    </header>
  );
}

// Card is the full tap target — no inner button, no coloured badge for
// generic "2+ jogadores" noise. Meta (players + game type) flows into the
// subtitle line so the visual weight stays on the game name itself.
function GameCard({ icon, title, sub, onClick, meta, isNew, color, comingSoon }) {
  const accent = color || "#7c5dfa";
  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      type="button"
      className="gameCard"
      disabled={comingSoon}
      style={comingSoon ? { opacity: 0.5, cursor: "default" } : undefined}
    >
      {isNew && !comingSoon && (
        <span style={{
          position: "absolute", top: 8, right: 10,
          fontSize: 9, fontWeight: 950, letterSpacing: ".12em",
          padding: "3px 8px", borderRadius: 999,
          background: "linear-gradient(135deg,#00D4B4,#7c5dfa)",
          color: "#fff", textTransform: "uppercase",
          boxShadow: "0 2px 8px rgba(0,212,180,0.35)",
        }}>NOVO</span>
      )}
      <div className="gameCardInfo">
        <div className="gameCardTitle">
          <span>{icon}</span><span>{title}</span>
        </div>
        <div className="gameCardSub">
          {comingSoon
            ? "Em breve…"
            : (meta ? `${sub} · ${meta}` : sub)}
        </div>
      </div>
      <div className="gameCardChev" aria-hidden="true" style={{
        color: comingSoon ? "rgba(234,236,244,0.35)" : accent,
        fontSize: 13, fontWeight: 900, flexShrink: 0, paddingRight: 2,
        letterSpacing: "0.02em",
        display: "flex", alignItems: "center", gap: 4,
        transition: "transform 160ms ease",
      }}>
        {comingSoon ? "Em breve" : (<>Jogar <span style={{ fontSize: 18, fontWeight: 800 }}>›</span></>)}
      </div>
    </button>
  );
}

// Global settings — Nome + Som. Fires the name-edit overlay for the name row
// (delegates to the existing NameOverlay) and toggles the shared mute state
// directly for sound. Dismissible on backdrop or ✕.
function GlobalSettingsOverlay({ name, soundOn, onEditName, onToggleSound, onClose }) {
  return (
    <div className="teamOverlay" onClick={onClose}>
      <div className="teamCard" onClick={e => e.stopPropagation()} style={{ position: "relative", gap: 14 }}>
        <button
          type="button" onClick={onClose} aria-label="Fechar"
          style={{
            position: "absolute", top: 10, right: 10,
            width: 32, height: 32, borderRadius: 999,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(234,236,244,0.7)", fontSize: 16, fontWeight: 700,
            cursor: "pointer", padding: 0, lineHeight: 1,
          }}
        >✕</button>
        <div style={{ textAlign: "center" }}>
          <div className="teamTitle">⚙️ Definições</div>
          <div style={{ fontSize: 13, opacity: .55, marginTop: 4 }}>Preferências gerais</div>
        </div>

        {/* Row: Nome */}
        <button type="button" onClick={onEditName}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, cursor: "pointer",
            color: "#fff", textAlign: "left",
          }}>
          <div style={{ fontSize: 22 }}>👤</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", opacity: 0.55 }}>Nome</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name || "—"}</div>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, fontWeight: 900 }}>›</span>
        </button>

        {/* Row: Som */}
        <label style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, cursor: "pointer",
          color: "#fff",
        }}>
          <div style={{ fontSize: 22 }}>{soundOn ? "🔊" : "🔇"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", opacity: 0.55 }}>Som</div>
            <div style={{ fontSize: 12.5, marginTop: 2, opacity: 0.7 }}>Chimes curtos ao acertar / vencer.</div>
          </div>
          <span
            role="switch" aria-checked={soundOn}
            onClick={(e) => { e.preventDefault(); onToggleSound(); }}
            style={{
              position: "relative", width: 44, height: 24, borderRadius: 999,
              background: soundOn ? "linear-gradient(135deg,#00D4B4,#7c5dfa)" : "rgba(255,255,255,0.12)",
              border: `1px solid ${soundOn ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)"}`,
              transition: "background 180ms ease", flexShrink: 0,
            }}
          >
            <span style={{
              position: "absolute", top: 2, left: soundOn ? 22 : 2,
              width: 18, height: 18, borderRadius: "50%",
              background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
              transition: "left 180ms ease",
            }} />
          </span>
        </label>
      </div>
    </div>
  );
}

function Notice({ title, message, dontShow, setDontShow, onClose }) {
  return (
    <div className="noticeOverlay" onClick={onClose}>
      <div className="noticeCard" onClick={e => e.stopPropagation()}>
        <div className="noticeTitle">{title}</div>
        <div className="noticeMsg">{message}</div>
        <label style={{ display:"flex", gap:10, alignItems:"center", opacity:.85, fontSize:13 }}>
          <input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)} />
          Não mostrar novamente
        </label>
        <button onClick={onClose} className="btnSoft" type="button">Fechar</button>
      </div>
    </div>
  );
}


function TeamOverlay({ mode, onConfirm, onCancel, initialName }) {
  const [draftName, setDraftName] = useState(initialName || "");
  const nameOk = draftName.trim().length >= 1;
  return (
    <div className="teamOverlay" onClick={onCancel}>
      <div className="teamCard" onClick={e => e.stopPropagation()}>
        <div>
          <div className="teamTitle">{mode === "CREATE" ? "Criar sala" : "Entrar na sala"}</div>
        </div>

        {/* Name field */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(234,236,244,.45)" }}>
            O teu nome
          </div>
          <input
            className="niceInput"
            value={draftName}
            onChange={e => setDraftName(e.target.value.slice(0, 20))}
            placeholder="Escreve o teu nome…"
            autoFocus
            autoComplete="off"
            maxLength={20}
            style={{ fontSize: 16, fontWeight: 700 }}
          />
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(234,236,244,.45)", textAlign: "center" }}>
          Escolhe a tua equipa
        </div>

        <div className="teamBtns">
          <button className="teamBtn teamA" type="button" disabled={!nameOk} onClick={() => onConfirm("A", draftName.trim())}
            style={{ opacity: nameOk ? 1 : 0.4 }}>
            <span style={{fontSize:20}}>🔵</span> Equipa A
          </button>
          <button className="teamBtn teamB" type="button" disabled={!nameOk} onClick={() => onConfirm("B", draftName.trim())}
            style={{ opacity: nameOk ? 1 : 0.4 }}>
            <span style={{fontSize:20}}>🔴</span> Equipa B
          </button>
        </div>
        <button type="button" onClick={onCancel}
          style={{background:"none",border:"none",color:"rgba(234,236,244,.45)",fontSize:13,cursor:"pointer",padding:0,textAlign:"center"}}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Three modes:
//  - "first-open" → blocking welcome overlay, no cancel / no click-outside
//  - "join"       → deep-link name prompt with game context (dismissible)
//  - "edit"       → change the saved name later (dismissible, pre-filled)
function NameOverlay({ mode = "join", gameType, initial = "", onConfirm, onCancel }) {
  const [draft, setDraft] = useState(initial);
  const ok = draft.trim().length >= 1;
  const meta = GAME_META[gameType] || {};
  const dismissible = mode !== "first-open";

  const title =
    mode === "first-open" ? "👋 Bem-vindo!" :
    mode === "edit"       ? "✎ O teu nome" :
    `${meta.icon || ""} ${meta.name || "Sala"}`;

  const subtitle =
    mode === "first-open" ? "Como te chamas? Vais aparecer com este nome nos jogos." :
    mode === "edit"       ? "Muda o nome que os outros jogadores vão ver." :
    "Escreve o teu nome para entrar";

  const confirmLabel =
    mode === "first-open" ? "Vamos jogar" :
    mode === "edit"       ? "Guardar" :
    "Entrar na sala";

  return (
    <div className="teamOverlay" onClick={dismissible ? onCancel : undefined}>
      <div className="teamCard" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center" }}>
          <div className="teamTitle">{title}</div>
          <div style={{ fontSize: 13, opacity: .55, marginTop: 4 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(234,236,244,.45)" }}>
            O teu nome
          </div>
          <input
            className="niceInput"
            value={draft}
            onChange={e => setDraft(e.target.value.slice(0, 20))}
            placeholder="Escreve o teu nome…"
            autoFocus autoComplete="off" maxLength={20}
            onKeyDown={e => e.key === "Enter" && ok && onConfirm(draft.trim())}
            style={{ fontSize: 16, fontWeight: 700 }}
          />
        </div>
        <button type="button" className="btnPrimary" disabled={!ok}
          onClick={() => onConfirm(draft.trim())} style={{ opacity: ok ? 1 : 0.4 }}>
          {confirmLabel}
        </button>
        {dismissible && (
          <button type="button" onClick={onCancel}
            style={{ background:"none", border:"none", color:"rgba(234,236,244,.45)", fontSize:13, cursor:"pointer", padding:0, textAlign:"center" }}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

function GameSwitchOverlay({ onSwitch, onCancel, currentGame }) {
  const games = [
    { key: "thirtySeconds",  icon: "⏱️", name: "30 Segundos" },
    { key: "whoIsWho",       icon: "🎭", name: "Quem Sou Eu?" },
    { key: "agenteSecreto",  icon: "🕵️", name: "Agente Secreto" },
    { key: "sporcleMZ",      icon: "🧩", name: "Sporcle MZ" },
  ].filter(g => g.key !== currentGame);
  return (
    <div className="noticeOverlay" onClick={onCancel}>
      <div className="noticeCard" onClick={e => e.stopPropagation()} style={{ gap: 10, maxWidth: 340 }}>
        <div className="noticeTitle">🎮 Mudar Jogo</div>
        <div className="noticeSub">Escolhe o próximo jogo para toda a sala</div>
        {games.map(g => (
          <button key={g.key} type="button" onClick={() => onSwitch(g.key)}
            style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:"13px 16px", color:"#eaeaf4", fontSize:15, fontWeight:700, cursor:"pointer", textAlign:"left" }}>
            {g.icon} {g.name}
          </button>
        ))}
        <button type="button" onClick={onCancel} style={{ background:"none", border:"none", color:"rgba(234,236,244,.4)", fontSize:13, cursor:"pointer", marginTop:4 }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function RulesModal({ gameType, context = "online", onClose, onPlay, primaryLabel }) {
  const meta = GAME_META[gameType];
  if (!meta) return null;
  // Rules can be an array (same for both contexts) or { online, offline }.
  const rulesList = Array.isArray(meta.rules)
    ? meta.rules
    : (meta.rules?.[context] || meta.rules?.online || []);
  return (
    <div className="noticeOverlay" onClick={onClose}>
      <div className="rulesCard" onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={{
            position: "absolute", top: 10, right: 10,
            width: 32, height: 32, borderRadius: 999,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(234,236,244,0.7)", fontSize: 16, fontWeight: 700,
            cursor: "pointer", padding: 0, lineHeight: 1,
          }}
        >
          ✕
        </button>
        <div className="rulesHeader">
          <span style={{fontSize:32}}>{meta.icon}</span>
          <div>
            <div className="rulesTitle">{meta.name}</div>
            <div className="rulesSub">Como jogar</div>
          </div>
        </div>
        <ol className="rulesList">
          {rulesList.map((r, i) => (
            <li key={i} className="rulesItem">
              <span className="rulesNum">{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
        {onPlay && (
          <button onClick={onPlay} className="btnPrimary" type="button" style={{ marginTop: 4 }}>
            {primaryLabel || "Vamos jogar"}
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <div className="appBg" style={{alignItems:"center", justifyContent:"center", display:"flex"}}>
      <div style={{textAlign:"center", display:"grid", gap:16}}>
        <div className="loadingSpinner" />
        <div style={{fontWeight:800, opacity:.70, fontSize:14}}>{message}</div>
      </div>
    </div>
  );
}

const CATS_30S = [
  { key: "GLOBAL", emoji: "🌍", label: "Global" },
  { key: "MZ",     emoji: "🇲🇿", label: "CulturaGeral MZ" },
];

// ✅ REFATORIZADO: LobbyScreen com botão START do host
function LobbyScreen({ room, roomCode, onLeave, gamePublic, onRules }) {
  const [shareFeedback, setShareFeedback] = useState("");
  const meta    = GAME_META[room?.gameType] || {};
  const players = room?.players || [];
  const isHost  = players.find(p => p.id === socket.id)?.isHost;
  const hasTeams = room?.gameType === "thirtySeconds";
  const teamA   = players.filter(p => p.team === "A");
  const teamB   = players.filter(p => p.team === "B");
  const currentCat = gamePublic?.category ?? "GLOBAL";

  const handleShare = async () => {
    const result = await shareCode(roomCode);
    if (result === "copied" || result === "shared") {
      setShareFeedback(result === "copied" ? "Copiado! ✓" : "Partilhado! ✓");
      setTimeout(() => setShareFeedback(""), 2500);
    }
  };

  const handleStartGame = () => {
    if (players.length < (meta.minPlayers || 2)) {
      alert(`Mínimo ${meta.minPlayers || 2} jogadores!`);
      return;
    }
    socket.emit("game:start");
  };

  return (
    <div className="appBg">
      <div className="shell">
        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:18}}>
          <button onClick={onLeave} className="btnGhost" type="button" style={{flexShrink:0, padding:"7px 14px", fontSize:13}}>
            ← Menu
          </button>
          <div style={{flex:1}}>
            <div style={{
              fontSize:18, fontWeight:950, letterSpacing:-.2,
              background:"var(--grad)", WebkitBackgroundClip:"text",
              WebkitTextFillColor:"transparent", backgroundClip:"text",
            }}>
              {meta.icon} {meta.name}
            </div>
            <div style={{fontSize:12, color:"var(--muted)", marginTop:1}}>
              {isHost ? "Tu és o host · partilha o código" : "Aguarda o host começar"}
            </div>
          </div>
          <button
            type="button"
            onClick={onRules}
            style={{
              width:34, height:34, borderRadius:"50%", flexShrink:0,
              border:"1.5px solid rgba(255,255,255,.18)",
              background:"rgba(255,255,255,.07)",
              color:"rgba(234,236,244,.65)",
              fontWeight:900, fontSize:16, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >?</button>
        </div>

        {/* CATEGORIAS — só host */}
        {isHost && (room?.gameType === "thirtySeconds" || room?.gameType === "whoIsWho") && (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:900,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(234,236,244,.38)",marginBottom:8}}>
              Categoria
            </div>
            {room.gameType === "thirtySeconds" ? (
              <div style={{position:"relative",display:"flex",background:"rgba(255,255,255,.08)",borderRadius:999,padding:3,border:"1px solid rgba(255,255,255,.1)"}}>
                <div style={{
                  position:"absolute", top:3,
                  left: currentCat === "GLOBAL" ? 3 : "calc(50%)",
                  width:"calc(50% - 3px)", height:"calc(100% - 6px)",
                  background:"#00C9A7", borderRadius:999,
                  transition:"left 200ms ease", zIndex:0, pointerEvents:"none",
                }} />
                {CATS_30S.map(({ key, emoji, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => socket.emit("game:setCategory", { category: key })}
                    style={{
                      flex:1, padding:"9px 14px", border:"none", background:"transparent",
                      fontWeight:800, fontSize:13, cursor:"pointer", borderRadius:999,
                      color: currentCat === key ? "#fff" : "rgba(234,236,244,.40)",
                      transition:"color 200ms ease", position:"relative", zIndex:1,
                      whiteSpace:"nowrap",
                    }}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="catTilesRow">
                {CATEGORIAS_WHO.map(({ id, emoji, nome }) => (
                  <button
                    key={id}
                    type="button"
                    className={`catTile${currentCat === id ? " selected" : ""}`}
                    onClick={() => socket.emit("game:setCategory", { category: id })}
                  >
                    <span className="catTileEmoji">{emoji}</span>
                    <span>{nome}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}


        {/* CODE CARD */}
        <button className="lobbyCodeCard" onClick={handleShare} type="button">
          <div className="lobbyCodeLabel">{shareFeedback || "SHARE CODE"}</div>
          <div className="lobbyCodeRow">
            <div className="lobbyCodeValue">{roomCode.match(/.{1,3}/g)?.join(" ")}</div>
            <div className="lobbyShareBtn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
          </div>
          <div style={{fontSize:11, opacity:.50, marginTop:6}}>
            Toca para partilhar · WhatsApp, Instagram, SMS…
          </div>
        </button>

        {/* PLAYERS */}
        <div className="lobbyPlayersCard">
          <div className="lobbyPlayersHeader">
            <div className="lobbyPlayersTitle">Jogadores</div>
            <div className="lobbyPlayersCount">
              {players.length}
              <span style={{opacity:.45}}>/{meta.maxPlayers || "∞"}</span>
            </div>
          </div>

          {hasTeams ? (
            <div className="lobbyTeamsGrid">
              {[
                {label:"🔵 Equipa A", list:teamA, cls:"lobbyTeamA"},
                {label:"🔴 Equipa B", list:teamB, cls:"lobbyTeamB"},
              ].map(({label,list,cls}) => (
                <div key={label} className={`lobbyTeam ${cls}`}>
                  <div className="lobbyTeamLabel">{label}</div>
                  {list.length === 0
                    ? <div style={{fontSize:12,opacity:.40,padding:"8px 0"}}>Nenhum jogador</div>
                    : list.map(p => (
                      <div key={p.id} className="lobbyPlayer">
                        <Avatar name={p.name} size={30} />
                        <div style={{minWidth:0, flex:1}}>
                          <div className="lobbyPlayerName">{p.name}</div>
                          {p.isHost && <div className="lobbyHostBadge">HOST</div>}
                        </div>
                        <div className="lobbyPlayerReady">✓</div>
                      </div>
                    ))
                  }
                </div>
              ))}
            </div>
          ) : (
            <div style={{display:"grid", gap:8, padding:"4px 0"}}>
              {players.map(p => (
                <div key={p.id} className="lobbyPlayer">
                  <Avatar name={p.name} size={36} />
                  <div style={{flex:1, minWidth:0}}>
                    <div className="lobbyPlayerName">{p.name}</div>
                    {p.isHost && <div className="lobbyHostBadge">HOST</div>}
                  </div>
                  <div className="lobbyPlayerReady">✓</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ STATUS MESSAGE + START BUTTON */}
        <div style={{textAlign:"center", marginTop:12, marginBottom:8}}>
          <div style={{fontSize:13, color:"var(--muted)", fontWeight:700}}>
            {isHost
              ? players.length < (meta.minPlayers || 2)
                ? `Aguarda mais ${(meta.minPlayers||2) - players.length} jogador(es)…`
                : "✓ Todos prontos"
              : "Aguardando o host…"
            }
          </div>
        </div>

        {/* ✅ NOVO: Botão START do Host (só aparece se minPlayers alcançados) */}
        {isHost && players.length >= (meta.minPlayers || 2) && (
          <button
            onClick={handleStartGame}
            className="btnStartGame"
            type="button"
          >
            🎮 Começar Jogo
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────
export default function App() {
  const [connected,       setConnected]       = useState(socket.connected);
  const [room,            setRoom]            = useState(null);
  const [roomCode,        setRoomCode]        = useState("");
  const [loading,         setLoading]         = useState(null);
  const [inLobby,         setInLobby]         = useState(false);
  // Fallback is empty — the first-open overlay always runs before any UI that
  // would show a name, so the user picks one instead of playing as "Tony".
  const [name,            setName]            = useState(() => (localStorage.getItem(LS_NAME) || "").trim());
  const [joinCode,        setJoinCode]        = useState("");
  const [view,            setView]            = useState("HOME");
  const [offlineGame,     setOfflineGame]     = useState(null);
  const [showTeamOverlay, setShowTeamOverlay] = useState(false);
  const [overlayMode,     setOverlayMode]     = useState("CREATE");
  const [pendingJoinCode, setPendingJoinCode] = useState("");
  const [gamePublic,      setGamePublic]      = useState(null);
  const [gamePrivate,     setGamePrivate]     = useState(null);
  const [notice,          setNotice]          = useState(null);
  const [dontShowAgain,   setDontShowAgain]   = useState(false);
  const [rulesFor,        setRulesFor]        = useState(null);
  const [rulesCallback,   setRulesCallback]   = useState(null);
  const [rulesContext,    setRulesContext]    = useState("online"); // "online" | "offline"
  const [switchingGame,   setSwitchingGame]   = useState(false);
  const [guestWaiting,    setGuestWaiting]    = useState(false);

  const rejoinRef = useRef(false);
  const hasConnectedRef = useRef(false); // false = we've never connected in this tab
  const [showNameOverlay,  setShowNameOverlay]  = useState(false);
  const [nameOverlayJoin,  setNameOverlayJoin]  = useState(null); // { roomCode, gameType }
  // Blocking overlay on the very first open — initialise from storage so the
  // welcome shows on render 1 (no "Tony" flash before the effect runs).
  const [showFirstOpenName, setShowFirstOpenName] = useState(
    () => localStorage.getItem(LS_NAME_OK) !== "1"
  );
  const [showEditName, setShowEditName] = useState(false);
  // Global settings panel opened from HOME ⚙️.
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  // Sound preference lives here as the single source of truth. All games
  // just call playSound() and it respects the shared mute state.
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("mzpg_muted") !== "1");
  useEffect(() => {
    localStorage.setItem("mzpg_muted", soundOn ? "0" : "1");
    setMuted(!soundOn);
  }, [soundOn]);
  useEffect(() => { setMuted(!soundOn); }, []); // apply on first mount

  const roomJoinedRef   = useRef(false);
  const gameStartedRef  = useRef(false);
  const gameFinishedRef = useRef(false);
  const prevPhaseRef    = useRef(null);
  const gameTypeRef     = useRef(null);

  // Loading timeout — if server doesn't respond within 20s, clear loading
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setLoading(null);
      setNotice({ title: "Sem resposta", message: "O servidor demorou muito. Verifica a ligação e tenta de novo." });
    }, 20000);
    return () => clearTimeout(t);
  }, [loading]);

  // Persist + rejoin
  useEffect(() => {
    if (roomCode && room?.gameType) {
      localStorage.setItem(LS_ROOM_CODE, roomCode);
      localStorage.setItem(LS_ROOM_GAME, room.gameType);
    }
  }, [roomCode, room]);

  useEffect(() => {
    if (rejoinRef.current) return;
    rejoinRef.current = true;
    try { trackAppOpened(); } catch {}

    // ── Deep link: ?join=CODE ──────────────────────────
    const params = new URLSearchParams(window.location.search);
    const deepCode = params.get("join")?.toUpperCase().trim();
    if (deepCode) {
      // Limpa URL sem reload
      window.history.replaceState({}, "", window.location.pathname);
      const tryDeepJoin = () => {
        setLoading("A verificar sala…");
        socket.emit("room:preview", { roomCode: deepCode }, (res) => {
          if (!res?.ok) { setLoading(null); showNotice("Sala", "Sala não encontrada ou expirou."); return; }
          const gt = res.gameType;
          setLoading(null);
          const nameConfirmed = localStorage.getItem(LS_NAME_OK) === "1";
          const savedName = (localStorage.getItem(LS_NAME) || "").trim();
          // First time: ask for name before joining
          if (!nameConfirmed) {
            setNameOverlayJoin({ roomCode: deepCode, gameType: gt });
            setShowNameOverlay(true);
            return;
          }
          // Returning user: join directly
          if (gt !== "thirtySeconds") {
            setLoading("A entrar na sala…");
            socket.emit("room:join", { roomCode: deepCode, name: savedName || "Player", team: "A", clientId });
            return;
          }
          setPendingJoinCode(deepCode); setOverlayMode("JOIN"); setShowTeamOverlay(true);
        });
      };
      if (socket.connected) tryDeepJoin(); else socket.once("connect", tryDeepJoin);
      return;
    }

    // ── Rejoin sala anterior ───────────────────────────
    const savedCode = localStorage.getItem(LS_ROOM_CODE);
    if (!savedCode) return;
    const tryRejoin = () => {
      setLoading("A reconectar à sala…");
      socket.emit("room:preview", { roomCode: savedCode }, (res) => {
        if (res?.ok) {
          const n = (localStorage.getItem(LS_NAME) || "Player").trim();
          const t = localStorage.getItem(LS_ROOM_TEAM) || "A";
          socket.emit("room:join", { roomCode: savedCode, name: n, team: t, clientId });
        } else {
          localStorage.removeItem(LS_ROOM_CODE);
          localStorage.removeItem(LS_ROOM_GAME);
          localStorage.removeItem(LS_ROOM_TEAM);
          setLoading(null);
        }
      });
    };
    if (socket.connected) tryRejoin(); else socket.once("connect", tryRejoin);
  }, []);

  useEffect(() => { localStorage.setItem(LS_NAME, name.trim() || "Player"); }, [name]);

  const showNotice = useCallback((title, message) => {
    if (localStorage.getItem(LS_HIDE_ALERTS) === "1") return;
    setDontShowAgain(false);
    setNotice({ title, message });
  }, []);

  const closeNotice = () => { if (dontShowAgain) localStorage.setItem(LS_HIDE_ALERTS,"1"); setNotice(null); };

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      // Initial mount handles the very first connect (deep-link / restore).
      // Every subsequent connect is a reconnect — ask the server to reattach
      // us to whatever room we still remember, via the persistent clientId.
      if (!hasConnectedRef.current) { hasConnectedRef.current = true; return; }
      const savedCode = localStorage.getItem(LS_ROOM_CODE);
      if (!savedCode) return;
      socket.emit("room:resume", { roomCode: savedCode, clientId });
    };
    const onDisconnect = () => setConnected(false);
    socket.on("connect",    onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:resumed", ({ room, roomCode: rc }) => {
      setRoom(room); if (rc) setRoomCode(rc); setLoading(null);
      const me = room?.players?.find(p => p.id === socket.id);
      if (me?.team) localStorage.setItem(LS_ROOM_TEAM, me.team);
    });
    // Fallback: if the server can no longer match our slot (grace expired,
    // room disappeared), silently retry with a fresh room:join so we still
    // reappear as the same clientId. Never wipe localStorage here — a
    // transient failure should NOT force the user to reconnect manually.
    socket.on("room:resume:failed", () => {
      const savedCode = localStorage.getItem(LS_ROOM_CODE);
      if (!savedCode) return;
      const savedName = (localStorage.getItem(LS_NAME) || "Player").trim() || "Player";
      const savedTeam = localStorage.getItem(LS_ROOM_TEAM) || "A";
      socket.emit("room:join", { roomCode: savedCode, name: savedName, team: savedTeam, clientId });
    });
    socket.on("room:created", ({ roomCode, room }) => {
      setLoading(null); setRoomCode(roomCode); setRoom(room);
      setGamePublic(null); setGamePrivate(null); setInLobby(true);
      gameTypeRef.current = room.gameType;
      if (!roomJoinedRef.current) { roomJoinedRef.current = true; track("room_joined", room.gameType); }
    });
    const prevPlayerCountRef = { current: 0 };
    socket.on("room:update", ({ room, roomCode: rc }) => {
      const newCount = room?.players?.length ?? 0;
      if (newCount > prevPlayerCountRef.current) playSound("join");
      prevPlayerCountRef.current = newCount;
      setRoom(room); if (rc) setRoomCode(rc); setLoading(null);
      setGuestWaiting(false);
      const me = room?.players?.find(p => p.id === socket.id);
      if (me?.team) localStorage.setItem(LS_ROOM_TEAM, me.team);
      if (me && !roomJoinedRef.current) {
        roomJoinedRef.current = true;
        gameTypeRef.current = room.gameType;
        track("room_joined", room.gameType);
      }
    });
    socket.on("room:error",  (e) => {
      setLoading(null);
      showNotice("Erro", `${e.code}${e.message?" — "+e.message:""}`);
      localStorage.removeItem(LS_ROOM_CODE); localStorage.removeItem(LS_ROOM_GAME); localStorage.removeItem(LS_ROOM_TEAM);
    });
    socket.on("game:state", (s) => {
      setGamePublic(s.public); setGamePrivate(s.private);
      if (s.public?.phase) setInLobby(s.public.phase === "lobby");
      const phase = s.public?.phase;
      const prev  = prevPhaseRef.current;
      prevPhaseRef.current = phase;
      const gt = gameTypeRef.current;
      if (prev === "lobby" && phase && phase !== "lobby" && !gameStartedRef.current) {
        gameStartedRef.current = true; track("game_started", gt);
      }
      if (phase === "finished" && !gameFinishedRef.current) {
        gameFinishedRef.current = true; track("game_finished", gt);
      }
    });
    socket.on("game:error", (e) => { showNotice("Game error", `${e.code}${e.message?" — "+e.message:""}`); });
    socket.on("room:gameChanged", () => {
      setGuestWaiting(true);
      setGamePublic(null); setGamePrivate(null); setInLobby(true);
      gameStartedRef.current = false; gameFinishedRef.current = false; prevPhaseRef.current = null;
    });
    return () => {
      socket.off("connect",onConnect); socket.off("disconnect",onDisconnect);
      socket.off("room:created"); socket.off("room:update"); socket.off("room:error");
      socket.off("room:resumed"); socket.off("room:resume:failed");
      socket.off("game:state"); socket.off("game:error"); socket.off("room:gameChanged");
    };
  }, [showNotice]);

  const leaveRoom = (emit = true) => {
    if (emit) socket.emit("room:leave");
    setRoom(null); setRoomCode(""); setGamePublic(null); setGamePrivate(null); setInLobby(false);
    localStorage.removeItem(LS_ROOM_CODE); localStorage.removeItem(LS_ROOM_GAME); localStorage.removeItem(LS_ROOM_TEAM);
    roomJoinedRef.current = false; gameStartedRef.current = false; gameFinishedRef.current = false; prevPhaseRef.current = null;
  };

  // ✅ NOVO: Mostra regras só 1ª vez (localStorage)
  // context: "online" | "offline" — decides which rules list is shown when a
  // game has different flows (e.g. Quem Sou Eu: forehead offline vs per-phone
  // online). The seen-flag is keyed per context so seeing offline rules
  // doesn't skip the online explanation the first time and vice versa.
  const showRulesFor = (gameType, onConfirm, context = "online") => {
    const key = `${LS_RULES_SEEN(gameType)}_${context}`;
    const seen = localStorage.getItem(key);
    if (seen) { onConfirm(); return; }
    setRulesContext(context);
    setRulesFor(gameType);
    setRulesCallback(() => {
      localStorage.setItem(key, "true");
      onConfirm();
    });
  };

  const closeRules   = () => { setRulesFor(null); setRulesCallback(null); };
  const confirmRules = () => { closeRules(); rulesCallback?.(); };
  const openRulesOnly = (gameType, context = "online") => {
    setRulesContext(context);
    setRulesFor(gameType);
    setRulesCallback(null);
  };

  const create30sRoom = () => {
    if (!connected) return showNotice("Servidor","Desconectado.");
    showRulesFor("thirtySeconds", () => { localStorage.setItem(LS_NAME_OK, "1"); setLoading("A criar sala…"); socket.emit("room:create",{gameType:"thirtySeconds",name:name.trim()||"Player",team:"A",clientId}); });
  };
  const createWhoIsWhoRoom = () => {
    if (!connected) return showNotice("Servidor","Desconectado.");
    showRulesFor("whoIsWho", () => { localStorage.setItem(LS_NAME_OK, "1"); setLoading("A criar sala…"); socket.emit("room:create",{gameType:"whoIsWho",name:name.trim()||"Player",team:"A",clientId}); });
  };
  const createSabeTudoRoom = () => {
    if (!connected) return showNotice("Servidor","Desconectado.");
    showRulesFor("sabeTudo", () => { localStorage.setItem(LS_NAME_OK, "1"); setLoading("A criar sala…"); socket.emit("room:create",{gameType:"sabeTudo",name:name.trim()||"Player",team:"A",clientId}); });
  };
  const createSporcleMZRoom = () => {
    if (!connected) return showNotice("Servidor","Desconectado.");
    showRulesFor("sporcleMZ", () => { localStorage.setItem(LS_NAME_OK, "1"); setLoading("A criar sala…"); socket.emit("room:create",{gameType:"sporcleMZ",name:name.trim()||"Player",team:"A",clientId}); });
  };
  const createAgenteSecretoRoom = () => {
    if (!connected) return showNotice("Servidor","Desconectado.");
    showRulesFor("agenteSecreto", () => { localStorage.setItem(LS_NAME_OK, "1"); setLoading("A criar sala…"); socket.emit("room:create",{gameType:"agenteSecreto",name:name.trim()||"Player",team:"A",clientId}); });
  };

  const joinRoom = () => {
    if (!connected) return showNotice("Servidor","Desconectado.");
    const code = joinCode.replace(/\s+/g, "").toUpperCase();
    if (!code) return showNotice("Join","Escreve o código da sala.");
    const playerName = name.trim() || "Player";
    setLoading("A verificar sala…");
    socket.emit("room:preview", { roomCode: code }, (res) => {
      if (!res?.ok) { setLoading(null); showNotice("Join","Sala não encontrada."); return; }
      const gt = res.gameType;
      showRulesFor(gt, () => {
        if (gt !== "thirtySeconds") {
          localStorage.setItem(LS_NAME_OK, "1");
          socket.emit("room:join",{roomCode:code,name:playerName,team:"A",clientId});
          return;
        }
        setPendingJoinCode(code); setOverlayMode("JOIN"); setShowTeamOverlay(true);
      });
      setLoading(null);
    });
  };

  const cancelOverlay = () => { setShowTeamOverlay(false); setPendingJoinCode(""); };
  const confirmTeam = (team, draftName) => {
    if (team !== "A" && team !== "B") return;
    const playerName = (draftName || name).trim() || "Player";
    setName(playerName);
    localStorage.setItem(LS_NAME_OK, "1");
    if (overlayMode === "CREATE") { setLoading("A criar sala…"); socket.emit("room:create",{gameType:"thirtySeconds",name:playerName,team,clientId}); }
    if (overlayMode === "JOIN")   { setLoading("A entrar na sala…"); socket.emit("room:join",{roomCode:pendingJoinCode,name:playerName,team,clientId}); }
    setShowTeamOverlay(false); setPendingJoinCode("");
  };

  const confirmNameAndJoin = (draftName) => {
    const playerName = draftName.trim() || "Player";
    setName(playerName);
    localStorage.setItem(LS_NAME_OK, "1");
    setShowNameOverlay(false);
    const { roomCode: code, gameType: gt } = nameOverlayJoin;
    setNameOverlayJoin(null);
    if (gt !== "thirtySeconds") {
      setLoading("A entrar na sala…");
      socket.emit("room:join", { roomCode: code, name: playerName, team: "A", clientId });
    } else {
      setPendingJoinCode(code); setOverlayMode("JOIN"); setShowTeamOverlay(true);
    }
  };

  // ── Overlays ──────────────────────────────────────────────
  const handleSwitchGame = (gameType) => {
    socket.emit("game:switch", { gameType });
    setSwitchingGame(false);
    setGamePublic(null); setGamePrivate(null); setInLobby(true);
  };

  const Overlays = () => (
    <>
      {notice    && <Notice title={notice.title} message={notice.message} dontShow={dontShowAgain} setDontShow={setDontShowAgain} onClose={closeNotice} />}
      {/* First-open blocking welcome — takes precedence over other name UIs.
          A deep-link name prompt subsumes it (it already collects the name in
          its own overlay), so we hide first-open when the join overlay opens. */}
      {showFirstOpenName && !showNameOverlay && (
        <NameOverlay
          mode="first-open"
          initial={name}
          onConfirm={(n) => {
            setName(n);
            localStorage.setItem(LS_NAME, n);
            localStorage.setItem(LS_NAME_OK, "1");
            setShowFirstOpenName(false);
          }}
        />
      )}
      {showEditName && (
        <NameOverlay
          mode="edit"
          initial={name}
          onConfirm={(n) => {
            setName(n);
            localStorage.setItem(LS_NAME, n);
            localStorage.setItem(LS_NAME_OK, "1");
            setShowEditName(false);
          }}
          onCancel={() => setShowEditName(false)}
        />
      )}
      {showGlobalSettings && (
        <GlobalSettingsOverlay
          name={name}
          soundOn={soundOn}
          onEditName={() => { setShowGlobalSettings(false); setShowEditName(true); }}
          onToggleSound={() => setSoundOn(v => !v)}
          onClose={() => setShowGlobalSettings(false)}
        />
      )}
      {showNameOverlay && nameOverlayJoin && <NameOverlay mode="join" gameType={nameOverlayJoin.gameType} onConfirm={confirmNameAndJoin} onCancel={() => { setShowNameOverlay(false); setNameOverlayJoin(null); }} />}
      {showTeamOverlay && <TeamOverlay mode={overlayMode} onConfirm={confirmTeam} onCancel={cancelOverlay} initialName={name} />}
      {rulesFor  && <RulesModal gameType={rulesFor} context={rulesContext} onClose={closeRules} onPlay={rulesCallback ? confirmRules : null} primaryLabel={rulesContext === "offline" ? "Vamos jogar" : "Criar sala"} />}
{switchingGame && <GameSwitchOverlay onSwitch={handleSwitchGame} onCancel={() => setSwitchingGame(false)} currentGame={room?.gameType} />}
      {guestWaiting && (
        <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(7,9,15,0.92)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
          <div className="waitingHostDot" style={{ width:14, height:14 }} />
          <div style={{ fontWeight:800, color:"rgba(234,236,244,.65)", fontSize:15 }}>Host a mudar o jogo...</div>
        </div>
      )}
    </>
  );

  const SL = ({ children }) => (
    <div style={{fontSize:11,fontWeight:900,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(234,236,244,.38)",marginBottom:8,marginTop:4,paddingLeft:2}}>
      {children}
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────
  if (loading) return <LoadingScreen message={loading} />;

  if (view === "OFFLINE_GAME") {
    const back = () => { setOfflineGame(null); setView("OFFLINE_MENU"); };
    if (offlineGame === "30s")       return <ThirtySecondsOffline onBack={back} />;
    if (offlineGame === "who")       return <WhoIsWhoOffline      onBack={back} />;
    if (offlineGame === "imposter")  return <ImposterOffline      onBack={back} />;
    if (offlineGame === "nunca")     return <NuncaNuncaOffline    onBack={back} />;
    if (offlineGame === "fazbebe")   return <FazOuBebeOffline     onBack={back} />;
    if (offlineGame === "sabetudo")  return <SabeTudoOffline      onBack={back} />;
    if (offlineGame === "sporcle")   return <SporcleMZOffline     onBack={back} />;
    return null;
  }

  const onSwitchGame = () => setSwitchingGame(true);

  // these games handle their own lobby phase — must come before generic inLobby check
  if (room?.gameType === "sporcleMZ")     return <><SporcleMZOnline     room={room} roomCode={roomCode} gamePublic={gamePublic} gamePrivate={gamePrivate} onBack={() => leaveRoom(false)} onSwitchGame={onSwitchGame} /><Overlays /></>;
  if (room?.gameType === "whoIsWho")      return <><WhoIsWhoOnline      room={room} roomCode={roomCode} gamePublic={gamePublic} gamePrivate={gamePrivate} onBack={() => leaveRoom(false)} onSwitchGame={onSwitchGame} /><Overlays /></>;
  if (room?.gameType === "agenteSecreto") return <><AgenteSecretoOnline room={room} roomCode={roomCode} gamePublic={gamePublic} gamePrivate={gamePrivate} onBack={() => leaveRoom(false)} onSwitchGame={onSwitchGame} /><Overlays /></>;

  if (room && inLobby) return <><LobbyScreen room={room} roomCode={roomCode} onLeave={() => leaveRoom(true)} gamePublic={gamePublic} onRules={() => openRulesOnly(room.gameType)} /><Overlays /></>;

  if (room?.gameType === "thirtySeconds") return <><ThirtySecondsOnline room={room} roomCode={roomCode} gamePublic={gamePublic} gamePrivate={gamePrivate} onBack={() => leaveRoom(false)} onSwitchGame={onSwitchGame} /><Overlays /></>;
  if (room?.gameType === "sabeTudo")      return <><SabeTudoOnline      room={room} roomCode={roomCode} gamePublic={gamePublic} gamePrivate={gamePrivate} onBack={() => leaveRoom(false)} onSwitchGame={onSwitchGame} /><Overlays /></>;

  if (view === "HOME") {
    return (
      <div style={{
        width:"100%", minHeight:"100dvh",
        display:"flex", flexDirection:"column",
        background:"#07090F", overflow:"hidden", position:"relative",
      }}>
        {/* HERO */}
        <div style={{
          position:"relative", height:"52vh", minHeight:280,
          flexShrink:0, overflow:"hidden",
          background:"linear-gradient(160deg, #0D1B2E 0%, #0A1525 40%, #061018 100%)",
        }}>
          <div style={{ position:"absolute", width:280, height:280, borderRadius:"50%", background:"rgba(0,201,167,0.18)", filter:"blur(60px)", top:-60, left:-80, pointerEvents:"none" }} />
          <div style={{ position:"absolute", width:220, height:220, borderRadius:"50%", background:"rgba(74,100,255,0.14)", filter:"blur(60px)", top:20, right:-60, pointerEvents:"none" }} />
          <div style={{ position:"absolute", width:180, height:180, borderRadius:"50%", background:"rgba(0,201,167,0.10)", filter:"blur(60px)", bottom:-40, right:40, pointerEvents:"none" }} />

          {[
            { e:"🎮", s:{ top:"12%", left:"8%",  fontSize:36 } },
            { e:"⏱️", s:{ top:"8%",  right:"10%", fontSize:28 } },
            { e:"🎭", s:{ top:"40%", left:"5%",  fontSize:26, opacity:0.4 } },
            { e:"⚽", s:{ top:"18%", right:"8%", fontSize:42 } },
            { e:"🎉", s:{ bottom:"20%", left:"12%", fontSize:30, opacity:0.45 } },
            { e:"🏆", s:{ bottom:"12%", right:"14%", fontSize:28, opacity:0.4 } },
          ].map(({ e, s }, i) => (
            <div key={i} style={{ position:"absolute", pointerEvents:"none", animation:`floatMZ ${3.5 + i * 0.4}s ease-in-out infinite alternate`, ...s }}>{e}</div>
          ))}

          {/* Global settings — accessible from HOME only. Source of truth
              for Nome + Som. Games use these values via localStorage/setMuted. */}
          <button
            type="button"
            aria-label="Definições"
            onClick={() => setShowGlobalSettings(true)}
            style={{
              position:"absolute", top:14, left:14, zIndex:3,
              width:38, height:38, borderRadius:999,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(0,0,0,0.30)", border:"1px solid rgba(255,255,255,0.15)",
              color:"#fff", fontSize:16, cursor:"pointer", padding:0,
              backdropFilter:"blur(8px)",
            }}
          >⚙️</button>

          {/* Status: silent when connected. Only shows a red "sem ligação"
              pill when something's actually wrong worth reacting to. */}
          {!connected && (
            <div style={{ position:"absolute", top:16, right:16, display:"flex", alignItems:"center", gap:5, background:"rgba(0,0,0,0.30)", border:"1px solid rgba(194,81,81,0.35)", borderRadius:999, padding:"5px 10px 5px 8px", backdropFilter:"blur(8px)" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#c25151", boxShadow:"0 0 6px #c25151" }} />
              <span style={{ fontSize:10, fontWeight:700, color:"rgba(194,81,81,0.9)", letterSpacing:"0.04em" }}>sem ligação</span>
            </div>
          )}

          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:0, paddingTop:20 }}>
            <div style={{ fontWeight:800, letterSpacing:-1, lineHeight:0.95, textAlign:"center" }}>
              <span style={{ display:"block", fontSize:28, color:"rgba(255,255,255,0.85)", fontWeight:700, letterSpacing:0 }}>MZ Party</span>
              <span style={{ display:"block", fontSize:64, color:"#00C9A7", textShadow:"0 0 40px rgba(0,201,167,0.35)" }}>Games</span>
            </div>
            <div className="heroPill" onClick={() => setShowEditName(true)}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(0,201,167,0.15)", border:"1.5px solid rgba(0,201,167,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#00C9A7", flexShrink:0 }}>
                {(name || "?")[0].toUpperCase()}
              </div>
              <span style={{ fontSize:14, fontWeight:700 }}>
                {name === "Player" || !name ? "✎ Define o teu nome" : name}
              </span>
              {name && name !== "Player" && <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>✎</span>}
            </div>
          </div>
        </div>

        {/* BOTTOM SHEET */}
        <div style={{ flex:1, background:"#0B0F18", borderTopLeftRadius:28, borderTopRightRadius:28, marginTop:-28, padding:"24px 20px 40px", display:"flex", flexDirection:"column", gap:10, boxShadow:"0 -8px 40px rgba(0,0,0,0.4)", position:"relative", zIndex:2 }}>
          <SL>Online</SL>
          <GameCard icon="👑" title="Criar Sala"       sub="Cria e partilha o código com os amigos" onClick={() => setView("HOST")} />
          <GameCard icon="🔑" title="Entrar numa Sala" sub="Usa o código que te enviaram"            onClick={() => setView("JOIN")} />
          <SL>Offline</SL>
          <GameCard icon="🎮" title="Jogar offline" sub="No mesmo dispositivo" onClick={() => setView("OFFLINE_MENU")} />
          <div style={{ marginTop:"auto", paddingTop:16, fontSize:12, color:"rgba(255,255,255,0.15)", textAlign:"center" }}>
            Partilha o código para jogarem juntos online.
          </div>
        </div>

        <Overlays />
        <style>{`@keyframes floatMZ { 0% { transform: translateY(0px) rotate(-4deg); } 100% { transform: translateY(-14px) rotate(4deg); } }`}</style>
      </div>
    );
  }

  if (view === "HOST") {
    return (
      <div className="appBg"><div className="shell">
        {/* Status is silent when connected — only surfaces if there's actually
            a problem the user might want to know about (mid-session drop). */}
        <NavBar title="Criar sala" onBack={() => setView("HOME")} rightHint={connected ? null : "sem ligação"} rightDotColor="#c25151" />
        <section className="panel">
          <div style={{display:"grid",gap:10}}>
            {/* Party games first (social intent), then quiz. New game highlighted. */}
            <GameCard icon="🕵️" title="Agente Secreto" sub="Bluff · encontra o impostor" meta="3+ jogadores" onClick={createAgenteSecretoRoom} color="#00D4B4" />
            <GameCard icon="🎭" title="Quem Sou Eu?"   sub="Adivinha com dicas · 90s"    meta="2+ jogadores" onClick={createWhoIsWhoRoom}     color="#4a9eff" />
            <GameCard icon="⏱️" title="30 Segundos"    sub="CulturaGeral_MZ ou Global"   meta="2+ jogadores" onClick={create30sRoom}          color="#7c5dfa" />
            <GameCard icon="🧩" title="Sporcle MZ"     sub="Quiz cronometrado · 3 temas" meta="2+ jogadores" onClick={createSporcleMZRoom}    color="#f97316" isNew />
          </div>
        </section>
      </div><Overlays /></div>
    );
  }

  if (view === "JOIN") {
    return (
      <div className="appBg"><div className="shell">
        <NavBar title="Entrar numa sala" subtitle="Cola o código que te enviaram" onBack={() => setView("HOME")} />
        <section className="panel">
          <div style={{display:"grid",gap:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:900,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(234,236,244,.38)",marginBottom:8}}>Código da sala</div>
              <input value={joinCode} onChange={e=>setJoinCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&joinRoom()}
                placeholder="Ex: R3ABH2" className="niceInput"
                style={{letterSpacing:3,textTransform:"uppercase",fontSize:22,fontWeight:900,textAlign:"center"}} />
            </div>
            <button onClick={joinRoom} className="btnPrimary" type="button">Entrar na sala</button>
            <div style={{fontSize:12,color:"rgba(234,236,244,.32)",textAlign:"center"}}>O app abre automaticamente o jogo do host.</div>
          </div>
        </section>
      </div><Overlays /></div>
    );
  }

  if (view === "OFFLINE_MENU") {
    const goOffline = (game, gt) => { if (gt) showRulesFor(gt, () => { setOfflineGame(game); setView("OFFLINE_GAME"); }, "offline"); else { setOfflineGame(game); setView("OFFLINE_GAME"); } };
    return (
      <div className="appBg"><div className="shell">
        <NavBar title="Jogos offline" subtitle="No mesmo dispositivo" onBack={() => setView("HOME")} />
        <section className="panel">
          <div style={{display:"grid",gap:10}}>
            <GameCard icon="🕵️" title="Quem Está a Mentir?" sub="Deduções · tensão · 5–10 min" onClick={() => goOffline("imposter", null)} color="#00D4B4" />
            <GameCard icon="🎭" title="Quem Sou Eu?"        sub="Adivinha com dicas"           onClick={() => goOffline("who","whoIsWho")} color="#4a9eff" />
            <GameCard icon="⏱️" title="30 Segundos"         sub="CulturaGeral_MZ ou Global · 30s" onClick={() => goOffline("30s","thirtySeconds")} color="#7c5dfa" />
            <GameCard icon="🧩" title="Sporcle MZ"          sub="Quiz cronometrado · Solo"     onClick={() => goOffline("sporcle", null)} color="#f97316" isNew />
            <GameCard icon="🙈" title="Nunca Nunca"         sub="Confissões · quem fez o quê?" comingSoon />
            <GameCard icon="🍺" title="Faz ou Bebe"         sub="Desafios · Suave / Médio / 🔞" comingSoon />
          </div>
        </section>
      </div><Overlays /></div>
    );
  }

  return null;
}
