import { useState, useRef } from "react";

const MAX_LIVES = 3;
const MAX_PLAYERS = 10;

// ──── CONTEÚDO ────────────────────────────────────────────

const STATEMENTS_MIX = [
  "...fui a uma festa sem ser convidado",
  "...dormi numa aula ou reunião",
  "...menti para fugir a um compromisso",
  "...enviei uma mensagem para a pessoa errada",
  "...fingi não ver alguém na rua",
  "...comi a comida de outra pessoa sem pedir",
  "...cheguei atrasado e disse que estava a sair",
  "...stalkeei o perfil de alguém por mais de 10 minutos",
  "...apaguei uma mensagem depois de enviar",
  "...adormeci no autocarro ou chapa e passei a paragem",
  "...inventei uma desculpa para não ir a uma festa",
  "...esqueci o aniversário de alguém importante",
  "...fiz uma selfie e não gostei e apaguei",
  "...fingi que estava ocupado quando não estava",
  "...abri uma mensagem e não respondi de propósito",
  "...comi qualquer coisa caída no chão",
  "...chorei a ver um filme ou série",
  "...cantei alto numa viagem de carro",
  "...tirei uma foto feia de um amigo e guardei",
  "...acordei tarde e disse que já estava a caminho",
  "...usei roupa de outra pessoa sem pedir",
  "...fui às compras com fome e comprei coisas a mais",
  "...mandei uma mensagem no grupo errado",
  "...esqueci onde pus o telemóvel e entrei em pânico",
  "...fingi não perceber inglês para não falar com alguém",
  "...ouvi música no altifalante em público",
  "...espiei a conversa de alguém ao lado",
  "...prometei algo que sabia que não ia cumprir",
  "...guardei uma série sem esperar pelos amigos",
  "...dei um gosto por acidente e entrei em pânico",
  "...fiz uma compra por impulso e me arrependi",
  "...menti sobre ter lido o livro ou visto o filme",
  "...fingi gostar de uma prenda que não gostei",
  "...perdi as chaves de casa",
  "...saí de casa e voltei porque me esqueci de algo",
  "...passei a noite toda acordado sem motivo válido",
  "...comi em segredo para não partilhar",
  "...reli as minhas próprias mensagens antigas",
  "...fingi estar mal disposto para não trabalhar",
  "...paguei por algo que não usei nem uma vez",
  "...apanhou-me a dançar sozinho em casa",
  "...falei para mim mesmo em voz alta",
  "...pesquisei o nome de alguém no Google",
  "...bloqueei e desbloqueei alguém",
  "...esperei que alguém saísse para comer o que sobrou",
  "...fingi não saber fazer algo para não ter que fazê-lo",
  "...usei o Wi-Fi do vizinho sem ele saber",
  "...cheirei comida antes de comer para ver se estava boa",
  "...fui ao WC numa loja para não ter que comprar nada",
  "...tirei uma foto de algo ridículo só para me rir depois",
];

const STATEMENTS_MZ = [
  "...andei de chapa sem dinheiro",
  "...menti para os pais sobre onde estava",
  "...comi xima com a mão na rua",
  "...fui à praia sem protetor solar e arrependei-me",
  "...andei de carro sem cinto",
  "...falei crioulo para fingir que não entendia alguém",
  "...comprei comida em vez de poupar o dinheiro",
  "...fiquei numa bicha altíssima no BIM e desisti",
  "...usei dados de outra pessoa sem pedir",
  "...passei a noite na casa de alguém sem avisar a família",
  "...fiz uma transferência M-Pesa para o número errado",
  "...discuti sobre futebol com um desconhecido",
  "...entrei numa festa de casamento que não era minha",
  "...menti sobre a idade para entrar algum sítio",
  "...dancei afrobeat em público sem vergonha",
  "...comprei roupa no Mercado Central e disse que era importada",
  "...provei comida no mercado sem intenção de comprar",
  "...fiquei no Yango com uma estrela e não disse nada",
  "...usou pilhas gastas ainda mais um bocado",
  "...partilhei uma notícia sem verificar se era verdade",
  "...disse 'estou aqui perto' quando estava longe",
  "...fui a um jogo do Ferroviário ou Maxaquene e insultei o árbitro",
  "...cantou Azagaia em voz alta na rua",
  "...pediu dinheiro emprestado e 'esqueceu'",
  "...comeu o último bocado sem perguntar",
  "...reclamei do Yango mas continuei a usar",
  "...andei com bilhete de chapa vencido",
  "...fingi não ter rede para não atender",
  "...apaguei evidências do telefone antes de dar a alguém",
  "...fiz caras ao ver a conta da luz ou água",
];

const STATEMENTS_ADULTO = [
  "...fiz algo que os meus pais nunca devem saber",
  "...bebi demais e não me lembro bem da noite toda",
  "...fiz match com alguém e depois ignorei",
  "...enviei uma foto que não devia ter enviado",
  "...fiz algo apenas para impressionar alguém",
  "...tive uma crush num amigo do meu parceiro",
  "...terminei uma relação por mensagem",
  "...menti sobre o meu número de ex",
  "...fiz algo comprometedor e depois arrependei-me",
  "...dei um like em algo que estava a stalkar há muito",
  "...apaguei provas de uma conversa",
  "...fingi estar dormindo quando alguém chegou",
  "...fiz algo que nunca contei a ninguém",
  "...seduzi alguém que estava numa relação",
  "...usei desculpa de saúde para sair de um encontro",
  "...fiz planos com dois grupos diferentes na mesma noite",
  "...vi o telemóvel do meu parceiro às escondidas",
  "...fui a uma festa só para ver uma pessoa específica",
  "...disse 'estou bem' quando não estava nada bem",
  "...falei mal de alguém e essa pessoa ouviu",
  "...fingi ser mais sóbrio do que estava",
  "...fiz algo sob pressão que não queria mesmo fazer",
  "...mandei um áudio de voz e fiquei arrependido",
  "...apaguei um story em menos de 5 minutos",
  "...fiz algo envergonhante e fingi que não fui eu",
];

const CATEGORIES = [
  { key: "mix",    label: "🎲 Mix Geral",   items: STATEMENTS_MIX },
  { key: "mz",     label: "🇲🇿 MZ Sabor",   items: STATEMENTS_MZ },
  { key: "adulto", label: "🔞 Adulto",       items: STATEMENTS_ADULTO, adult: true },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Hearts({ lives, max = MAX_LIVES }) {
  return (
    <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ fontSize: 13 }}>{i < lives ? "❤️" : "🖤"}</span>
      ))}
    </div>
  );
}

export default function NuncaNunca({ onBack }) {
  const [screen, setScreen]       = useState("setup");
  const [slots, setSlots]         = useState(["", "", "", ""]);
  const [category, setCategory]   = useState("mix");
  const [players, setPlayers]     = useState([]);
  const [deck, setDeck]           = useState([]);
  const [deckIdx, setDeckIdx]     = useState(0);
  const [tapped, setTapped]       = useState(new Set());
  const [adultConfirm, setAdultConfirm] = useState(false);

  const cat = CATEGORIES.find(c => c.key === category) || CATEGORIES[0];

  // ── Setup helpers ──────────────────────────────────────
  const updateSlot = (i, v) => setSlots(prev => prev.map((s, idx) => idx === i ? v : s));
  const addSlot    = () => { if (slots.length < MAX_PLAYERS) setSlots(prev => [...prev, ""]); };
  const removeSlot = (i) => { if (slots.length > 2) setSlots(prev => prev.filter((_, idx) => idx !== i)); };

  const playerNames = slots.map(s => s.trim()).filter(Boolean);
  const canStart    = playerNames.length >= 2 && (!cat.adult || adultConfirm);

  const startGame = () => {
    if (!canStart) return;
    const ps = playerNames.map(name => ({ name, lives: MAX_LIVES }));
    const d  = shuffle(cat.items);
    setPlayers(ps);
    setDeck(d);
    setDeckIdx(0);
    setTapped(new Set());
    setScreen("play");
  };

  // ── Play helpers ───────────────────────────────────────
  const statement = deck[deckIdx % deck.length] || "";
  const alive     = players.filter(p => p.lives > 0);
  const winner    = alive.length === 1 ? alive[0] : null;

  const toggleTap = (i) => {
    if (players[i].lives === 0) return;
    setTapped(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const confirm = () => {
    if (tapped.size === 0) {
      // Ninguém fez → só avança
      nextStatement();
      return;
    }
    const updated = players.map((p, i) =>
      tapped.has(i) ? { ...p, lives: Math.max(0, p.lives - 1) } : p
    );
    setPlayers(updated);
    setTapped(new Set());

    const stillAlive = updated.filter(p => p.lives > 0);
    if (stillAlive.length <= 1) {
      setScreen("gameover");
    } else {
      nextStatement();
    }
  };

  const nextStatement = () => {
    setDeckIdx(i => i + 1);
    setTapped(new Set());
  };

  // ── Screens ────────────────────────────────────────────

  if (screen === "setup") {
    return (
      <div className="appBg">
        <div className="shell" style={{ paddingBottom: 32 }}>
          <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 16px" }}>
            <button onClick={onBack} className="btnBack" type="button">← Menu</button>
            <div>
              <div style={{ fontSize: 20, fontWeight: 950, background: "var(--grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                🙈 Nunca Nunca
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Escreve os nomes e começa</div>
            </div>
          </header>

          {/* Categoria */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(234,236,244,.38)", marginBottom: 8 }}>Categoria</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => { setCategory(c.key); if (!c.adult) setAdultConfirm(false); }}
                  style={{
                    padding: "12px 16px", borderRadius: 14, fontWeight: 800, fontSize: 14,
                    textAlign: "left", cursor: "pointer",
                    border: category === c.key ? "2px solid var(--p2)" : "1.5px solid rgba(255,255,255,.12)",
                    background: category === c.key ? "rgba(6,214,160,.12)" : "rgba(255,255,255,.04)",
                    color: "var(--txt)",
                  }}
                >
                  {c.label}
                  {c.adult && <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.6, fontWeight: 700 }}>+18</span>}
                </button>
              ))}
            </div>
            {cat.adult && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 13, opacity: 0.85, cursor: "pointer" }}>
                <input type="checkbox" checked={adultConfirm} onChange={e => setAdultConfirm(e.target.checked)} />
                Confirmo que todos têm 18+ anos
              </label>
            )}
          </div>

          {/* Jogadores — slots diretos */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(234,236,244,.38)", marginBottom: 10 }}>
              Jogadores
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {slots.map((val, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: `rgba(255,255,255,.08)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 900, color: "rgba(234,236,244,.45)",
                  }}>{i + 1}</div>
                  <input
                    value={val}
                    onChange={e => updateSlot(i, e.target.value)}
                    placeholder={`Jogador ${i + 1}`}
                    className="niceInput"
                    style={{ flex: 1, marginBottom: 0 }}
                    maxLength={16}
                  />
                  {slots.length > 2 && (
                    <button type="button" onClick={() => removeSlot(i)}
                      style={{ background: "none", border: "none", color: "rgba(234,236,244,.3)", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {slots.length < MAX_PLAYERS && (
              <button type="button" onClick={addSlot}
                style={{
                  marginTop: 10, width: "100%", padding: "10px",
                  borderRadius: 12, border: "1.5px dashed rgba(255,255,255,.15)",
                  background: "transparent", color: "rgba(234,236,244,.45)",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>
                + Adicionar jogador
              </button>
            )}
          </div>

          <button
            onClick={startGame}
            className="btnPrimary"
            type="button"
            disabled={!canStart}
            style={{ width: "100%", padding: "16px", fontSize: 16, fontWeight: 950, borderRadius: 16 }}
          >
            Começar Jogo →
          </button>
          {playerNames.length < 2 && (
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              Preenche pelo menos 2 nomes
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === "play") {
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button onClick={onBack} className="btnBack" type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Nunca Nunca</div>
            </div>
            <div className="timerPill" style={{ fontSize: 11 }}>{cat.label}</div>
          </header>

          <main className="gameMain" style={{ gap: 12 }}>
            {/* Statement card */}
            <section style={{
              flex: "0 0 auto",
              background: "radial-gradient(800px 400px at 50% 0%, rgba(6,214,160,.14), transparent 65%), rgba(0,0,0,.22)",
              border: "1px solid var(--stroke)", borderRadius: 20,
              padding: "28px 20px", textAlign: "center",
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--p2)", marginBottom: 10, letterSpacing: .5 }}>
                NUNCA NUNCA EU...
              </div>
              <div style={{
                fontSize: "clamp(18px, 5vw, 26px)", fontWeight: 900, lineHeight: 1.3,
                color: "var(--txt)", wordBreak: "break-word",
              }}>
                {statement}
              </div>
            </section>

            {/* Instrução */}
            <div style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
              Toca nos jogadores que já fizeram ↓
            </div>

            {/* Players grid */}
            <section style={{ display: "grid", gridTemplateColumns: players.length <= 4 ? "1fr 1fr" : "repeat(3, 1fr)", gap: 8 }}>
              {players.map((p, i) => {
                const isDead    = p.lives === 0;
                const isTapped  = tapped.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleTap(i)}
                    disabled={isDead}
                    style={{
                      padding: "12px 8px", borderRadius: 14, fontWeight: 800, fontSize: 13,
                      cursor: isDead ? "not-allowed" : "pointer",
                      border: isTapped ? "2px solid #ff6b6b" : "1.5px solid rgba(255,255,255,.12)",
                      background: isDead
                        ? "rgba(0,0,0,.2)"
                        : isTapped
                          ? "rgba(255,107,107,.18)"
                          : "rgba(255,255,255,.05)",
                      color: isDead ? "rgba(234,236,244,.25)" : "var(--txt)",
                      opacity: isDead ? 0.4 : 1,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{isTapped ? "✋" : isDead ? "💀" : "🙋"}</span>
                    <span style={{ fontSize: 12 }}>{p.name}</span>
                    <Hearts lives={p.lives} />
                  </button>
                );
              })}
            </section>

            {/* Dock */}
            <footer className="actionDock">
              <div className="dock2">
                <button
                  className="btnSoft dockBig"
                  type="button"
                  onClick={nextStatement}
                >
                  ⏭ Saltar
                </button>
                <button
                  className="btnPrimary dockBig"
                  type="button"
                  onClick={confirm}
                  style={{ flex: 2 }}
                >
                  {tapped.size === 0 ? "Ninguém fez →" : `${tapped.size} perdem vida →`}
                </button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    );
  }

  if (screen === "gameover") {
    const sorted = [...players].sort((a, b) => b.lives - a.lives);
    const champion = sorted[0];
    return (
      <div className="appBg">
        <div className="victoryOverlay">
          <div className="victoryBackdrop" />
          <div className="victoryCard">
            <div className="victoryTitle">🏆</div>
            <div className="victoryTeam">{champion.name}</div>
            <div className="victorySub">venceu o Nunca Nunca!</div>

            <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
              {sorted.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 10, background: "rgba(0,0,0,.2)", fontSize: 13 }}>
                  <span style={{ fontWeight: 800 }}>{i + 1}. {p.name}</span>
                  <Hearts lives={p.lives} />
                </div>
              ))}
            </div>

            <div className="victoryBtns" style={{ marginTop: 16 }}>
              <button className="victoryBtn restart" onClick={() => startGame()} type="button">
                🔁 Jogar de Novo
              </button>
              <button className="victoryBtn menu" onClick={onBack} type="button">
                ← Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
