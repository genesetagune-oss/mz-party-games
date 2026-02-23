import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../src/App.css";

const WIN_SCORE = 30;
const CARD_SIZE = 4;

const ROUND_SECONDS = 30;
const READY_SECONDS = 3;
const SWAPS_PER_ROUND = 2;

const TRANSITION_SECONDS = 6; // ✅ NOVO: fase de transição (não mostrar countdown)

const MAX_NAMES = 6;

// =====================
// ITENS
// =====================
export const ITEMS_GLOBAL = [
  "Michael Jackson","Elvis Presley","Madonna","The Beatles","Bob Marley",
  "Beyoncé","Rihanna","Taylor Swift","Drake","Eminem",
  "Tupac Shakur","Jay-Z","Kanye West","Adele","Bruno Mars",
  "Lady Gaga","Justin Bieber","The Weeknd","Sia","Shakira",
  "Bad Bunny","Karol G","Ed Sheeran","Billie Eilish","Coldplay",
  "U2","Queen","Freddie Mercury","ABBA","Celine Dion",

  "Cristiano Ronaldo","Lionel Messi","Pelé","Diego Maradona","Usain Bolt",
  "Michael Jordan","LeBron James","Serena Williams","Muhammad Ali","Mike Tyson",
  "Neymar","Kylian Mbappé","Zinedine Zidane","Ronaldinho","Ronaldo Fenómeno",
  "Lewis Hamilton","Max Verstappen","Ayrton Senna","Roger Federer","Rafael Nadal",
  "Novak Djokovic","Simone Biles","Tiger Woods","Tom Brady","Kobe Bryant",

  "Nelson Mandela","Barack Obama","Martin Luther King Jr.","Che Guevara",
  "Napoleão Bonaparte","Cleópatra","Júlio César","Alexandre o Grande",
  "Gengis Khan","Winston Churchill","Franklin D. Roosevelt","Mahatma Gandhi",
  "Abraham Lincoln","Angela Merkel","Rainha Elizabeth II",

  "Harry Potter","Senhor dos Anéis","Star Wars","Matrix","Titanic",
  "Avatar","Jurassic Park","Vingadores","Homem-Aranha","Batman",
  "Superman","Pantera Negra","Toy Story","Rei Leão","Frozen",
  "Velozes e Furiosos","Missão Impossível","Homem de Ferro",
  "Capitão América","Thor","Hulk","Mulher-Maravilha",
  "Joker","Deadpool","James Bond","Indiana Jones","Piratas das Caraíbas",
  "Shrek","Minions","Stranger Things",

  "Netflix","YouTube","Instagram","TikTok","WhatsApp",
  "Google","Facebook","Spotify","Amazon","Apple",
  "Gmail","Wi-Fi","Bluetooth","Internet","E-mail",
  "Android","iPhone","Windows","MacBook","PlayStation",

  "Copa do Mundo","Olimpíadas","Champions League","Super Bowl","NBA",
  "Futebol","Basquetebol","Ténis","Fórmula 1","Maratona",
  "Boxe","UFC",

  "Planeta Terra","Sistema Solar","Via Láctea","Buraco Negro","Big Bang",
  "Lua","Sol","Marte","Saturno","Estrela Cadente",
  "Albert Einstein","Isaac Newton","Galileu Galilei","Gravidade",
  "Teoria da Relatividade","DNA","Evolução","Vacina",

  "Pirâmides do Egito","Muralha da China","Torre Eiffel","Coliseu de Roma",
  "Taj Mahal","Machu Picchu","Estátua da Liberdade","Big Ben",
  "Cristo Redentor","Stonehenge","Disneyland","Sagrada Família",

  "Estados Unidos","Brasil","Portugal","Espanha","França",
  "Inglaterra","Itália","Alemanha","China","Japão",
  "Paris","Londres","Nova Iorque","Roma","Madrid",
  "Lisboa","Pequim","Tóquio","Dubai","Rio de Janeiro",

  "Pizza","Hambúrguer","Sushi","Chocolate","Café",
  "Chá","Gelado","Coca-Cola","McDonald's","KFC",
  "Batata Frita","Cachorro-Quente","Sanduíche","Arroz",
  "Massa","Frango",

  "Filme","Cinema","Série","Televisão","Rádio",
  "Música","Concerto","Festival","Teatro","Fotografia",
  "Hollywood","Oscar","Grammy","Globo de Ouro","Cannes",
  "Tapete Vermelho","Estrela de Cinema","Cantor","Atriz","Ator",
  "Leonardo da Vinci","Mona Lisa","William Shakespeare","Romeu e Julieta",
  "Pablo Picasso","Vincent van Gogh","A Noite Estrelada","A Última Ceia","Escultura",
  "Livro","Biblioteca","Jornal","Notícia"
];

export const ITEMS_MZ = [
  "Moçambique","Maputo","Matola","Beira","Nampula","Quelimane","Tete","Pemba","Xai-Xai","Chimoio","Inhambane",
  "Lichinga","Gurúè","Dondo","Mocuba","Nacala","Angoche","Montepuez","Cuamba","Manica","Gondola",
  "Chókwè","Chibuto","Mandlakazi","Massinga","Vilankulo","Maxixe",
  "Sofala","Gaza","Inhambane (província)","Zambézia","Tete (província)","Cabo Delgado","Niassa","Manica (província)","Nampula (província)","Maputo (província)",
  "Boane","Namaacha","Marracuene","Manhiça","Magude","Moamba (distrito)","Matutuíne","Katembe","Ressano Garcia",
  "Dondo (distrito)","Buzi","Nhamatanda","Gorongosa (distrito)","Marromeu","Caia","Chemba","Muanza",
  "Chimoio (cidade)","Catandica","Sussundenga","Bárue","Guro","Tambara",
  "Nampula (cidade)","Ilha de Moçambique (cidade)","Mossuril","Mecubúri","Ribaue","Monapo","Moma",
  "Nacala-Porto","Nacala-a-Velha",
  "Quelimane (cidade)","Gurúè (distrito)","Milange","Mocuba (distrito)","Alto Molócuè","Namacurra","Inhassunge",
  "Tete (cidade)","Moatize","Cahora Bassa","Changara","Marávia",
  "Pemba (cidade)","Montepuez (cidade)","Mueda","Mocímboa da Praia","Palma","Ancuabe","Chiúre",
  "Lichinga (cidade)","Cuamba (cidade)","Mandimba","Metangula",

  "Ilha de Moçambique","Ilha do Ibo","Ilha de Inhaca","Ilha de Santa Carolina","Ilha do Bazaruto",
  "Arquipélago do Bazaruto","Arquipélago das Quirimbas","Parque Nacional do Arquipélago do Bazaruto",
  "Tofo","Barra (praia)","Ponta do Ouro","Bilene","Macaneta","Costa do Sol","Praia da Costa do Sol","Praia do Wimbe","Praia de Nacala","Praia de Pemba",
  "Quissico","Ponta Malongane","Reserva Marinha Parcial da Ponta do Ouro",

  "Oceano Índico","Rio Zambeze","Rio Limpopo","Rio Save","Rio Rovuma","Rio Púnguè","Rio Incomáti","Rio Buzi",
  "Lago Niassa","Lago Chilwa",
  "Parque Nacional da Gorongosa","Parque Nacional do Limpopo","Parque Nacional do Zinave","Parque Nacional de Banhine",
  "Reserva do Niassa","Reserva Especial de Maputo","Reserva de Marromeu",

  "Baixa de Maputo","Estação Central de Maputo","Fortaleza de Maputo","Catedral de Maputo","Mercado Central de Maputo",
  "Mercado do Xipamanine","Mercado do Peixe","FEIMA","Feira Popular","Centro Cultural Franco-Moçambicano","Casa de Ferro","Museu de História Natural","Museu da Revolução",
  "Praça da Independência","Praça dos Heróis","Jardim Tunduru","Ponta Vermelha","Polana","Mafalala","Alto-Maé","Maxaquene","Zimpeto","Costa do Sol (bairro)",

  "Japão","Paris","Londres","Nova Iorque","Roma",
  "Madrid","Lisboa","Pequim","Tóquio","Dubai",
  "Rio de Janeiro","Pizza","Hambúrguer","Sushi","Chocolate",
  "Café","Chá","Gelado","Coca-Cola","McDonald's",
  "KFC","Batata Frita","Cachorro-Quente","Sanduíche","Arroz",
  "Massa","Frango","Carne","Peixe","Bolo",
  "Doce","Refrigerante","Água","Sumo","Leite",
  "Filme","Cinema","Série","Televisão","Rádio",
  "Música","Concerto","Festival","Teatro","Fotografia",
  "Hollywood","Oscar","Grammy","Globo de Ouro","Cannes",
  "Tapete Vermelho","Estrela de Cinema","Cantor","Atriz","Ator",
  "Escultura","Livro","Biblioteca","Jornal","Notícia"
];

// =====================
// HELPERS
// =====================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cleanNames(arr) {
  return (arr || [])
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .slice(0, MAX_NAMES);
}
export default function ThirtySeconds({ onBack }) {
  // view: setup -> play
  const [view, setView] = useState("setup");
  const [category, setCategory] = useState("GLOBAL");

  // nomes (até 6)
  const [teamANames, setTeamANames] = useState(Array(MAX_NAMES).fill(""));
  const [teamBNames, setTeamBNames] = useState(Array(MAX_NAMES).fill(""));

  // ===== Overlay Nomes =====
  const [showNamesOverlay, setShowNamesOverlay] = useState(false);
  const [draftA, setDraftA] = useState(Array(MAX_NAMES).fill(""));
  const [draftB, setDraftB] = useState(Array(MAX_NAMES).fill(""));

  const hasAnyNames = useMemo(() => {
    return teamANames.some((n) => n.trim()) || teamBNames.some((n) => n.trim());
  }, [teamANames, teamBNames]);

  function openNamesOverlay() {
    setDraftA([...teamANames]);
    setDraftB([...teamBNames]);
    setShowNamesOverlay(true);
  }
  function saveNamesOverlay() {
    setTeamANames([...draftA]);
    setTeamBNames([...draftB]);
    setShowNamesOverlay(false);
  }
  function cancelNamesOverlay() {
    setShowNamesOverlay(false);
  }

  const cleanA = useMemo(() => cleanNames(teamANames), [teamANames]);
  const cleanB = useMemo(() => cleanNames(teamBNames), [teamBNames]);

  const items = useMemo(
    () => (category === "MZ" ? ITEMS_MZ : ITEMS_GLOBAL),
    [category]
  );

  // -----------------
  // AUDIO (warmup)
  // -----------------
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
      o.type = "sine";
      o.frequency.value = 1;
      g.gain.value = 0.00001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => o.stop(), 60);
    } catch {}
  }

  function beep(freq = 880, ms = 140, vol = 0.18) {
    try {
      const ctx = ensureAudio();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => o.stop(), ms);
    } catch {}
  }

  // -----------------
  // DECK sem repetição
  // -----------------
  const deckRef = useRef([]);
  const deckPosRef = useRef(0);

  const [card, setCard] = useState([]);
  const [checked, setChecked] = useState([false, false, false, false]);
  const [history, setHistory] = useState([]);

  function resetDeck() {
    deckRef.current = shuffle(items);
    deckPosRef.current = 0;
  }

  function drawCard() {
    const start = deckPosRef.current;
    const end = start + CARD_SIZE;

    if (end > deckRef.current.length) {
      alert("Acabou o baralho desta categoria! (mete mais itens 🙂)");
      return null;
    }

    const next = deckRef.current.slice(start, end);
    deckPosRef.current = end;
    return next;
  }

  function setNewCard() {
    const next = drawCard();
    if (!next) return;
    setCard(next);
    setChecked([false, false, false, false]);
    setHistory([]);
  }

  function loadNextCard() {
    setNewCard();
  }

  // -----------------
  // JOGO
  // -----------------
  const [team, setTeam] = useState("A");
  const teamRef = useRef("A");
  useEffect(() => {
    teamRef.current = team;
  }, [team]);

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winner, setWinner] = useState(null);

  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(0);

  const [swapsLeft, setSwapsLeft] = useState(SWAPS_PER_ROUND);
  const [paused, setPaused] = useState(false);
  const [passUsed, setPassUsed] = useState(false);

  // phases: "transition" | "ready" | "play"
  const [phase, setPhase] = useState("ready");
  const [transitionLeft, setTransitionLeft] = useState(TRANSITION_SECONDS);
  const [readyLeft, setReadyLeft] = useState(READY_SECONDS);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  function currentPlayerName() {
    const list = teamRef.current === "A" ? cleanA : cleanB;
    const idx = teamRef.current === "A" ? idxA : idxB;
    return list.length ? list[idx % list.length] : null;
  }

  function checkWinner(nextA, nextB) {
    if (nextA >= WIN_SCORE) setWinner("A");
    if (nextB >= WIN_SCORE) setWinner("B");
  }

  function initGame() {
    resetDeck();
    setNewCard();

    setTeam("A");
    setScoreA(0);
    setScoreB(0);
    setWinner(null);

    setIdxA(0);
    setIdxB(0);

    setSwapsLeft(SWAPS_PER_ROUND);
    setPaused(false);
    setPassUsed(false);

    // ✅ começa com transition
    setPhase("transition");
    setTransitionLeft(TRANSITION_SECONDS);
    setReadyLeft(READY_SECONDS);
    setTimeLeft(ROUND_SECONDS);
  }

  function startNewTurn(nextTeam) {
    setTeam(nextTeam);

    if (nextTeam === "A") setIdxA((x) => x + 1);
    else setIdxB((x) => x + 1);

    setSwapsLeft(SWAPS_PER_ROUND);
    setPaused(false);
    setPassUsed(false);

    loadNextCard();

    // ✅ 6s transition antes do countdown
    setPhase("transition");
    setTransitionLeft(TRANSITION_SECONDS);

    // prepara o que vem a seguir
    setReadyLeft(READY_SECONDS);
    setTimeLeft(ROUND_SECONDS);
  }

  function endRoundAuto() {
    if (winner) return;
    const cur = teamRef.current;
    const nextTeam = cur === "A" ? "B" : "A";
    beep(520, 160, 0.2);
    startNewTurn(nextTeam);
  }

  function addPoint() {
    const cur = teamRef.current;
    if (cur === "A") {
      setScoreA((s) => {
        const n = s + 1;
        checkWinner(n, scoreB);
        return n;
      });
    } else {
      setScoreB((s) => {
        const n = s + 1;
        checkWinner(scoreA, n);
        return n;
      });
    }
  }

  function onToggleItem(i) {
    if (winner) return;
    if (phase !== "play") return;
    if (paused) return;
    if (timeLeft <= 0) return;
    if (checked[i]) return;

    const nextChecked = [...checked];
    nextChecked[i] = true;
    setChecked(nextChecked);
    setHistory((h) => [...h, i]);

    beep(980, 90, 0.18);
    addPoint();

    if (nextChecked.every(Boolean)) loadNextCard();
  }

  function undoLast() {
    if (winner) return;
    if (phase !== "play") return;

    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];

      setChecked((c) => {
        const nc = [...c];
        nc[last] = false;
        return nc;
      });

      const cur = teamRef.current;
      if (cur === "A") setScoreA((s) => Math.max(0, s - 1));
      else setScoreB((s) => Math.max(0, s - 1));

      beep(420, 110, 0.15);
      return h.slice(0, -1);
    });
  }

  function swapCard() {
    if (winner) return;
    if (phase !== "play") return;
    if (paused) return;
    if (swapsLeft <= 0) return;

    setSwapsLeft((x) => x - 1);
    loadNextCard();
    beep(700, 120, 0.14);
  }

  // ✅ pausa manual (toggle)
  function pause10s() {
    if (winner) return;
    if (phase !== "play") return;
    setPaused((p) => !p);
    beep(220, 260, 0.25);
  }

  function passTurnNow() {
    if (winner) return;
    if (phase !== "play") return;
    if (paused) return;
    if (passUsed) return;

    setPassUsed(true);
    beep(360, 180, 0.22);
    endRoundAuto();
  }

  function restartGame() {
    initGame();
  }

  function onStartFromSetup() {
    warmupAudio();
    beep(880, 140, 0.18);
    initGame();
    setView("play");
  }

  // -----------------
  // TIMERS (transition -> ready -> play)
  // -----------------
  useEffect(() => {
    if (view !== "play") return;
    if (winner) return;
    if (phase !== "transition") return;
    if (paused) return;

    const id = setInterval(() => {
      setTransitionLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("ready");
          setReadyLeft(READY_SECONDS);
          return TRANSITION_SECONDS;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [view, winner, phase, paused]);

  useEffect(() => {
    if (view !== "play") return;
    if (winner) return;
    if (phase !== "ready") return;
    if (paused) return;

    const id = setInterval(() => {
      setReadyLeft((r) => {
        if (r <= 1) {
          clearInterval(id);
          setPhase("play");
          setTimeLeft(ROUND_SECONDS);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [view, winner, phase, paused]);

  useEffect(() => {
    if (view !== "play") return;
    if (winner) return;
    if (phase !== "play") return;
    if (paused) return;

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          endRoundAuto();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [view, winner, phase, paused]);

  const player = currentPlayerName();

  // -----------------
  // UI: SETUP
  // -----------------
  if (view === "setup") {
    return (
      <div className="setupScreen">
        <div className="setupShell">
          <header className="setupHeader">
            <div className="setupTitle">⏱️ 30 Segundos</div>
            <div className="setupSub">
              Escolhe categoria e escreve os nomes (opcional)
            </div>
          </header>

          <main className="setupBody">
            <section className="setupCard">
              <div className="setupSectionTitle">Categoria</div>

              <div className="catGrid2">
                <button
                  type="button"
                  className={`segBtn ${category === "GLOBAL" ? "on" : ""}`}
                  onClick={() => setCategory("GLOBAL")}
                >
                  🌍 Global
                </button>
                <button
                  type="button"
                  className={`segBtn ${category === "MZ" ? "on" : ""}`}
                  onClick={() => setCategory("MZ")}
                >
                  🇲🇿 CulturaGeral_MZ
                </button>
              </div>

              <button
                className="btnGhost"
                style={{ width: "100%", marginTop: 14 }}
                type="button"
                onClick={openNamesOverlay}
              >
                👥 {hasAnyNames ? "Editar nomes (opcional)" : "Adicionar nomes (opcional)"}
              </button>
            </section>

            <div className="setupBottomSpacer" />
          </main>

          <footer className="setupFooter">
            <button
              className="btnGhost setupFooterBtn"
              type="button"
              onClick={onBack}
            >
              ← Menu
            </button>

            <button
              className="btnPrimary setupFooterBtn"
              type="button"
              onClick={onStartFromSetup}
            >
              ▶️ Começar
            </button>
          </footer>
        </div>

        {showNamesOverlay &&
          typeof document !== "undefined" &&
          createPortal(
            <div className="modalOverlay" onClick={cancelNamesOverlay}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHeader">
                  <div className="modalTitle">Nomes (opcional)</div>
                  <div className="modalHint">Até {MAX_NAMES} por equipa</div>
                </div>

                <div className="modalContent">
                  <div className="namesGrid2">
                    <div>
                      <div className="namesColTitle">Equipa A</div>
                      {draftA.map((val, i) => (
                        <input
                          key={`da-${i}`}
                          className="niceInput"
                          placeholder={`Jogador A${i + 1}`}
                          value={val}
                          onChange={(e) => {
                            const copy = [...draftA];
                            copy[i] = e.target.value;
                            setDraftA(copy);
                          }}
                        />
                      ))}
                    </div>

                    <div>
                      <div className="namesColTitle">Equipa B</div>
                      {draftB.map((val, i) => (
                        <input
                          key={`db-${i}`}
                          className="niceInput"
                          placeholder={`Jogador B${i + 1}`}
                          value={val}
                          onChange={(e) => {
                            const copy = [...draftB];
                            copy[i] = e.target.value;
                            setDraftB(copy);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modalActions">
                  <button className="btnGhost" type="button" onClick={cancelNamesOverlay}>
                    Cancelar
                  </button>
                  <button className="btnPrimary" type="button" onClick={saveNamesOverlay}>
                    Guardar
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }

  // -----------------
  // UI: PLAY
  // -----------------
  return (
    <div className="appBg">
      <div className="shell shellGame">
        <header className="gameHeader">
          <button className="btnGhost" onClick={onBack} type="button">
            ← Menu
          </button>

          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">30 Segundos</div>
          </div>

          <div className="timerPill">
            {phase === "transition"
              ? ""
              : phase === "ready"
              ? `⏳ ${readyLeft}s`
              : `⏱️ ${timeLeft}s`}
          </div>
        </header>

        <main className="gameMain">
          <section className="scoreRow">
            <div className={`scoreBox ${team === "A" ? "active" : "inactive"}`}>
              <div className="scoreLabel">Equipa A</div>
              <div className="scoreNum">{scoreA}</div>
            </div>

            <div className={`scoreBox ${team === "B" ? "active" : "inactive"}`}>
              <div className="scoreLabel">Equipa B</div>
              <div className="scoreNum">{scoreB}</div>
            </div>
          </section>

          <section className="turnRow">
            <div className="turnText">
              {winner ? (
                <>🏆 Vencedor: Equipa {winner}</>
              ) : (
                <>
                  Vez da Equipa <b>{team}</b>
                  {player ? (
                    <span className="muted"> — {player} está a explicar</span>
                  ) : null}
                </>
              )}
            </div>
            <div className="winRule">Vitória: {WIN_SCORE} pts</div>
          </section>

          {winner ? (
            <section className="winCard">
              <div className="winTitle">Jogo terminou 🎉</div>
              <div className="winSub">
                Primeiro a chegar a {WIN_SCORE} pontos
              </div>
              <button className="btnPrimary" onClick={restartGame} type="button">
                🔁 Reiniciar
              </button>
            </section>
          ) : null}

          <section
            className={`card ${paused ? "paused" : ""} ${
              phase === "ready" ? "isReady" : ""
            }`}
          >
            <div className="cardTop">
              <div className="cardTitle">Carta</div>
              <div className="cardHint">
                {phase === "transition"
                  ? ""
                  : phase === "ready"
                  ? "Pronto…"
                  : "Toca nos itens certos"}
              </div>
            </div>

            {(phase === "transition" || phase === "ready") && !winner ? (
              <div className="cardReadyOverlay" aria-live="polite">
                <div className="readyPill">
                  {phase === "transition" ? (
                    <>
                      <div className="readyTitle">Agora joga: Equipa {team}</div>
                      <div className="readyCount">
                        Jogador atual: {player || "—"}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="readyTitle">Pronto…</div>
                      <div className="readyCount">{readyLeft}</div>
                      <div className="readySub">Não espreitem 😉</div>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {paused && phase === "play" && !winner ? (
              <div className="cardReadyOverlay" aria-live="polite">
                <div className="readyPill">
                  <div className="readyTitle">Pausado</div>
                  <div className="readyCount">Tempo congelado</div>
                  <div className="readySub">Carrega em Pausa para voltar</div>
                </div>
              </div>
            ) : null}

            {paused && phase === "play" ? null : (
              <div className="itemsList">
                {card.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onToggleItem(i)}
                    disabled={
                      winner ||
                      phase !== "play" ||
                      paused ||
                      timeLeft <= 0 ||
                      checked[i]
                    }
                    className={`itemBtn ${checked[i] ? "done" : ""}`}
                    type="button"
                  >
                    <span className="tick">{checked[i] ? "✅" : "☐"}</span>
                    <span className="itemText">{item}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <footer className="actionDock">
            <button
              className="btnSoft dockFull"
              onClick={undoLast}
              disabled={winner || phase !== "play" || history.length === 0}
              type="button"
            >
              ↩️ Desfazer último ponto
            </button>

            <button
              className="btnSoft dockFull"
              onClick={swapCard}
              disabled={winner || phase !== "play" || paused || swapsLeft <= 0}
              type="button"
            >
              🔄 Trocar carta ({swapsLeft}/{SWAPS_PER_ROUND})
            </button>

            <button
              className="btnSoft dockFull"
              onClick={passTurnNow}
              disabled={winner || phase !== "play" || paused || passUsed}
              type="button"
            >
              ⏭️ Passar a vez {passUsed ? "(usado)" : ""}
            </button>

            <div className="dock2">
              <button
                className="btnSoft"
                onClick={pause10s}
                disabled={winner || phase !== "play"}
                type="button"
              >
                ⏸️ Pausa
              </button>

              <button className="btnDanger" onClick={restartGame} type="button">
                🔁 Reiniciar
              </button>
            </div>

            <div className="footNoteDock">
              Round muda automaticamente • {READY_SECONDS}s de preparação
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}