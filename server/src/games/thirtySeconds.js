import { BaseEngine } from "./baseEngine.js";

const READY_SECONDS = 3;
const TURN_SECONDS = 30;
const CARD_SIZE = 4;
const WIN_SCORE = 30;

const SWAPS_PER_TURN = 2;

// =====================
// ITENS (do offline)
// =====================
const ITEMS_GLOBAL = [
  "Michael Jackson","Elvis Presley","Madonna","The Beatles","Bob Marley","YHWH",
  "Beyoncé","Rihanna","Taylor Swift","Drake","Kendick Lamar","Eminem","Getsemani",
  "Tupac Shakur","Jay-Z","Kanye West","Adele","Bruno Mars",
  "Lady Gaga","Justin Bieber","The Weeknd","Sia","Shakira",
  "Bad Bunny","Karol G","Ed Sheeran","Billie Eilish","Coldplay",
  "U2","Queen","Freddie Mercury","ABBA","Celine Dion","Chris brown",
  "Maluma","J Balvin","Anitta","Ozuna","Daddy Issues","Pitbull rapper",
  "Nicki Minaj","Cardi B","Miley Cyrus","Selena Gomez","Ariana Grande","Halsey","Tory lanez",
  "Lana Del Rey","Maroon 5","Linkin Park","Red Hot Chili Peppers","Foo Fighters","Metallica",
  "Cristiano Ronaldo","Lionel Messi","Pelé","Diego Maradona","Usain Bolt",
  "Michael Jordan","LeBron James","Serena Williams","Muhammad Ali","Mike Tyson","Jon Jones",
  "Neymar","Kylian Mbappé","Zinedine Zidane","Ronaldinho","Ronaldo Fenómeno","Israel Adesanya","Alex pereira",
  "Lewis Hamilton","Max Verstappen","Ayrton Senna","Roger Federer","Rafael Nadal","Conor McGregor",
  "Novak Djokovic","Simone Biles","Tiger Woods","Tom Brady","Kobe Bryant","Erling Haaland",
  "Kevin De Bruyne","Virgil van Dijk","Antoine Griezmann","Harry Kane","Sergio Ramos",
  "David Beckham","Wayne Rooney","Paul Pogba","Gareth Bale","Thierry Henry","Didier Drogba","Kaká","Roberto Carlos",
  "Nelson Mandela","Barack Obama","Martin Luther King Jr.","Che Guevara",
  "Napoleão Bonaparte","Cleópatra","Júlio César","Alexandre o Grande",
  "Gengis Khan","Winston Churchill","Franklin D. Roosevelt","Mahatma Gandhi",
  "Abraham Lincoln","Angela Merkel","Rainha Elizabeth II",
  "Star Wars","Matrix","Titanic",
  "Avatar","Jurassic Park","Vingadores end-game","Homem-Aranha 2","Batman",
  "Superman","Pantera Negra","Toy Story","Rei Leão","Frozen",
  "Velozes e Furiosos","Missão Impossível","Homem de Ferro",
  "Capitão América","Thor","Hulk","Mulher-Maravilha",
  "Joker","Deadpool","James Bond","Indiana Jones","Piratas das Caraíbas",
  "Shrek","Minions","Stranger Things","Crepúsculo","Jogos Vorazes","Divergente",
  "Avatar 2","O Senhor das Armas","O Aviador","O Náufrago","Coringa","Duna","Blade Runner",
  "Clube dos Cinco","Curtindo a Vida Adoidado","Efeito Borboleta","Ilha do Medo",
  "O Pianista","A Vida é Bela","O Grande Truque","Cães de Aluguel","Os Infiltrados",
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
  "Livro","Biblioteca","Jornal","Notícia",
  "Vaticano","Casa Branca","Pentágono","Wall Street","Vale do Silício","Las Vegas","Cancún","Ibiza","Mykonos",
  "Mônaco","Las Ramblas","Porto de Santos","Canal do Panamá","Canal de Suez","Deserto do Saara",
  "Floresta Amazónica","Triângulo das Bermudas","Ilhas Maldivas","Monte Fuji","Grand Canyon",
  "Black Friday","Cyber Monday","Super Bowl ","Eurovisão","Rock in Rio","Coachella","Tomorrowland",
  "Met Gala","Fashion Week","Tapete Vermelho","Oscar de Melhor Filme","Bola de Ouro","Prêmio Nobel",
  "Grammy Latino","Billboard Hot 100","Forbes","Guinness Book","Miss Universo","Reality Show","Big Brother",
  "Charles Chaplin","Al Pacino","Anthony Hopkins","Robert De Niro","Clint Eastwood","Morgan Freeman","Heath Ledger","Joaquin Phoenix","Keanu Reeves","Harrison Ford",
  "Alfred Hitchcock","Quentin Tarantino","Steven Spielberg","Martin Scorsese","Christopher Nolan","Stanley Kubrick","James Cameron","Tim Burton","Ridley Scott","Francis Ford Coppola",
  "Margaret Thatcher","Napoleão III","Otto von Bismarck","Nicolau II","Augusto Pinochet","Mikhail Gorbachev","Kim Jong-un","Xi Jinping","Emmanuel Macron","Volodymyr Zelensky",
  "Usain Bolt 2008","Milagre de Istambul","Mão de Deus","Zidane 2006","7 a 1 Brasil Alemanha","Dream Team 1992","Tyson Holyfield","Rumble in the Jungle","Final NBA 2016",
  "Woodstock","Chernobyl","Queda do Muro de Berlim","Revolução Francesa","Crise de 2008","Pandemia Covid-19","Ataques de 11 de Setembro","Primavera Árabe","Guerra Fria","Corrida Espacial",
  "Orson Welles","Marlon Brando","Jack Nicholson","Daniel Day-Lewis","Denzel Washington","Gary Oldman","Christian Bale","Brad Pitt","Leonardo DiCaprio","Tom Hanks",
  "Taxi Driver","Laranja Mecânica","2001: Odisseia no Espaço","Apocalypse Now","O Iluminado","Os Bons Companheiros","Scarface","Donnie Brasco","O Resgate do Soldado Ryan","O Silêncio dos Inocentes",
  "Watergate","Caso Snowden","WikiLeaks","Panama Papers","Plano Marshall","Tratado de Versalhes","Queda da Bolsa de 1929","Guerra do Vietname",
  "Michael Jackson ","Beatles Abbey Road","Woodstock 1969","Live Aid","MTV anos 90","Britney Spears","Amy Winehouse","Nirvana Unplugged","Freddie Mercury",
];

const ITEMS_MZ = [
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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randInt(n) {
  return Math.floor(Math.random() * n);
}
function normalizeCategory(cat) {
  const c = String(cat || "").toUpperCase().trim();
  return c === "MZ" ? "MZ" : "GLOBAL";
}

export class ThirtySecondsEngine extends BaseEngine {
  constructor({ io, roomCode, room }) {
    super({ io, roomCode, room });

    const initialCategory = normalizeCategory(room?.settings?.category || "GLOBAL");

    this.state = {
      phase: "lobby",
      turnPhase: "ready",
      round: 0,

      winnerTeam: null,

      currentTeam: null,
      currentPlayerId: null,

      transferUsed: false,
      lastExplainerId: null,

      endsAt: null,

      paused: false,
      pausedRemainingMs: 0,

      category: initialCategory,

      card: null,
      deck: shuffle(this.getWords(initialCategory)),

      scores: { A: 0, B: 0 },

      passLeft: SWAPS_PER_TURN,

      cardHistory: [],
    };
  }

  players() {
    return [...this.room.players.values()];
  }
  playersByTeam(team) {
    return this.players().filter((p) => (p.team || "A") === team);
  }
  currentPlayer() {
    if (!this.state.currentPlayerId) return null;
    return this.room.players.get(this.state.currentPlayerId) || null;
  }
  otherTeam(team) {
    return team === "A" ? "B" : "A";
  }

  getWords(category) {
    return normalizeCategory(category) === "MZ" ? ITEMS_MZ : ITEMS_GLOBAL;
  }

  resetDeck(category) {
    const cat = normalizeCategory(category);
    this.state.category = cat;
    if (!this.room.settings) this.room.settings = {};
    this.room.settings.category = cat;

    this.state.deck = shuffle(this.getWords(cat));
    this.state.card = null;
    this.state.cardHistory = [];
  }

  setCategory(socketId, category) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "lobby") return this.emitError(socketId, "NOT_IN_LOBBY");

    const cat = normalizeCategory(category);
    this.resetDeck(cat);

    this.emitEvent({ type: "CATEGORY_SET", by: socketId, category: cat });
    this.emitState();
  }

  ensureDeck() {
    if (this.state.deck.length < CARD_SIZE) {
      this.state.deck = shuffle(this.getWords(this.state.category));
    }
  }

  drawCard() {
    this.ensureDeck();
    const items = this.state.deck.splice(0, CARD_SIZE);

    this.state.card = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      items,
      checked: Array(CARD_SIZE).fill(false),
    };

    this.state.cardHistory = [];
  }

  pickRandomStartingTeam() {
    const hasA = this.playersByTeam("A").length > 0;
    const hasB = this.playersByTeam("B").length > 0;

    if (hasA && hasB) return Math.random() < 0.5 ? "A" : "B";
    if (hasA) return "A";
    if (hasB) return "B";
    return null;
  }

  pickRandomPlayerFromTeam(team) {
    const list = this.playersByTeam(team);
    if (!list.length) return null;
    return list[randInt(list.length)];
  }

  startPlayTimers(remainingMs) {
    const ms = Math.max(0, remainingMs);

    this.state.turnPhase = "play";
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.state.endsAt = Date.now() + ms;

    this.emitEvent({
      type: "TURN_STARTED",
      team: this.state.currentTeam,
      by: this.state.currentPlayerId,
      cardId: this.state.card?.id ?? null,
    });

    this._setInterval(() => this.emitState(), 300);
    this._setTimeout(() => this.endTurn("TIME_UP"), ms);

    this.emitState();
  }

  pauseTurn(socketId) {
    const cur = this.currentPlayer();
    if (!cur) return;

    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
    if (this.state.paused) return;

    const remaining = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;

    this.clearTimers();
    this.state.paused = true;
    this.state.pausedRemainingMs = remaining;
    this.state.endsAt = null;

    this.emitEvent({ type: "PAUSED", by: socketId, remainingMs: remaining });
    this.emitState();
  }

  resumeTurn(socketId) {
    const cur = this.currentPlayer();
    if (!cur) return;

    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
    if (!this.state.paused) return;

    const remaining = Math.max(0, this.state.pausedRemainingMs || 0);

    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.emitEvent({ type: "RESUMED", by: socketId, remainingMs: remaining });

    this.clearTimers();
    this.state.endsAt = Date.now() + remaining;
    this._setInterval(() => this.emitState(), 300);
    this._setTimeout(() => this.endTurn("TIME_UP"), remaining);

    this.emitState();
  }

  startGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");

    if (this.state.phase !== "lobby") return this.emitError(socketId, "GAME_ALREADY_STARTED");
    if (this.players().length < 2) return this.emitError(socketId, "NOT_ENOUGH_PLAYERS");

    const startTeam = this.pickRandomStartingTeam();
    if (!startTeam) return this.emitError(socketId, "NO_TEAMS");

    const cat = normalizeCategory(this.room?.settings?.category || this.state.category || "GLOBAL");
    this.resetDeck(cat);

    this.state.phase = "playing";
    this.state.turnPhase = "ready";
    this.state.round = 1;

    this.state.winnerTeam = null;
    this.state.scores = { A: 0, B: 0 };

    this.state.currentTeam = startTeam;

    this.emitEvent({ type: "GAME_STARTED", by: socketId, startingTeam: startTeam, category: cat });

    this.startTurn();
  }

  startTurn() {
    if (this.state.phase !== "playing") return;

    this.clearTimers();

    this.state.transferUsed = false;
    this.state.passLeft = SWAPS_PER_TURN;

    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    let explainer = this.pickRandomPlayerFromTeam(this.state.currentTeam);

    if (!explainer) {
      const other = this.otherTeam(this.state.currentTeam);
      explainer = this.pickRandomPlayerFromTeam(other);
      if (!explainer) {
        this.state.phase = "lobby";
        this.state.turnPhase = "ready";
        this.state.currentTeam = null;
        this.state.currentPlayerId = null;
        this.state.card = null;
        this.state.endsAt = null;
        this.emitState();
        return;
      }
      this.state.currentTeam = other;
    }

    this.state.currentPlayerId = explainer.id;

    this.drawCard();

    // READY
    this.state.turnPhase = "ready";
    this.state.endsAt = Date.now() + READY_SECONDS * 1000;

    this.emitEvent({
      type: "TURN_READY",
      team: this.state.currentTeam,
      by: this.state.currentPlayerId,
      cardId: this.state.card?.id ?? null,
    });

    // ✅ FIX: emitir state durante READY para o countdown descer 3..2..1
    this._setInterval(() => this.emitState(), 250);

    this.emitState();

    this._setTimeout(() => {
      if (this.state.phase !== "playing") return;

      // ✅ importante: limpar timers do READY antes de iniciar PLAY
      this.clearTimers();

      this.startPlayTimers(TURN_SECONDS * 1000);
    }, READY_SECONDS * 1000);
  }

  endTurn(reason) {
    if (this.state.phase !== "playing") return;

    this.clearTimers();

    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.emitEvent({
      type: "TURN_ENDED",
      reason,
      team: this.state.currentTeam,
      by: this.state.currentPlayerId,
    });

    if (this.state.currentTeam) this.state.currentTeam = this.otherTeam(this.state.currentTeam);

    this.state.round = (this.state.round || 0) + 1;

    if (this.players().length >= 2) {
      this.startTurn();
    } else {
      this.state.phase = "lobby";
      this.state.turnPhase = "ready";
      this.state.currentTeam = null;
      this.state.currentPlayerId = null;
      this.state.card = null;
      this.state.endsAt = null;
      this.emitState();
    }
  }

  restartGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "finished") return this.emitError(socketId, "NOT_FINISHED");

    this.clearTimers();

    const cat = normalizeCategory(this.room?.settings?.category || this.state.category || "GLOBAL");

    this.state.phase = "lobby";
    this.state.turnPhase = "ready";
    this.state.round = 0;

    this.state.winnerTeam = null;

    this.state.currentTeam = null;
    this.state.currentPlayerId = null;

    this.state.transferUsed = false;
    this.state.lastExplainerId = null;

    this.state.endsAt = null;

    this.state.paused = false;
    this.state.pausedRemainingMs = 0;

    this.state.scores = { A: 0, B: 0 };
    this.state.passLeft = SWAPS_PER_TURN;

    this.resetDeck(cat);

    this.emitEvent({ type: "GAME_RESTARTED", by: socketId, category: cat });
    this.emitState();
  }

  handleCommand(socketId, command) {
    const cur = this.currentPlayer();
    if (!cur) return;

    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");

    const type = command?.type;

    if (type === "PAUSE_TOGGLE") {
      if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
      if (this.state.paused) this.resumeTurn(socketId);
      else this.pauseTurn(socketId);
      return;
    }

    if (this.state.paused) return this.emitError(socketId, "PAUSED");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");

    if (type === "CORRECT_ITEM") {
      const index = Number(command?.index);
      if (!Number.isInteger(index) || index < 0 || index >= CARD_SIZE) {
        return this.emitError(socketId, "BAD_INDEX");
      }
      if (!this.state.card) return this.emitError(socketId, "NO_CARD");
      if (this.state.card.checked[index]) return;

      const team = this.state.currentTeam || cur.team || "A";

      this.state.card.checked[index] = true;
      this.state.scores[team] = (this.state.scores[team] || 0) + 1;
      this.state.cardHistory.push(index);

      this.emitEvent({
        type: "CORRECT_ITEM",
        by: socketId,
        team,
        index,
        score: this.state.scores[team],
        cardId: this.state.card.id,
      });

      if (this.state.scores[team] >= WIN_SCORE) {
        this.state.winnerTeam = team;
        this.state.phase = "finished";
        this.state.turnPhase = "ready";
        this.state.endsAt = null;

        this.state.paused = false;
        this.state.pausedRemainingMs = 0;

        this.clearTimers();

        this.emitEvent({ type: "GAME_FINISHED", winnerTeam: team, winScore: WIN_SCORE });
        this.emitState();
        return;
      }

      if (this.state.card.checked.every(Boolean)) {
        this.drawCard();
      }

      this.emitState();
      return;
    }

    if (type === "UNDO") {
      if (!this.state.card) return this.emitError(socketId, "NO_CARD");
      if (!this.state.cardHistory.length) return this.emitError(socketId, "NO_UNDO");

      const lastIndex = this.state.cardHistory.pop();
      if (!Number.isInteger(lastIndex)) return this.emitError(socketId, "BAD_UNDO");

      if (this.state.card.checked[lastIndex]) {
        this.state.card.checked[lastIndex] = false;

        const team = this.state.currentTeam || cur.team || "A";
        this.state.scores[team] = Math.max(0, (this.state.scores[team] || 0) - 1);

        this.emitEvent({
          type: "UNDO",
          by: socketId,
          team,
          index: lastIndex,
          score: this.state.scores[team],
          cardId: this.state.card.id,
        });

        this.emitState();
        return;
      }

      this.emitState();
      return;
    }

    if (type === "PASS") {
      if (this.state.passLeft <= 0) return this.emitError(socketId, "NO_PASSES_LEFT");
      this.state.passLeft -= 1;

      this.emitEvent({ type: "PASS", by: socketId, left: this.state.passLeft });

      this.drawCard();
      this.emitState();
      return;
    }

    if (type === "PASS_TO_TEAMMATE") {
      if (this.state.transferUsed) return this.emitError(socketId, "TRANSFER_ALREADY_USED");

      const team = this.state.currentTeam || cur.team || "A";
      const matesAll = this.playersByTeam(team).filter((p) => p.id !== cur.id);

      if (!matesAll.length) return this.emitError(socketId, "NO_TEAMMATE_AVAILABLE");

      let mates = matesAll;
      if (this.state.lastExplainerId) {
        const filtered = matesAll.filter((p) => p.id !== this.state.lastExplainerId);
        if (filtered.length > 0) mates = filtered;
      }

      const next = mates[randInt(mates.length)];

      this.state.lastExplainerId = cur.id;
      this.state.currentPlayerId = next.id;
      this.state.transferUsed = true;

      this.emitEvent({ type: "PASSED_TO_TEAMMATE", from: cur.id, to: next.id, team });

      this.emitState();
      return;
    }

    if (type === "END_TURN") {
      this.endTurn("MANUAL_END");
      return;
    }

    return this.emitError(socketId, "UNKNOWN_COMMAND");
  }

  getPublicState() {
    const cur = this.currentPlayer();

    let remainingMs = 0;
    if (this.state.paused) {
      remainingMs = Math.max(0, this.state.pausedRemainingMs || 0);
    } else {
      remainingMs = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;
    }

    return {
      gameType: "thirtySeconds",
      phase: this.state.phase,
      turnPhase: this.state.turnPhase,
      round: this.state.round,

      winnerTeam: this.state.winnerTeam,
      winScore: WIN_SCORE,

      category: this.state.category,

      currentTeam: this.state.currentTeam,
      currentPlayer: cur ? { id: cur.id, name: cur.name, team: cur.team } : null,

      paused: this.state.paused,

      remainingMs,
      scores: this.state.scores,

      passLeft: this.state.passLeft,
      swapsPerTurn: SWAPS_PER_TURN,

      transferUsed: this.state.transferUsed,

      card: this.state.card ? { id: this.state.card.id } : null,
    };
  }

  getPrivateState(playerId) {
    const me = this.room.players.get(playerId);
    const cur = this.currentPlayer();

    if (!me || !cur) return { canAct: false, role: "NONE", card: null };

    const isExplainer = playerId === cur.id;

    const canSeeCard =
      this.state.phase === "playing" &&
      this.state.card &&
      (isExplainer || (me.team && cur.team && me.team !== cur.team));

    return {
      role: isExplainer ? "EXPLAINER" : "OTHER",
      canAct:
        isExplainer &&
        this.state.phase === "playing" &&
        this.state.turnPhase === "play" &&
        !this.state.paused,

      team: me.team ?? null,

      canUndo:
        isExplainer &&
        this.state.phase === "playing" &&
        this.state.turnPhase === "play" &&
        !this.state.paused,

      undoCount: this.state.cardHistory?.length ?? 0,

      card: canSeeCard
        ? this.state.card
        : this.state.card
          ? { id: this.state.card.id }
          : null,
    };
  }

  onPlayerLeave(player) {
    const cur = this.currentPlayer();

    if (this.state.phase === "playing" && cur && player?.id === cur.id) {
      this.endTurn("EXPLAINER_LEFT");
      return;
    }

    this.emitState();
  }
}