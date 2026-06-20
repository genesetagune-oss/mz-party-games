import { useState, useRef } from "react";

const MAX_PLAYERS = 10;

// ──── DESAFIOS ────────────────────────────────────────────

const CHALLENGES_SUAVE = [
  "Faz 10 flexões agora mesmo.",
  "Imita o som de um animal durante 10 segundos.",
  "Diz um elogio sincero a cada pessoa na sala.",
  "Canta os primeiros 30 segundos de uma música.",
  "Dança durante 20 segundos sem música.",
  "Faz uma pose de estátua e fica parado 15 segundos.",
  "Ri de forma exagerada durante 10 segundos.",
  "Descreve a tua música favorita sem dizer o nome.",
  "Faz 15 agachamentos.",
  "Imita o presentador de um telejornal por 20 segundos.",
  "Diz 5 coisas que gostas na pessoa à tua direita.",
  "Faz uma voz de robot e fala por 20 segundos.",
  "Conta uma piada — boa ou má.",
  "Imita um político famoso por 15 segundos.",
  "Faz uma ponte ou tenta.",
  "Diz os números de 1 a 20 o mais rápido possível.",
  "Cheira os sapatos da pessoa à tua esquerda.",
  "Faz uma selfie com cara de surpresa e mostra ao grupo.",
  "Recita o alfabeto ao contrário.",
  "Imita como alguém da sala anda.",
  "Respira fundo 3 vezes e faz barulho de meditação.",
  "Tenta tocar nos dedos dos pés sem dobrar os joelhos.",
  "Fala em sussurro durante os próximos 3 minutos.",
  "Muda o teu nome para um apelido que o grupo escolhe por 5 minutos.",
  "Faz 10 saltos no mesmo lugar.",
  "Congela em qualquer posição que estiveres por 15 segundos.",
  "Descreve o teu filme favorito em 3 palavras.",
  "Faz uma beatbox durante 15 segundos.",
  "Liga para um contacto aleatório dos teus recentes e diz 'Olá, tudo bem?'.",
  "Faz uma frase com cada letra do teu nome.",
  "Anda como um pinguim por 30 segundos.",
  "Conta uma história triste em 10 segundos.",
  "Imita o teu professor favorito ou chefe.",
  "Diz o nome de 10 países em 10 segundos.",
  "Faz a cara mais feia que consegues.",
  "Canta parabéns a alguém da sala.",
  "Descreve o teu fim de semana passado como se fosse um filme de acção.",
  "Pede um autógrafo a alguém na sala.",
  "Faz 5 movimentos de kung fu.",
  "Conta um segredo não muito privado.",
];

const CHALLENGES_MEDIO = [
  "Envia uma mensagem 'Saudades tuas 😊' ao 3º contacto da tua lista.",
  "Muda o teu estado do WhatsApp para algo que o grupo escolhe — fica assim 10 min.",
  "Liga para alguém e diz: 'Estou perdido, podes vir buscar-me?'.",
  "Deixa alguém da sala escrever uma publicação nas tuas redes sociais.",
  "Lê em voz alta a última mensagem que enviaste.",
  "Mostra a última foto que tiraste.",
  "Faz um post de 'bom dia' nas redes sociais agora mesmo.",
  "Deixa a pessoa à tua esquerda ver as tuas últimas pesquisas.",
  "Muda a tua foto de perfil para uma foto tirada agora durante 10 minutos.",
  "Envia um sticker aleatório ao último contacto que falaste.",
  "Faz 30 segundos de stand-up comedy sobre a tua vida.",
  "Imita a voz de 3 pessoas da sala sem dizer os nomes.",
  "Confessa algo embaraçoso que fizeste este mês.",
  "Responde honestamente: O que é que gostas menos em ti mesmo?",
  "Senta no colo da pessoa à tua direita por 10 segundos.",
  "Fala com sotaque estrangeiro durante os próximos 5 minutos.",
  "Deixa o grupo escolher o teu próximo estado do WhatsApp.",
  "Faz uma declaração de amizade a alguém na sala.",
  "Canta o refrão de uma música que o grupo escolhe.",
  "Revela o teu apelido de criança.",
  "Mostra a foto mais feia que tens no telemóvel.",
  "Diz o que gostas secretamente que as pessoas não sabem.",
  "Age como se fosses um apresentador de compras durante 1 minuto — vende algo da sala.",
  "Faz uma declaração de amor à cadeira mais próxima.",
  "Manda uma mensagem 'Adoro-te' a alguém que o grupo escolhe.",
  "Conta qual foi o teu maior momento de vergonha.",
  "Pergunta ao grupo: 'O que devo mudar em mim?' — aceita a resposta.",
  "Faz uma entrevista de emprego imaginária para o cargo de 'Especialista em Nada'.",
  "Fica de costas para o grupo e descreve o que estão a vestir.",
  "Envia um áudio de 10 segundos ao teu melhor amigo a dizer que precisas de ajuda urgente.",
];

const CHALLENGES_ADULTO = [
  "Revela o nome da última pessoa em quem pensaste de forma romântica.",
  "Conta a história da tua última crush sem dizer o nome.",
  "Diz em voz alta a última conversa de flerting que tiveste.",
  "Confessa: já mandaste uma mensagem para a pessoa errada com conteúdo comprometedor?",
  "Qual é o teu tipo ideal? Descreve em detalhes.",
  "Conta o teu momento mais íntimo mais embaraçoso.",
  "Se tivesses que bejar alguém na sala, quem seria?",
  "Conta a história de como perdeste ou quase perdeste a virgindade.",
  "Descreve o teu parceiro ideal em 5 adjetivos.",
  "Quantas pessoas já beijaste? Diz o número verdadeiro.",
  "Qual foi o local mais inusitado onde fizeste algo proibido?",
  "Revela: Já tens segredos do teu parceiro atual?",
  "Conta a tua fantasia mais improvável.",
  "Qual a coisa mais atrevida que já fizeste numa viagem?",
  "Se tens parceiro, conta o que o atrai em ti. Se não tens, descreve o que atrais.",
  "Diz o número de vezes que bloqueaste e desbloqueaste alguém.",
  "Confessa: já namoraste com mais de uma pessoa ao mesmo tempo?",
  "Qual o presente mais estranho que já deste ou recebeste de um crush?",
  "Conta o pior date que já tiveste.",
  "Revela: Já foste 'ghosted' ou 'ghostaste' alguém? Conta.",
];

const CATS = [
  { key: "suave", emoji: "😄", label: "Suave", color: "#00c48c", challenges: CHALLENGES_SUAVE },
  { key: "medio", emoji: "🌶️", label: "Médio", color: "#f97316", challenges: CHALLENGES_MEDIO },
  { key: "adulto", emoji: "🔞", label: "Adulto", color: "#ef4444", challenges: CHALLENGES_ADULTO, adult: true },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ──── COMPONENT ───────────────────────────────────────────

export default function FazOuBebe({ onBack }) {
  const [phase, setPhase] = useState("setup"); // setup | play | gameover
  const [slots, setSlots] = useState(["", "", "", ""]);
  const [catKey, setCatKey] = useState("suave");
  const [adultConfirm, setAdultConfirm] = useState(false);

  // play state
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [deckIdx, setDeckIdx] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);
  const [log, setLog] = useState([]); // { player, challenge, result: "did"|"drank" }
  const [drinkCounts, setDrinkCounts] = useState({});
  const [showResult, setShowResult] = useState(null); // "did"|"drank"

  const cat = CATS.find(c => c.key === catKey) || CATS[0];

  // ── Setup helpers ──────────────────────────────────────
  const updateSlot = (i, v) => setSlots(prev => prev.map((s, idx) => idx === i ? v : s));
  const addSlot    = () => { if (slots.length < MAX_PLAYERS) setSlots(prev => [...prev, ""]); };
  const removeSlot = (i) => { if (slots.length > 2) setSlots(prev => prev.filter((_, idx) => idx !== i)); };

  const playerNames = slots.map(s => s.trim()).filter(Boolean);
  const canStart    = playerNames.length >= 2 && (!cat.adult || adultConfirm);

  const startGame = () => {
    const valid = playerNames;
    if (valid.length < 2) return;
    if (cat.adult && !adultConfirm) return;

    const shuffledDeck = shuffle(cat.challenges);
    const shuffledPlayers = shuffle(valid);
    const counts = {};
    shuffledPlayers.forEach(p => { counts[p] = 0; });

    setPlayers(shuffledPlayers);
    setDeck(shuffledDeck);
    setDeckIdx(0);
    setTurnIdx(0);
    setLog([]);
    setDrinkCounts(counts);
    setShowResult(null);
    setPhase("play");
  };

  // ── Play helpers ───────────────────────────────────────
  const currentPlayer = players[turnIdx % players.length];
  const currentChallenge = deck[deckIdx % deck.length];

  const handleAction = (result) => {
    setShowResult(result);

    setLog(prev => [...prev, { player: currentPlayer, challenge: currentChallenge, result }]);

    if (result === "drank") {
      setDrinkCounts(prev => ({ ...prev, [currentPlayer]: (prev[currentPlayer] || 0) + 1 }));
    }

    setTimeout(() => {
      setShowResult(null);
      setDeckIdx(i => i + 1);
      setTurnIdx(i => i + 1);
    }, 900);
  };

  const endGame = () => {
    setPhase("gameover");
  };

  // ── Render: Setup ──────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="appBg">
        <div className="shell">
          <header className="gameHeader">
            <button className="btnBack" onClick={onBack} type="button">← Menu</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Faz ou Bebe</div>
            </div>
            <div style={{ width: 60 }} />
          </header>

          <main className="gameMain" style={{ padding: "0 16px 24px" }}>
            {/* Categoria */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(234,236,244,.38)", marginBottom: 8 }}>
                Categoria
              </div>
              <div className="catTilesRow">
                {CATS.map(c => (
                  <button
                    key={c.key}
                    type="button"
                    className={`catTile${catKey === c.key ? " selected" : ""}`}
                    onClick={() => { setCatKey(c.key); setAdultConfirm(false); }}
                    style={catKey === c.key ? { borderColor: c.color, background: `${c.color}22` } : {}}
                  >
                    <span className="catTileEmoji">{c.emoji}</span>
                    <span>{c.label}</span>
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
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(234,236,244,.38)", marginBottom: 10 }}>
                Jogadores
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {slots.map((val, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(255,255,255,.08)",
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
              {playerNames.length < 2 && (
                <div style={{ fontSize: 12, color: "rgba(234,236,244,.38)", marginTop: 8 }}>
                  Preenche pelo menos 2 nomes
                </div>
              )}
            </div>

            <button
              type="button"
              className="btnPrimary"
              onClick={startGame}
              disabled={!canStart}
              style={{ width: "100%", padding: 16, fontSize: 16, fontWeight: 950 }}
            >
              🍺 Começar
            </button>
          </main>
        </div>
      </div>
    );
  }

  // ── Render: Play ───────────────────────────────────────
  if (phase === "play") {
    return (
      <div className="appBg">
        <div className="shell shellGame">
          <header className="gameHeader">
            <button className="btnBack" onClick={endGame} type="button">⛔ Fim</button>
            <div className="headerTitleBlock">
              <div className="h1Brand">MZ Party Games</div>
              <div className="h2Game">Faz ou Bebe</div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(234,236,244,.45)", textAlign: "right", lineHeight: 1.4 }}>
              {cat.emoji} {cat.label}<br />
              <span style={{ opacity: 0.6 }}>Desafio {(deckIdx % deck.length) + 1}</span>
            </div>
          </header>

          <main className="gameMain" style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Vez de quem */}
            <div style={{
              textAlign: "center",
              background: "rgba(255,255,255,.05)",
              borderRadius: 16,
              padding: "14px 16px",
              border: "1px solid rgba(255,255,255,.08)",
            }}>
              <div style={{ fontSize: 12, color: "rgba(234,236,244,.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Vez de
              </div>
              <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: -0.5 }}>
                {currentPlayer}
              </div>
            </div>

            {/* Desafio */}
            <div style={{
              flex: 1,
              background: showResult === "did"
                ? "rgba(0,196,140,.12)"
                : showResult === "drank"
                ? "rgba(239,68,68,.12)"
                : "rgba(255,255,255,.05)",
              borderRadius: 20,
              border: showResult === "did"
                ? "1.5px solid rgba(0,196,140,.30)"
                : showResult === "drank"
                ? "1.5px solid rgba(239,68,68,.30)"
                : "1px solid rgba(255,255,255,.08)",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: 160,
              position: "relative",
              transition: "background .3s, border .3s",
            }}>
              {showResult ? (
                <div style={{
                  fontSize: 52,
                  animation: "floatUp .9s ease forwards",
                }}>
                  {showResult === "did" ? "✅" : "🍺"}
                </div>
              ) : (
                <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.45 }}>
                  {currentChallenge}
                </div>
              )}
            </div>

            {/* Botões */}
            {!showResult && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <button
                    type="button"
                    className="btnSoft dockBig"
                    onClick={() => handleAction("did")}
                    style={{
                      background: "rgba(0,196,140,.15)",
                      border: "1.5px solid rgba(0,196,140,.35)",
                      padding: "18px 12px",
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    ✅ Fiz!
                  </button>
                  <button
                    type="button"
                    className="btnSoft dockBig"
                    onClick={() => handleAction("drank")}
                    style={{
                      background: "rgba(239,68,68,.15)",
                      border: "1.5px solid rgba(239,68,68,.35)",
                      padding: "18px 12px",
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    🍺 Bebo
                  </button>
                </div>
                <button
                  type="button"
                  className="btnSoft"
                  onClick={() => { setDeckIdx(i => i + 1); setTurnIdx(i => i + 1); }}
                  style={{ opacity: 0.6, fontSize: 13 }}
                >
                  ⏭ Saltar desafio
                </button>
              </>
            )}

            {/* Mini placar bebidas */}
            <div style={{
              background: "rgba(255,255,255,.04)",
              borderRadius: 14,
              padding: "10px 14px",
              border: "1px solid rgba(255,255,255,.07)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase", color: "rgba(234,236,244,.38)", marginBottom: 7 }}>
                Bebidas
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {players.map(p => (
                  <div key={p} style={{
                    fontSize: 13, fontWeight: 700,
                    background: drinkCounts[p] > 0 ? "rgba(239,68,68,.15)" : "rgba(255,255,255,.06)",
                    borderRadius: 8, padding: "4px 10px",
                    border: drinkCounts[p] > 0 ? "1px solid rgba(239,68,68,.25)" : "1px solid transparent",
                  }}>
                    {p}: {drinkCounts[p] > 0 ? `🍺×${drinkCounts[p]}` : "0"}
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── Render: Gameover ───────────────────────────────────
  const sorted = [...players].sort((a, b) => (drinkCounts[b] || 0) - (drinkCounts[a] || 0));
  const totalRounds = log.length;

  return (
    <div className="appBg">
      <div className="victoryOverlay">
        <div className="victoryBackdrop" />
        <div className="victoryCard">
          <div className="victoryTitle">🍺</div>
          <div className="victoryTeam" style={{ fontSize: 22 }}>Jogo terminado!</div>
          <div className="victorySub">{totalRounds} desafios</div>

          <div style={{ width: "100%", display: "grid", gap: 8, margin: "14px 0" }}>
            {sorted.map((p, i) => (
              <div key={p} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: i === 0 && drinkCounts[p] > 0 ? "rgba(239,68,68,.12)" : "rgba(255,255,255,.06)",
                borderRadius: 12, padding: "10px 14px",
                border: i === 0 && drinkCounts[p] > 0 ? "1px solid rgba(239,68,68,.25)" : "1px solid rgba(255,255,255,.08)",
              }}>
                <div style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                  {i === 0 && drinkCounts[p] > 0 ? "🍺" : i === 0 ? "🏆" : `${i + 1}.`}
                </div>
                <div style={{ flex: 1, fontWeight: 800 }}>{p}</div>
                <div style={{ fontWeight: 900, color: drinkCounts[p] > 0 ? "#ef4444" : "#00c48c" }}>
                  {drinkCounts[p] > 0 ? `${drinkCounts[p]} bebida${drinkCounts[p] > 1 ? "s" : ""}` : "Sóbrio! 🧃"}
                </div>
              </div>
            ))}
          </div>

          <div className="victoryBtns">
            <button
              type="button"
              className="victoryBtn restart"
              onClick={() => {
                setPhase("setup");
                setSlots(players.length >= 2 ? [...players] : ["", "", "", ""]);
                setAdultConfirm(false);
              }}
            >
              🔁 Jogar de novo
            </button>
            <button type="button" className="victoryBtn menu" onClick={onBack}>
              ← Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
