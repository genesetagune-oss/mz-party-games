import { BaseEngine } from "./baseEngine.js";
import { verificarResposta } from "./sporcleMZVerification.js";

const REVEAL_SECS = 4;
const TOTAL_Q     = 5;

const TEAM_DEFS = [
  { id: "A", name: "Vermelhos", color: "#EF4444" },
  { id: "B", name: "Azuis",     color: "#3B82F6" },
  { id: "C", name: "Verdes",    color: "#10B981" },
  { id: "D", name: "Amarelos",  color: "#F59E0B" },
];

const BANK = [
  // ── CIDADES & GEOGRAFIA ──────────────────────────────────
  { id:"c01", tipo:"resposta_curta", tempo:15, pergunta:"Qual é a capital de Moçambique?", respostas_aceites:[["maputo","lourenco marques","lourenço marques"]] },
  { id:"c02", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Sofala?", respostas_aceites:[["beira","cidade da beira"]] },
  { id:"c03", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Nampula?", respostas_aceites:[["nampula"]] },
  { id:"c04", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Gaza?", respostas_aceites:[["xai-xai","xaixai","xai xai","joao belo"]] },
  { id:"c05", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Manica?", respostas_aceites:[["chimoio","vila pery"]] },
  { id:"c06", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Tete?", respostas_aceites:[["tete"]] },
  { id:"c07", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Zambézia?", respostas_aceites:[["quelimane"]] },
  { id:"c08", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Niassa?", respostas_aceites:[["lichinga","vila cabral"]] },
  { id:"c09", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Cabo Delgado?", respostas_aceites:[["pemba","porto amelia"]] },
  { id:"c10", tipo:"resposta_curta", tempo:15, pergunta:"Capital da província de Inhambane?", respostas_aceites:[["inhambane"]] },
  { id:"c11", tipo:"resposta_curta", tempo:15, pergunta:"Em que província fica a Barragem de Cahora Bassa?", respostas_aceites:[["tete"]] },
  { id:"c12", tipo:"resposta_curta", tempo:15, pergunta:"Qual é a segunda maior cidade de Moçambique?", respostas_aceites:[["matola"]] },
  { id:"c13", tipo:"resposta_curta", tempo:15, pergunta:"Qual cidade costeira é conhecida pelas praias de coral em Inhambane?", respostas_aceites:[["tofo","praia do tofo"]] },
  { id:"c14", tipo:"resposta_curta", tempo:15, pergunta:"Em que cidade fica o Estádio do Zimpeto?", respostas_aceites:[["maputo"]] },
  { id:"c15", tipo:"resposta_curta", tempo:15, pergunta:"Qual praia moçambicana fica mesmo na fronteira com a África do Sul e é destino famoso de sul-africanos?", respostas_aceites:[["ponta do ouro"]] },
  { id:"c16", tipo:"lista", tempo:60, total:6, pergunta:"Nomeia os 6 países que fazem fronteira com Moçambique", respostas_aceites:[["tanzania","tanzânia","tanzánia"],["malawi","malaui","malaví"],["zambia","zâmbia","zámbia"],["zimbabwe","zimbabué","zimbabue"],["eswatini","suazilandia","swazilândia"],["africa do sul","south africa"]] },
  { id:"c17", tipo:"lista", tempo:60, total:5, pergunta:"Nomeia 5 ilhas ou arquipélagos famosos de Moçambique", respostas_aceites:[["ilha de mocambique","ilha de moçambique","ilha mozambique"],["bazaruto","ilha do bazaruto"],["quirimbas","arquipelago das quirimbas"],["inhaca","ilha da inhaca"],["ibo","ilha do ibo"]] },
  { id:"c18", tipo:"lista", tempo:60, total:5, pergunta:"Nomeia 5 bairros populares de Maputo", respostas_aceites:[["xipamanine"],["malhazine"],["polana","polana cimento","polana caniço"],["hulene"],["zimpeto"],["chamanculo"],["alto mae","alto maé"],["sommerschield"],["costa do sol"]] },
  { id:"c19", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 rios importantes de Moçambique", respostas_aceites:[["zambeze","zambezi","rio zambeze"],["limpopo","rio limpopo"],["save","rio save"],["incomati","incomáti"],["rovuma","rio rovuma"],["buzi","rio buzi"]] },
  { id:"c20", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 províncias do norte de Moçambique", respostas_aceites:[["niassa"],["cabo delgado"],["nampula"],["zambezia","zambézia"]] },
  { id:"c21", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 províncias do sul de Moçambique", respostas_aceites:[["maputo","maputo provincia","maputo cidade"],["gaza"],["inhambane"]] },
  { id:"c22", tipo:"lista", tempo:60, total:6, pergunta:"Nomeia 6 destinos turísticos de praias em Moçambique", respostas_aceites:[["tofo","praia do tofo"],["vilanculos","vilanculo"],["ponta do ouro"],["pemba"],["bazaruto"],["beira"],["inhambane"],["nacala"]] },
  { id:"c23", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 portos marítimos importantes de Moçambique", respostas_aceites:[["maputo","porto de maputo","porto maputo"],["beira","porto da beira","porto beira"],["nacala","porto de nacala","porto nacala"],["pemba"],["quelimane"]] },
  { id:"c24", tipo:"lista", tempo:60, total:5, pergunta:"Nomeia 5 cidades costeiras de Moçambique", respostas_aceites:[["maputo"],["beira"],["nacala"],["pemba"],["quelimane"],["inhambane"],["mocambique","ilha de mocambique"]] },
  { id:"c25", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 parques nacionais ou reservas naturais de Moçambique", respostas_aceites:[["gorongosa","parque da gorongosa"],["niassa","reserva do niassa"],["zinave"],["banhine"],["bazaruto","parque nacional do bazaruto"],["quirimbas","parque nacional das quirimbas"]] },

  // ── MÚSICA MZ ────────────────────────────────────────────
  { id:"m01", tipo:"resposta_curta", tempo:15, pergunta:"Qual é o género musical urbano mais popular em Maputo?", respostas_aceites:[["pandza","panda","pandza music"]] },
  { id:"m02", tipo:"resposta_curta", tempo:15, pergunta:"Qual cantor moçambicano é conhecido como 'Rei da Marrabenta'?", respostas_aceites:[["wazimbo","wazimbo ngungunyane"]] },
  { id:"m03", tipo:"resposta_curta", tempo:15, pergunta:"Qual género musical usa o instrumento timbila e tem origem na etnia Chopi?", respostas_aceites:[["timbila","musica timbila"]] },
  { id:"m04", tipo:"resposta_curta", tempo:15, pergunta:"Qual cantora MZ é famosa pela música 'Leve Leve'?", respostas_aceites:[["mingas"]] },
  { id:"m05", tipo:"resposta_curta", tempo:15, pergunta:"Qual rapper MZ ficou famoso pelo álbum 'Muthiana Omukhulu'?", respostas_aceites:[["azagaia","edson da luz"]] },
  { id:"m06", tipo:"resposta_curta", tempo:15, pergunta:"Qual cantora MZ é conhecida pela música 'Djama'?", respostas_aceites:[["neyma"]] },
  { id:"m07", tipo:"resposta_curta", tempo:15, pergunta:"Qual cantor MZ popularizou a música 'Nguiane'?", respostas_aceites:[["mr bow","mister bow","mrbow"]] },
  { id:"m08", tipo:"resposta_curta", tempo:15, pergunta:"Qual DJ moçambicano é famoso por produzir Pandza e colaborar com Neyma e Mr. Bow?", respostas_aceites:[["ziqo","dj ziqo"]] },
  { id:"m09", tipo:"resposta_curta", tempo:15, pergunta:"Qual cantora MZ é conhecida pela música 'Sou Feliz'?", respostas_aceites:[["lizha james","lizha"]] },
  { id:"m10", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama o género musical tradicional de Cabo Delgado dançado em celebrações islâmicas?", respostas_aceites:[["tufo"]] },
  { id:"m11", tipo:"resposta_curta", tempo:15, pergunta:"Qual cantor MZ é conhecido pela música 'Soluço'?", respostas_aceites:[["stewart sukuma","sukuma"]] },
  { id:"m12", tipo:"resposta_curta", tempo:15, pergunta:"Qual artista MZ é conhecida por 'Meu Amor' e é um dos rostos do AfroPoP em MZ?", respostas_aceites:[["tamyris","tamyris moiane"]] },
  { id:"m13", tipo:"resposta_curta", tempo:15, pergunta:"Qual rapper MZ ficou popular com 'Bem-Vindo a Maputo'?", respostas_aceites:[["mc roger"]] },
  { id:"m14", tipo:"resposta_curta", tempo:15, pergunta:"Qual artista MZ ficou conhecido com a música 'Nyamurate'?", respostas_aceites:[["laylizzy","laylizzy davilson"]] },
  { id:"m15", tipo:"resposta_curta", tempo:15, pergunta:"Qual é o instrumento de cordas dedilhadas tradicional usado pelos Chopi?", respostas_aceites:[["xitende","mbira"]] },
  { id:"m16", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 géneros musicais com origem em Moçambique", respostas_aceites:[["marrabenta"],["pandza","panda"],["tufo"],["timbila"],["mapiko"],["xigubo"],["xibelane"]] },
  { id:"m17", tipo:"lista", tempo:60, total:6, pergunta:"Nomeia 6 artistas/cantores moçambicanos", respostas_aceites:[["neyma"],["lizha james","lizha"],["mr bow","mister bow"],["azagaia"],["wazimbo"],["ziqo","dj ziqo"],["laylizzy"],["tamyris","tamyris moiane"],["mr kuka","kuka"],["hot blaze"],["twenty fingers"],["bander"],["mc roger"],["stewart sukuma","sukuma"],["mingas"],["marllen"],["percella"],["lourena nhate","lourena"],["dygo boy","dygo"],["edu all talents","edu"]] },
  { id:"m18", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 cantoras moçambicanas", respostas_aceites:[["neyma"],["lizha james","lizha"],["tamyris","tamyris moiane"],["mingas"],["marllen"],["percella"],["lourena nhate","lourena"],["dama do bling"]] },
  { id:"m19", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 rappers ou artistas de hip-hop moçambicanos", respostas_aceites:[["azagaia"],["laylizzy"],["mc roger"],["hot blaze"],["ubakka","justino ubakka"],["mr bow","mister bow"],["bander"],["dygo boy","dygo"]] },
  { id:"m20", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 instrumentos musicais tradicionais de Moçambique", respostas_aceites:[["timbila"],["mbira"],["xitende"],["ngoma"],["nhacasso"],["lupembe"]] },
  { id:"m21", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 artistas africanos (não MZ) muito populares em Moçambique", respostas_aceites:[["burna boy"],["wizkid","wiz kid"],["diamond platnumz","diamond"],["c4 pedro","c4"],["anselmo ralph","anselmo"],["nelson freitas"],["calema"],["davido"]] },
  { id:"m22", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 danças tradicionais de Moçambique", respostas_aceites:[["mapiko"],["tufo"],["xigubo"],["xibelane"],["marrabenta"],["timbila"]] },
  { id:"m23", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 artistas MZ conhecidos por música gospel ou cristã", respostas_aceites:[["valdemiro jose","valdemiro"],["deborah duarte","deborah"],["yadah"],["nuno abdul","nuno"],["edmazia","edmazia mayembe"]] },
  { id:"m24", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 bebidas alcoólicas produzidas em Moçambique", respostas_aceites:[["2m","dois m"],["laurentina"],["tipo tinto","tipo"],["impala"],["catembe"]] },
  { id:"m25", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 podcasts ou influencers MZ conhecidos nas redes sociais", respostas_aceites:[["guyzelh","guyzelh ramos"],["cardo","cardo podcast"],["maxh","maxh 258"],["catamo"],["salensio"],["lizha james","lizha"]] },

  // ── GÍRIAS & EXPRESSÕES ───────────────────────────────────
  { id:"g01", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Kanimambo' em Changana?", respostas_aceites:[["obrigado","obrigada"]] },
  { id:"g02", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Mboa' na gíria de Maputo?", respostas_aceites:[["rapariga","namorada","miuda","miúda","girl"]] },
  { id:"g03", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Xilado' na gíria moçambicana?", respostas_aceites:[["cansado","sem dinheiro","lixado","exausto","sem fundos"]] },
  { id:"g04", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Nyama' em Changana e Ronga?", respostas_aceites:[["carne"]] },
  { id:"g05", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Salani Kahle' em Changana?", respostas_aceites:[["adeus","fiquem bem","ate logo","tchau"]] },
  { id:"g06", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Pela' na gíria de Maputo?", respostas_aceites:[["dinheiro","massa","guita"]] },
  { id:"g07", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Boah' na gíria moçambicana?", respostas_aceites:[["boa","bom","fixe","top"]] },
  { id:"g08", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Mana' como vocativo no contexto moçambicano?", respostas_aceites:[["irma","amiga","mana","colega"]] },
  { id:"g09", tipo:"resposta_curta", tempo:15, pergunta:"Como se diz 'Bom dia' em Changana?", respostas_aceites:[["xewani","avuxeni"]] },
  { id:"g10", tipo:"resposta_curta", tempo:15, pergunta:"O que é um 'Chapa' em Moçambique?", respostas_aceites:[["transporte publico","mini autocarro","minibus","transporte coletivo","chapa 100"]] },
  { id:"g11", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Txopela' em Moçambique?", respostas_aceites:[["mototaxi","moto taxi","motociclo taxi"]] },
  { id:"g12", tipo:"resposta_curta", tempo:15, pergunta:"O que é o 'Lobolo' na cultura moçambicana?", respostas_aceites:[["dote","bridewealth","preco da noiva","pagamento para casar"]] },
  { id:"g13", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Kuyimba' em Changana?", respostas_aceites:[["cantar","musica"]] },
  { id:"g14", tipo:"resposta_curta", tempo:15, pergunta:"O que é o 'Xitique' na cultura moçambicana?", respostas_aceites:[["poupanca coletiva","sistema de poupanca","kitty","vaquinha"]] },
  { id:"g15", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Malandro' na gíria MZ (contexto neutro)?", respostas_aceites:[["espertalhao","esperto","malandro","fixolas","safado"]] },
  { id:"g16", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 formas de dizer 'amigo' ou 'colega' na gíria MZ", respostas_aceites:[["mano","manu"],["bro"],["parceiro"],["chegou","cheg"],["maninho"],["bodas"]] },
  { id:"g17", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 palavras MZ para dizer que algo é bom/fixe", respostas_aceites:[["boah","boa"],["massa"],["fixe"],["top"],["direto"],["show"],["na vibe"],["certo"]] },
  { id:"g18", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 pratos típicos moçambicanos", respostas_aceites:[["matapa"],["xima"],["caril de amendoim","caril amendoim"],["galinha zambeziana","galinha a zambeziana"],["frango cafreal","frango a cafreal"],["chamussas"],["badjias"],["lagosta"]] },
  { id:"g19", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 línguas bantu faladas em Moçambique", respostas_aceites:[["changana"],["ronga"],["macua","makua"],["sena"],["ndau"],["tswa"],["chewa"],["yao"],["makonde"]] },
  { id:"g20", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 formas de pagamento usadas no dia a dia em MZ", respostas_aceites:[["metical","mt","meticais"],["mpesa","m-pesa"],["emola","e-mola"],["ponto 24","ponto24","multicaixa"],["rand"]] },
  { id:"g21", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 expressões moçambicanas de cumprimento", respostas_aceites:[["kanimambo"],["salani kahle","salani"],["xewani"],["minjani","minjane"],["nhani"],["como esta","como vai"]] },
  { id:"g22", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 marcas ou produtos tipicamente moçambicanos", respostas_aceites:[["2m","dois m"],["laurentina"],["tipo tinto","tipo"],["caju","suco de caju"],["movitel"],["tmcel"],["vodacom"],["piri piri","piri-piri"]] },
  { id:"g23", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 comportamentos ou gírias típicas na linguagem MZ", respostas_aceites:[["xilado"],["malandro"],["na frente","nafrente"],["fazer esquema","esquema"],["mandar bala"],["desconfiar","desconfiado"],["bater o pe","bater pe"]] },
  { id:"g24", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 objectos do dia a dia em Moçambique com nomes locais", respostas_aceites:[["capulana"],["chapa"],["txopela"],["catana"],["pilao","pilão"],["baraca","barraca"],["machamba"]] },
  { id:"g25", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 festas ou celebrações culturais em Moçambique", respostas_aceites:[["lobolo"],["xitique"],["mapiko"],["tufo"],["festa da independencia","25 de junho"],["festa da paz","4 de outubro","dia da paz"]] },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRound() { return shuffle(BANK).slice(0, TOTAL_Q); }

function calcIndividualPts(rank) {
  return rank === 0 ? 100 : rank === 1 ? 80 : rank === 2 ? 60 : 40;
}
function calcTeamPts(rank) {
  return rank === 0 ? 100 : rank === 1 ? 70 : 40;
}

export class SporcleMZEngine extends BaseEngine {
  constructor(params) {
    super(params);
    this.phase = "lobby";
    this.mode  = "individual"; // "individual" | "equipas"

    // questions
    this.questions = [];
    this.qIdx      = 0;
    this.timeLeft  = 0;

    // individual
    this.scores        = new Map();
    this.playerAnswers = new Map();
    this.answerOrder   = [];
    this.answeredShort = new Set();

    // equipas
    this.equipas            = new Map(); // teamId → {id,name,color,members[],captainIdx,currentCaptainId}
    this.teamScores         = new Map();
    this.teamAnswers        = new Map(); // teamId → Set<"grupo_N">
    this.answerOrderTeams   = [];
    this.answeredShortTeams = new Set();
  }

  // ── team helpers ──────────────────────────────────────────

  _createTeams(count) {
    this.equipas = new Map();
    for (let i = 0; i < count; i++) {
      const d = TEAM_DEFS[i];
      this.equipas.set(d.id, { id: d.id, name: d.name, color: d.color, members: [], captainIdx: 0, currentCaptainId: null });
    }
    this.teamScores = new Map([...this.equipas.keys()].map(id => [id, 0]));
  }

  _assignPlayer(playerId, teamId) {
    for (const [, t] of this.equipas) t.members = t.members.filter(id => id !== playerId);
    const team = this.equipas.get(teamId);
    if (team && !team.members.includes(playerId)) team.members.push(playerId);
    this._syncCaptains();
  }

  _autoShuffle() {
    const ids = [...this.equipas.keys()];
    const players = shuffle([...this.room.players.keys()]);
    for (const [, t] of this.equipas) t.members = [];
    players.forEach((pid, i) => this.equipas.get(ids[i % ids.length]).members.push(pid));
    this._syncCaptains();
  }

  _syncCaptains() {
    for (const [, t] of this.equipas) {
      if (t.members.length > 0) t.currentCaptainId = t.members[t.captainIdx % t.members.length];
      else t.currentCaptainId = null;
    }
  }

  _rotateCaptains() {
    for (const [, t] of this.equipas) {
      if (t.members.length > 0) {
        t.captainIdx = (t.captainIdx + 1) % t.members.length;
        t.currentCaptainId = t.members[t.captainIdx];
      }
    }
  }

  _teamOf(socketId) {
    for (const [tid, t] of this.equipas) if (t.members.includes(socketId)) return tid;
    return null;
  }

  _isCaptain(socketId) {
    const tid = this._teamOf(socketId);
    return tid ? this.equipas.get(tid)?.currentCaptainId === socketId : false;
  }

  // ── game flow ─────────────────────────────────────────────

  _initScores() {
    this.scores = new Map([...this.room.players.keys()].map(id => [id, 0]));
    if (this.mode === "equipas") {
      this.teamScores = new Map([...this.equipas.keys()].map(id => [id, 0]));
    }
  }

  startGame(socketId) {
    const me = this.room.players.get(socketId);
    if (!me?.isHost || this.phase !== "lobby") return;
    if (this.mode === "equipas" && this.equipas.size < 2) return;
    this.questions = pickRound();
    this.qIdx = 0;
    this._initScores();
    this._startQuestion();
  }

  _startQuestion() {
    this.clearTimers();
    this.phase = "question";
    const q = this.questions[this.qIdx];
    this.timeLeft        = q.tempo;
    this.playerAnswers   = new Map([...this.room.players.keys()].map(id => [id, new Set()]));
    this.answerOrder     = [];
    this.answeredShort   = new Set();
    this.teamAnswers     = new Map([...this.equipas.keys()].map(id => [id, new Set()]));
    this.answerOrderTeams    = [];
    this.answeredShortTeams  = new Set();
    this.emitState();

    this._setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      if (this.timeLeft <= 0) { this.clearTimers(); this._reveal(); }
      else this.emitState();
    }, 1000);
  }

  _reveal() {
    this._atribuirPontos();
    this.phase = "reveal";
    if (this.mode === "equipas") this._rotateCaptains();
    this.emitState();
    this._setTimeout(() => this._nextQ(), REVEAL_SECS * 1000);
  }

  _atribuirPontos() {
    const q = this.questions[this.qIdx];
    if (this.mode === "individual") {
      if (q.tipo === "resposta_curta") {
        this.answerOrder.forEach(({ id }, rank) =>
          this.scores.set(id, (this.scores.get(id) || 0) + calcIndividualPts(rank))
        );
      } else {
        for (const [id, acertadas] of this.playerAnswers)
          this.scores.set(id, (this.scores.get(id) || 0) + acertadas.size * 10);
      }
    } else {
      if (q.tipo === "resposta_curta") {
        this.answerOrderTeams.forEach((tid, rank) => {
          const pts = calcTeamPts(rank);
          this.teamScores.set(tid, (this.teamScores.get(tid) || 0) + pts);
          // add pts to individual members too (for display)
          const team = this.equipas.get(tid);
          team?.members.forEach(mid => this.scores.set(mid, (this.scores.get(mid) || 0) + pts));
        });
      } else {
        for (const [tid, acertadas] of this.teamAnswers) {
          const pts = acertadas.size * 10;
          this.teamScores.set(tid, (this.teamScores.get(tid) || 0) + pts);
          const team = this.equipas.get(tid);
          team?.members.forEach(mid => this.scores.set(mid, (this.scores.get(mid) || 0) + pts));
        }
      }
    }
  }

  _nextQ() {
    this.qIdx++;
    if (this.qIdx >= TOTAL_Q) { this.phase = "finished"; this.emitState(); }
    else this._startQuestion();
  }

  // ── commands ──────────────────────────────────────────────

  handleCommand(socketId, command) {
    if (this.phase === "lobby") {
      this._handleLobbyCommand(socketId, command);
      return;
    }
    if (this.mode === "equipas") {
      this._handleEquipasCommand(socketId, command);
    } else {
      this._handleIndividualCommand(socketId, command);
    }
  }

  _handleLobbyCommand(socketId, command) {
    // Any player can join/switch their own team
    if (command.type === "JOIN_TEAM") {
      if (command.teamId && this.equipas.has(command.teamId)) {
        this._assignPlayer(socketId, command.teamId);
        this.emitState();
      }
      return;
    }

    // Any team member (non-host) can rename their own team
    if (command.type === "RENAME_TEAM") {
      const me = this.room.players.get(socketId);
      if (me?.isHost) return;
      const tid = this._teamOf(socketId);
      if (!tid) return;
      const newName = String(command.name || "").trim();
      if (newName.length < 2 || newName.length > 20) return;
      const team = this.equipas.get(tid);
      if (team) { team.name = newName; this.emitState(); }
      return;
    }

    const me = this.room.players.get(socketId);
    if (!me?.isHost) return;
    switch (command.type) {
      case "SET_MODE":
        if (command.mode === "individual" || command.mode === "equipas") {
          this.mode = command.mode;
          if (command.mode === "individual") this.equipas = new Map();
          this.emitState();
        }
        break;
      case "CREATE_TEAMS":
        if ([2, 3, 4].includes(command.count)) { this._createTeams(command.count); this.emitState(); }
        break;
      case "ASSIGN_PLAYER":
        if (command.playerId && command.teamId) { this._assignPlayer(command.playerId, command.teamId); this.emitState(); }
        break;
      case "AUTO_SHUFFLE":
        if (this.equipas.size >= 2) { this._autoShuffle(); this.emitState(); }
        break;
    }
  }

  _handleIndividualCommand(socketId, command) {
    if (command.type !== "ANSWER" || this.phase !== "question") return;
    const q = this.questions[this.qIdx];
    const answer = command.answer;
    if (typeof answer !== "string" || !answer.trim()) return;

    if (q.tipo === "resposta_curta") {
      if (this.answeredShort.has(socketId)) return;
      const { resultado } = verificarResposta(answer, q.respostas_aceites);
      if (resultado === "acerto") {
        this.answeredShort.add(socketId);
        this.answerOrder.push({ id: socketId });
        this.io.to(socketId).emit("game:event", { type: "ANSWER_RESULT", resultado: "acerto" });
        if (this.answeredShort.size >= this.room.players.size) { this.clearTimers(); this._reveal(); }
        else this.emitState();
      } else {
        this.io.to(socketId).emit("game:event", { type: "ANSWER_RESULT", resultado });
      }
    } else {
      const acertadas = this.playerAnswers.get(socketId) || new Set();
      const { resultado, grupoAcertadoIndex, sugestao } = verificarResposta(answer, q.respostas_aceites, acertadas);
      if (resultado === "acerto") { acertadas.add(`grupo_${grupoAcertadoIndex}`); this.playerAnswers.set(socketId, acertadas); }
      this.io.to(socketId).emit("game:event", { type: "ANSWER_RESULT", resultado, sugestao });
      this.emitState();
    }
  }

  _handleEquipasCommand(socketId, command) {
    if (command.type === "PASS_PHONE") {
      this._passPhone(socketId, command.toPlayerId);
      return;
    }
    if (command.type !== "ANSWER" || this.phase !== "question") return;
    if (!this._isCaptain(socketId)) return;

    const tid = this._teamOf(socketId);
    const q   = this.questions[this.qIdx];
    const answer = command.answer;
    if (typeof answer !== "string" || !answer.trim()) return;

    if (q.tipo === "resposta_curta") {
      if (this.answeredShortTeams.has(tid)) return;
      const { resultado } = verificarResposta(answer, q.respostas_aceites);
      if (resultado === "acerto") {
        this.answeredShortTeams.add(tid);
        this.answerOrderTeams.push(tid);
        this.io.to(socketId).emit("game:event", { type: "ANSWER_RESULT", resultado: "acerto" });
        if (this.answeredShortTeams.size >= this.equipas.size) { this.clearTimers(); this._reveal(); }
        else this.emitState();
      } else {
        const { sugestao } = verificarResposta(answer, q.respostas_aceites);
        this.io.to(socketId).emit("game:event", { type: "ANSWER_RESULT", resultado, sugestao });
      }
    } else {
      const acertadas = this.teamAnswers.get(tid) || new Set();
      const { resultado, grupoAcertadoIndex, sugestao } = verificarResposta(answer, q.respostas_aceites, acertadas);
      if (resultado === "acerto") { acertadas.add(`grupo_${grupoAcertadoIndex}`); this.teamAnswers.set(tid, acertadas); }
      this.io.to(socketId).emit("game:event", { type: "ANSWER_RESULT", resultado, sugestao });
      this.emitState();
    }
  }

  _passPhone(fromId, toId) {
    const tid = this._teamOf(fromId);
    if (!tid) return;
    const team = this.equipas.get(tid);
    if (!team || team.currentCaptainId !== fromId || !team.members.includes(toId)) return;
    const newIdx = team.members.indexOf(toId);
    team.captainIdx      = newIdx;
    team.currentCaptainId = toId;
    this.emitState();
    this.io.to(fromId).emit("game:event", { type: "PHONE_PASSED" });
    this.io.to(toId).emit("game:event",   { type: "PHONE_RECEIVED" });
  }

  restartGame(socketId) {
    const me = this.room.players.get(socketId);
    if (!me?.isHost) return;
    this.clearTimers();
    this.phase = "lobby";
    this.qIdx  = 0;
    this.questions = [];
    this.playerAnswers = new Map();

    // Preserve equipas but reset scores and rotate captains
    if (this.equipas.size > 0) {
      this.equipas.forEach(t => {
        // Remove players that left the room
        t.members = t.members.filter(id => this.room.players.has(id));
        t.captainIdx = 0;
        t.currentCaptainId = t.members[0] ?? null;
      });
      this.teamScores = new Map([...this.equipas.keys()].map(id => [id, 0]));
      this.scores = new Map([...this.room.players.keys()].map(id => [id, 0]));
    } else {
      this.scores    = new Map();
      this.teamScores = new Map();
    }

    this.emitState();
  }

  onPlayerJoin(player) {
    if (!this.scores.has(player.id)) this.scores.set(player.id, 0);
  }

  onPlayerLeave(player) {
    this.playerAnswers.delete(player.id);
    this.answeredShort.delete(player.id);
    // if captain left, pass to next member
    const tid = this._teamOf(player.id);
    if (tid) {
      const team = this.equipas.get(tid);
      if (team) {
        team.members = team.members.filter(id => id !== player.id);
        if (team.currentCaptainId === player.id && team.members.length > 0) {
          team.captainIdx     = team.captainIdx % team.members.length;
          team.currentCaptainId = team.members[team.captainIdx];
          this.emitState();
        }
      }
    }
  }

  getPublicState() {
    const q = this.questions[this.qIdx];

    // individual scores
    const scores = [];
    for (const [id, score] of this.scores) {
      const p = this.room.players.get(id);
      if (p) scores.push({ id, name: p.name, score });
    }
    scores.sort((a, b) => b.score - a.score);

    // team scores
    const teamRanking = [];
    for (const [tid, score] of this.teamScores) {
      const t = this.equipas.get(tid);
      if (t) teamRanking.push({ id: tid, name: t.name, color: t.color, score });
    }
    teamRanking.sort((a, b) => b.score - a.score);

    // per-player answer counts for lista progress
    const playerCounts = {};
    for (const [id, set] of this.playerAnswers) playerCounts[id] = set.size;
    const teamCounts = {};
    for (const [tid, set] of this.teamAnswers) teamCounts[tid] = set.size;

    // equipas for lobby/display
    const equipasArr = [...this.equipas.values()].map(t => ({
      id: t.id, name: t.name, color: t.color,
      members: t.members.map(mid => {
        const p = this.room.players.get(mid);
        return { id: mid, name: p?.name || mid };
      }),
      currentCaptainId: t.currentCaptainId,
    }));

    return {
      phase:       this.phase,
      mode:        this.mode,
      qIdx:        this.qIdx,
      totalQ:      TOTAL_Q,
      timeLeft:    this.timeLeft,
      scores,
      teamRanking,
      equipas:     equipasArr,
      playerCounts,
      teamCounts,
      answeredShortCount:     this.answeredShort.size,
      answeredShortTeamsCount: this.answeredShortTeams.size,
      question: q ? {
        id:       q.id,
        tipo:     q.tipo,
        pergunta: q.pergunta,
        total:    q.total ?? q.respostas_aceites.length,
        tempo:    q.tempo,
        respostas_aceites: (this.phase === "reveal" || this.phase === "finished") ? q.respostas_aceites : null,
      } : null,
    };
  }

  getPrivateState(playerId) {
    const acertadas      = this.playerAnswers.get(playerId) || new Set();
    const teamId         = this._teamOf(playerId);
    const teamAcertadas  = teamId ? (this.teamAnswers.get(teamId) || new Set()) : new Set();
    return {
      myAcertadas:    [...acertadas],
      teamAcertadas:  [...teamAcertadas],
      answeredShort:  this.answeredShort.has(playerId),
      teamAnswered:   teamId ? this.answeredShortTeams.has(teamId) : false,
      isCaptain:      this._isCaptain(playerId),
      myTeamId:       teamId,
    };
  }
}
