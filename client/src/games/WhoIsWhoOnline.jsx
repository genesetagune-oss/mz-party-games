import React, { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../socket";

const SECTIONS = [
  {
    id: "mz", label: "🇲🇿 MZ",
    cats: [
      { key: "mix",    emoji: "🎲", title: "Mix MZ",       sub: "pessoas + marcas + lugares",     bg: "linear-gradient(135deg,#16a34a,#15803d)", shadow: "rgba(22,163,74,0.5)" },
      { key: "mzPic", emoji: "🖼️", title: "MZ Fotos",     sub: "marcas + famosos + lugares",     bg: "linear-gradient(135deg,#0d9488,#0f766e)", shadow: "rgba(13,148,136,0.5)" },
      { key: "mz",    emoji: "🇲🇿", title: "MZ Texto",     sub: "só palavras MZ",                 bg: "linear-gradient(135deg,#dc2626,#b91c1c)", shadow: "rgba(220,38,38,0.5)" },
    ],
  },
  {
    id: "global", label: "🌍 Global",
    cats: [
      { key: "global",    emoji: "🌍", title: "Global",         sub: "celebridades + marcas",  bg: "linear-gradient(135deg,#2563eb,#1d4ed8)", shadow: "rgba(37,99,235,0.5)" },
      { key: "globalPic", emoji: "🖼️", title: "Global Fotos",  sub: "fotos globais",           bg: "linear-gradient(135deg,#7c3aed,#6d28d9)", shadow: "rgba(124,58,237,0.5)" },
      { key: "filmes",    emoji: "🎬", title: "Filmes & Séries",sub: "cinema + streaming",      bg: "linear-gradient(135deg,#db2777,#be185d)", shadow: "rgba(219,39,119,0.5)" },
      { key: "musica",    emoji: "🎵", title: "Música",         sub: "artistas + bandas",       bg: "linear-gradient(135deg,#ea580c,#c2410c)", shadow: "rgba(234,88,12,0.5)" },
      { key: "desporto",  emoji: "⚽", title: "Desporto",       sub: "futebol + atletas",       bg: "linear-gradient(135deg,#0891b2,#0e7490)", shadow: "rgba(8,145,178,0.5)" },
    ],
  },
  {
    id: "especiais", label: "🔥 Especiais",
    cats: [
      { key: "anime",   emoji: "⛩️", title: "Anime",   sub: "Naruto · Dragon Ball · One Piece", bg: "linear-gradient(135deg,#d97706,#b45309)", shadow: "rgba(217,119,6,0.5)" },
      { key: "biblia",  emoji: "📖", title: "Bíblia",  sub: "personagens bíblicos",             bg: "linear-gradient(135deg,#ca8a04,#a16207)", shadow: "rgba(202,138,4,0.5)" },
      { key: "familia", emoji: "👶", title: "Família", sub: "versão fácil para todos",          bg: "linear-gradient(135deg,#16a34a,#4ade80)", shadow: "rgba(22,163,74,0.5)" },
      { key: "memes",   emoji: "😂", title: "Memes",   sub: "memes & tendências",               bg: "linear-gradient(135deg,#6366f1,#4f46e5)", shadow: "rgba(99,102,241,0.5)" },
      { key: "adulto",  emoji: "🔞", title: "18+",     sub: "em breve",                         bg: "linear-gradient(135deg,#374151,#1f2937)", shadow: "rgba(0,0,0,0.3)", locked: true },
    ],
  },
];

export default function WhoIsWhoOnline({ onBack, room, roomCode, gamePublic, gamePrivate }) {
  const me = room?.players?.find((p) => p.id === socket.id) || null;
  const isHost = !!me?.isHost;
  const playerCount = room?.players?.length ?? 0;

  const phase = gamePublic?.phase ?? "lobby";
  const turnPhase = gamePublic?.turnPhase ?? "ready";
  const paused = !!gamePublic?.paused;

  const scores = gamePublic?.scores ?? { A: 0, B: 0 };
  const teamTurn = gamePublic?.currentTeam ?? "-";
  const playerName = gamePublic?.currentPlayer?.name ?? "-";

  const remaining = Math.ceil((gamePublic?.remainingMs ?? 0) / 1000);
  const winnerTeam = gamePublic?.winnerTeam ?? null;
  const category = gamePublic?.category ?? room?.settings?.category ?? "mix";

  const passLeft = gamePublic?.passLeft ?? 0;

  const role = gamePrivate?.role ?? "NONE";
  const isExplainer = role === "EXPLAINER";
  const canAct = !!gamePrivate?.canAct;

  const [floatMsg, setFloatMsg] = useState(null);

  function showFloat(msg) {
    setFloatMsg(msg);
    setTimeout(() => setFloatMsg(null), 1000);
  }

  const item = gamePrivate?.item ?? null;

  useEffect(() => {
    if (item) {
      console.log("🎯 WhoIsWhoOnline — Item recebido:", { type: item.type, src: item.src, value: item.value });
    }
  }, [item]);

  const audioRef = useRef(null);
  function ensureAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!audioRef.current) audioRef.current = new AudioCtx();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  }
  function warmupAudio() {
    try {
      const ctx = ensureAudio();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 1; g.gain.value = 0.00001;
      o.connect(g); g.connect(ctx.destination); o.start();
      setTimeout(() => o.stop(), 60);
    } catch {}
  }

  const leaveToMenu = () => { socket.emit("room:leave"); onBack?.(); };
  const startGame  = () => { warmupAudio(); socket.emit("game:start"); };
  const setCat     = (cat) => { warmupAudio(); socket.emit("game:setCategory", { category: cat }); };
  const yes        = () => { warmupAudio(); showFloat("✅ +1"); socket.emit("game:command", { type: "YES" }); };
  const no         = () => { warmupAudio(); showFloat("❌"); socket.emit("game:command", { type: "NO" }); };
  const pass       = () => { warmupAudio(); socket.emit("game:command", { type: "PASS" }); };
  const togglePause = () => { warmupAudio(); socket.emit("game:command", { type: "PAUSE_TOGGLE" }); };
  const restart    = () => { warmupAudio(); socket.emit("game:restart"); };

  const handleShare = async () => {
    const url = "https://mz-party-games.onrender.com";
    const text = `🎮 Acabei de jogar MZ Party Games! Vem jogar também → ${url}`;
    if (navigator.share) { try { await navigator.share({ title: "MZ Party Games", text, url }); } catch {} }
    else { try { await navigator.clipboard.writeText(text); } catch {} }
  };

  const title = useMemo(() => {
    if (phase === "finished") return `🏆 Vencedor: Equipa ${winnerTeam}`;
    if (phase !== "playing") return "Lobby";
    return `Vez da Equipa ${teamTurn} — ${playerName} está a ver`;
  }, [phase, winnerTeam, teamTurn, playerName]);

  const isLobby = phase === "lobby" || (phase !== "playing" && phase !== "finished");

  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={leaveToMenu} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Quem Sou Eu? · Online</div>
            <div style={{ opacity: 0.6, marginTop: 2, fontSize: 11 }}>
              Sala: <b>{roomCode || "-"}</b> · {playerCount} jogador{playerCount !== 1 ? "es" : ""}
            </div>
          </div>
          <div className="timerPill">
            {phase !== "playing"
              ? (isLobby ? "🎭" : "")
              : turnPhase === "ready"
              ? `⏳ ${remaining}s`
              : `⏱️ ${remaining}s`}
          </div>
        </header>

        <main className="gameMain">
          {/* ── LOBBY ── */}
          {isLobby && (
            <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: 12, overflow: "auto", paddingBottom: 12 }}>
              {isHost ? (
                <>
                  {SECTIONS.map((sec) => (
                    <div key={sec.id}>
                      <div style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: "0.16em",
                        textTransform: "uppercase", color: "rgba(255,255,255,0.38)",
                        marginBottom: 8, paddingLeft: 2,
                      }}>
                        {sec.label}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {sec.cats.map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            disabled={c.locked}
                            onClick={() => !c.locked && setCat(c.key)}
                            style={{
                              border: category === c.key ? "2.5px solid rgba(255,255,255,0.9)" : "2.5px solid transparent",
                              borderRadius: 16,
                              padding: "13px 8px 10px",
                              display: "flex", flexDirection: "column", alignItems: "center",
                              justifyContent: "center", gap: 4,
                              cursor: c.locked ? "not-allowed" : "pointer",
                              background: c.bg,
                              boxShadow: category === c.key
                                ? `0 0 0 3px rgba(255,255,255,0.25), 0 4px 20px ${c.shadow}`
                                : `0 4px 16px ${c.shadow}`,
                              minHeight: 96, transition: "transform 0.12s, box-shadow 0.12s",
                              WebkitTapHighlightColor: "transparent",
                              opacity: c.locked ? 0.38 : 1,
                              position: "relative",
                            }}
                          >
                            <div style={{ fontSize: 28, lineHeight: 1 }}>{c.emoji}</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.2 }}>
                              {c.title}
                            </div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.72)", textAlign: "center", lineHeight: 1.3 }}>
                              {c.sub}
                            </div>
                            {c.locked && (
                              <div style={{ position: "absolute", top: 5, right: 6, fontSize: 8, fontWeight: 700, background: "rgba(255,255,255,0.15)", borderRadius: 5, padding: "2px 5px", color: "#fff" }}>
                                🔒 Em breve
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btnPrimary"
                    disabled={playerCount < 2}
                    onClick={startGame}
                    style={{ marginTop: 4 }}
                  >
                    {playerCount < 2 ? `Aguardando mais ${2 - playerCount} jogador…` : "▶ Começar"}
                  </button>
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "32px 0" }}>
                  <div style={{ fontSize: 48 }}>🎭</div>
                  <div style={{ fontWeight: 900, fontSize: 18, textAlign: "center" }}>
                    Aguardando o host iniciar…
                  </div>
                  {category && (
                    <div style={{
                      padding: "8px 16px", borderRadius: 999,
                      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
                      fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)",
                    }}>
                      Categoria: <b style={{ color: "#fff" }}>
                        {SECTIONS.flatMap(s => s.cats).find(c => c.key === category)?.title ?? category}
                      </b>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── IN-GAME ── */}
          {!isLobby && (
            <>
              <section className="scoreRow">
                <div className={`scoreBox ${teamTurn === "A" ? "active" : "inactive"}`}>
                  <div className="scoreLabel">Equipa A</div>
                  <div className="scoreNum">{scores.A ?? 0}</div>
                </div>
                <div className={`scoreBox ${teamTurn === "B" ? "active" : "inactive"}`}>
                  <div className="scoreLabel">Equipa B</div>
                  <div className="scoreNum">{scores.B ?? 0}</div>
                </div>
              </section>

              <section className="turnRow">
                <div className="turnText">
                  {title}
                  {paused ? <span className="muted"> — (PAUSADO)</span> : null}
                </div>
                <div className="winRule">Passes: {passLeft}</div>
              </section>

              <section className="whoStage" style={{ position: "relative" }}>
                {floatMsg && (
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -60%)",
                    fontSize: 32, fontWeight: 950, pointerEvents: "none",
                    zIndex: 10, animation: "floatUp .9s ease forwards",
                  }}>{floatMsg}</div>
                )}
                {item?.type === "img" && isExplainer && phase === "playing" && turnPhase === "play" && (
                  <>
                    <div className="whoImgFull">
                      <img src={item.src} alt="Mystery item" onError={(e) => { e.target.style.display = "none"; }} />
                    </div>
                    <div className="whoImgGradient" />
                  </>
                )}
                <div className="whoStageInner" style={{ transform: "none" }}>
                  {turnPhase === "ready" ? (
                    <div style={{ textAlign: "center" }}>
                      <div className="whoSmall">Pronto…</div>
                      <div className="whoBig">{remaining}</div>
                    </div>
                  ) : isExplainer ? (
                    item ? (
                      item.type === "img" ? null : (
                        <div className="whoCardText">{item.value || item.text || ""}</div>
                      )
                    ) : (
                      <div className="whoSmall">Sem item…</div>
                    )
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <div className="whoBig">🤔</div>
                      <div className="whoSmall" style={{ marginTop: 8 }}>Faz perguntas de SIM / NÃO!</div>
                      <div className="whoSmall" style={{ opacity: 0.5, marginTop: 4 }}>{playerName} responde com os botões</div>
                    </div>
                  )}
                </div>
              </section>

              <footer className="actionDock">
                {phase === "playing" && turnPhase === "play" ? (
                  isExplainer ? (
                    <>
                      <div className="dock2">
                        <button className="btnSoft dockBig" onClick={yes} disabled={!canAct} type="button"
                          style={{ background: "rgba(0,200,100,.18)", border: "1px solid rgba(0,200,100,.35)" }}>
                          ✅ Acertou
                        </button>
                        <button className="btnSoft dockBig" onClick={no} disabled={!canAct} type="button"
                          style={{ background: "rgba(220,50,50,.18)", border: "1px solid rgba(220,50,50,.35)" }}>
                          ❌ Errou
                        </button>
                      </div>
                      <div className="dock2">
                        <button className="btnSoft" onClick={pass} disabled={!canAct || passLeft <= 0} type="button">
                          ⏭ Passar ({passLeft})
                        </button>
                        <button className="btnSoft" onClick={togglePause} disabled={!isExplainer} type="button">
                          {paused ? "▶️ Retomar" : "⏸️ Pausa"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="footNoteDock" style={{ opacity: 0.85 }}>
                      Adivinha e fala em voz alta. {playerName} confirma.
                    </div>
                  )
                ) : (
                  <div className="footNoteDock" style={{ opacity: 0.85 }}>Aguarde…</div>
                )}
              </footer>
            </>
          )}

          {/* ── VICTORY ── */}
          {phase === "finished" && (
            <div className="victoryOverlay">
              <div className="victoryBackdrop" />
              <div className="victoryCard">
                <div className="victoryTitle">🏆</div>
                <div className="victoryTeam">Equipa {winnerTeam}</div>
                <div className="victorySub">{scores[winnerTeam]} pontos</div>
                <div className="victoryBtns">
                  <button className="victoryBtn share" onClick={handleShare} type="button">📲 Partilhar</button>
                  {isHost && (
                    <button className="victoryBtn restart" onClick={restart} type="button">🔁 Reiniciar</button>
                  )}
                  <button className="victoryBtn menu" onClick={leaveToMenu} type="button">Menu</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
