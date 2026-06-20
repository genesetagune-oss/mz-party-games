import { BaseEngine } from "./baseEngine.js";

const SECS_PER_Q  = 12;
const REVEAL_SECS = 3;
const TOTAL_Q     = 5;

const BANK = [
  { q: "Em que ano Moçambique se tornou independente?", opts: ["1973","1974","1975","1976"], ans: 2 },
  { q: "Quem foi o primeiro presidente de Moçambique?", opts: ["Eduardo Mondlane","Joaquim Chissano","Samora Machel","Armando Guebuza"], ans: 2 },
  { q: "Qual é o dia da Independência de Moçambique?", opts: ["4 de Outubro","25 de Junho","7 de Setembro","3 de Fevereiro"], ans: 1 },
  { q: "Em que ano foi assinado o Acordo Geral de Paz em Moçambique?", opts: ["1990","1991","1992","1993"], ans: 2 },
  { q: "Quem fundou a FRELIMO?", opts: ["Samora Machel","Joaquim Chissano","Afonso Dhlakama","Eduardo Mondlane"], ans: 3 },
  { q: "Quem liderou a RENAMO durante mais de 30 anos?", opts: ["Ossufo Momade","André Matsangaíssa","Afonso Dhlakama","Daviz Simango"], ans: 2 },
  { q: "O que se celebra a 3 de Fevereiro em Moçambique?", opts: ["Dia da Independência","Dia dos Heróis","Dia da Paz","Dia da Mulher"], ans: 1 },
  { q: "Qual foi o segundo presidente de Moçambique?", opts: ["Armando Guebuza","Filipe Nyusi","Joaquim Chissano","Daniel Chapo"], ans: 2 },
  { q: "O que se celebra a 4 de Outubro em Moçambique?", opts: ["Dia da Independência","Dia dos Heróis","Dia da Paz e Reconciliação","Dia das FAPLA"], ans: 2 },
  { q: "Qual arma aparece na bandeira de Moçambique?", opts: ["Pistola","Espingarda","AK-47","Catana"], ans: 2 },
  { q: "Qual presidente da FRELIMO foi assassinado em 1969?", opts: ["Samora Machel","Eduardo Mondlane","Marcelino dos Santos","Armando Guebuza"], ans: 1 },
  { q: "Em que ano começou o conflito armado entre FRELIMO e RENAMO?", opts: ["1975","1976","1977","1978"], ans: 2 },
  { q: "Qual é a capital de Moçambique?", opts: ["Beira","Nampula","Matola","Maputo"], ans: 3 },
  { q: "Qual é o rio mais longo que atravessa Moçambique?", opts: ["Limpopo","Save","Incomáti","Zambeze"], ans: 3 },
  { q: "Em que província fica a Barragem de Cahora Bassa?", opts: ["Manica","Sofala","Tete","Zambézia"], ans: 2 },
  { q: "Qual lago fica na fronteira norte de Moçambique?", opts: ["Lago Vitória","Lago Niassa","Lago Tanganica","Lago Nakuru"], ans: 1 },
  { q: "Qual país faz fronteira a norte de Moçambique?", opts: ["Zâmbia","Malawi","Zimbabwe","Tanzânia"], ans: 3 },
  { q: "Qual é a capital da província de Sofala?", opts: ["Chimoio","Beira","Dondo","Nhamatanda"], ans: 1 },
  { q: "Qual arquipélago fica ao largo da costa de Inhambane?", opts: ["Quirimbas","Bazaruto","Inhaca","Macaneta"], ans: 1 },
  { q: "Qual é o ponto mais alto de Moçambique?", opts: ["Monte Gorongosa","Monte Namúli","Serra Choa","Monte Binga"], ans: 3 },
  { q: "Em que província fica o Parque Nacional da Gorongosa?", opts: ["Manica","Tete","Sofala","Zambézia"], ans: 2 },
  { q: "Qual é a segunda maior cidade de Moçambique por população?", opts: ["Beira","Nampula","Matola","Quelimane"], ans: 2 },
  { q: "Qual é o maior estádio de Moçambique?", opts: ["Estádio da Machava","Estádio do Zimpeto","Estádio Costa do Sol","Estádio da Maxaquene"], ans: 1 },
  { q: "O que é o 'Lobolo' na cultura moçambicana?", opts: ["Instrumento musical","Dote/preço da noiva","Prato típico","Dança de Cabo Delgado"], ans: 1 },
  { q: "O que é a 'Capulana'?", opts: ["Cesta de palha","Tecido colorido tradicional","Bebida fermentada","Canoa de pesca"], ans: 1 },
  { q: "O que é o 'Xitique'?", opts: ["Jogo de tabuleiro","Dança tradicional","Sistema de poupança colectiva","Prato típico do sul"], ans: 2 },
  { q: "O que significa 'Kanimambo' em Changana?", opts: ["Bom dia","Boa noite","Obrigado","Como estás?"], ans: 2 },
  { q: "Qual é o género musical tradicional de Maputo?", opts: ["Pandza","Mapiko","Marrabenta","Timbila"], ans: 2 },
  { q: "O que é o 'Matapa'?", opts: ["Tecido bordado","Prato de folhas de mandioca com amendoim","Instrumento de percussão","Bebida fermentada"], ans: 1 },
  { q: "Qual instrumento é típico da etnia Chopi?", opts: ["Mbira","Djembe","Timbila","Ngoma"], ans: 2 },
  { q: "Qual dança é tradicional da etnia Makonde?", opts: ["Xibelane","Mapiko","Tufo","Xigubo"], ans: 1 },
  { q: "Qual é a língua oficial de Moçambique?", opts: ["Changana","Macua","Português","Ronga"], ans: 2 },
  { q: "Qual é a moeda de Moçambique?", opts: ["Kwanza","Metical","Rand","Cedi"], ans: 1 },
  { q: "Qual dança é popular em festas muçulmanas no norte de MZ?", opts: ["Marrabenta","Mapiko","Tufo","Xigubo"], ans: 2 },
  { q: "O que é o 'Maheu'?", opts: ["Dança tradicional","Bebida fermentada de farinha de milho","Instrumento de cordas","Chapéu tradicional"], ans: 1 },
  { q: "Qual atleta MZ ganhou ouro olímpico nos Jogos de Sydney 2000?", opts: ["Ana Guedes","Lurdes Mutola","Manuela Machado","Helena Xavier"], ans: 1 },
  { q: "Em que modalidade Lurdes Mutola ganhou o ouro olímpico?", opts: ["400 metros","1500 metros","800 metros","Maratona"], ans: 2 },
  { q: "Em que cidade nasceu Eusébio, o craque do Benfica?", opts: ["Beira","Nampula","Lourenço Marques (Maputo)","Inhambane"], ans: 2 },
  { q: "Qual escritor MZ é autor de 'Terra Sonâmbula'?", opts: ["José Craveirinha","Ungulani Ba Ka Khosa","Paulina Chiziane","Mia Couto"], ans: 3 },
  { q: "Qual escritora MZ ganhou o Prémio Camões em 2021?", opts: ["Noémia de Sousa","Paulina Chiziane","Graça Machel","Lina Magaia"], ans: 1 },
  { q: "Qual artista plástico MZ é internacionalmente famoso pelas suas pinturas?", opts: ["Alberto Chissano","Malangatana","Reinata Sadimba","Bertina Lopes"], ans: 1 },
  { q: "Qual cantor MZ é conhecido como o Rei da Marrabenta?", opts: ["Stewart Sukuma","Feliciano dos Santos","Wazimbo","Dilon Djindji"], ans: 2 },
  { q: "Qual rapper MZ ficou famoso pelo álbum 'Muthiana Omukhulu'?", opts: ["Mr. Bow","Azagaia","Dama do Bling","Laylizzy"], ans: 1 },
  { q: "Qual é a alcunha da seleção nacional de basquete de Moçambique?", opts: ["Leões","Mambas","Elefantes","Caimões"], ans: 1 },
  { q: "Qual poeta MZ foi o primeiro a ganhar o Prémio Camões (1991)?", opts: ["Mia Couto","José Craveirinha","Ungulani Ba Ka Khosa","Paulina Chiziane"], ans: 1 },
  { q: "Em que clube português ficou famoso Eusébio?", opts: ["Sporting","Porto","Benfica","Braga"], ans: 2 },
  { q: "Qual escritora MZ publicou 'Balada de Amor ao Vento' em 1990?", opts: ["Noémia de Sousa","Graça Machel","Paulina Chiziane","Lina Magaia"], ans: 2 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRound() {
  return shuffle(BANK).slice(0, TOTAL_Q).map((q) => {
    const order = shuffle([0, 1, 2, 3]);
    return { q: q.q, opts: order.map((i) => q.opts[i]), ans: order.indexOf(q.ans) };
  });
}

export class SabeTudoEngine extends BaseEngine {
  constructor(params) {
    super(params);
    this.phase        = "lobby";
    this.questions    = [];
    this.qIdx         = 0;
    this.answers      = new Map(); // socketId → optionIndex
    this.scores       = new Map(); // socketId → score
    this.timeLeft     = 0;
    this.correctCount = 0;
  }

  _initScores() {
    this.scores = new Map();
    for (const [id] of this.room.players) this.scores.set(id, 0);
  }

  startGame(socketId) {
    const me = this.room.players.get(socketId);
    if (!me?.isHost || this.phase !== "lobby") return;
    this.questions = pickRound();
    this.qIdx = 0;
    this._initScores();
    this._startQuestion();
  }

  _startQuestion() {
    this.clearTimers();
    this.phase        = "question";
    this.answers      = new Map();
    this.correctCount = 0;
    this.timeLeft     = SECS_PER_Q;
    this.emitState();

    this._setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      if (this.timeLeft <= 0) { this.clearTimers(); this._reveal(); }
      else this.emitState();
    }, 1000);
  }

  _reveal() {
    this.phase = "reveal";
    this.emitState();
    this._setTimeout(() => this._nextQ(), REVEAL_SECS * 1000);
  }

  _nextQ() {
    this.qIdx++;
    if (this.qIdx >= TOTAL_Q) { this.phase = "finished"; this.emitState(); }
    else this._startQuestion();
  }

  handleCommand(socketId, command) {
    if (command.type !== "ANSWER" || this.phase !== "question") return;
    if (this.answers.has(socketId)) return;
    const idx = command.optionIndex;
    if (typeof idx !== "number") return;
    this.answers.set(socketId, idx);
    const q = this.questions[this.qIdx];
    if (idx === q.ans) {
      const pts = this.correctCount === 0 ? 3 : this.correctCount === 1 ? 2 : 1;
      this.scores.set(socketId, (this.scores.get(socketId) || 0) + pts);
      this.correctCount++;
    }
    if (this.answers.size >= this.room.players.size) { this.clearTimers(); this._reveal(); }
    else this.emitState();
  }

  restartGame(socketId) {
    const me = this.room.players.get(socketId);
    if (!me?.isHost) return;
    this.clearTimers();
    this.phase = "lobby";
    this.qIdx = 0;
    this.questions = [];
    this.answers = new Map();
    this.scores = new Map();
    this.emitState();
  }

  onPlayerJoin(player) {
    if (!this.scores.has(player.id)) this.scores.set(player.id, 0);
  }

  onPlayerLeave(player) {
    this.answers.delete(player.id);
    if (this.phase === "question" && this.room.players.size > 0 &&
        this.answers.size >= this.room.players.size) {
      this.clearTimers(); this._reveal();
    }
  }

  getPublicState() {
    const q = this.questions[this.qIdx];
    const scores = [];
    for (const [id, score] of this.scores) {
      const player = this.room.players.get(id);
      if (player) scores.push({ id, name: player.name, score });
    }
    scores.sort((a, b) => b.score - a.score);

    return {
      phase:         this.phase,
      qIdx:          this.qIdx,
      totalQ:        TOTAL_Q,
      timeLeft:      this.timeLeft,
      answeredCount: this.answers.size,
      playerCount:   this.room.players.size,
      scores,
      question: q ? {
        q:    q.q,
        opts: q.opts,
        ans:  this.phase !== "question" ? q.ans : null,
      } : null,
    };
  }

  getPrivateState(playerId) {
    const myAnswer = this.answers.has(playerId) ? this.answers.get(playerId) : null;
    const q = this.questions[this.qIdx];
    const isCorrect = myAnswer !== null && q ? myAnswer === q.ans : null;
    return {
      myAnswer,
      isCorrect: (this.phase === "reveal" || this.phase === "finished") ? isCorrect : null,
    };
  }
}
