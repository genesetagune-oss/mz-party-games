import { BaseEngine } from "./baseEngine.js";
import { verificarResposta } from "./sporcleMZVerification.js";

const WAGER_SECS   = 10;
const VOTE_SECS    = 15;
const REVEAL_SECS  = 4;
const NORMAL_Q     = 10;
const TOTAL_ROUNDS = 11;

const TEAM_DEFS = [
  { id: "A", name: "Vermelhos", color: "#EF4444" },
  { id: "B", name: "Azuis",     color: "#3B82F6" },
  { id: "C", name: "Verdes",    color: "#10B981" },
  { id: "D", name: "Amarelos",  color: "#F59E0B" },
];

const BANK = [
  // ── BAIRROS E CIDADES ─────────────────────────────────────
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
  { id:"c12", tipo:"resposta_curta", tempo:15, pergunta:"Qual é a segunda maior cidade de Moçambique?", respostas_aceites:[["matola","beira"]] },
  { id:"c13", tipo:"resposta_curta", tempo:15, pergunta:"Qual cidade costeira é conhecida pelas praias de coral e resorts em Inhambane?", respostas_aceites:[["tofo","praia do tofo"]] },
  { id:"c14", tipo:"resposta_curta", tempo:15, pergunta:"Em que cidade fica o maior estádio de Moçambique (Estádio do Zimpeto)?", respostas_aceites:[["maputo"]] },
  { id:"c15", tipo:"resposta_curta", tempo:15, pergunta:"Qual cidade moçambicana faz fronteira com a África do Sul e é famosa pelos seus casinos?", respostas_aceites:[["ponta do ouro"]] },
  { id:"c16", tipo:"lista", tempo:60, total:6, pergunta:"Nomeia os 6 países que fazem fronteira com Moçambique", respostas_aceites:[["tanzania","tanzânia","tanzánia"],["malawi","malaui","malaví"],["zambia","zâmbia","zámbia"],["zimbabwe","zimbabué","zimbabue","zimbaue"],["eswatini","suazilandia","swazilândia","suazilândia"],["africa do sul","south africa"]] },
  { id:"c17", tipo:"lista", tempo:60, total:5, pergunta:"Nomeia 5 ilhas ou arquipélagos famosos de Moçambique", respostas_aceites:[["ilha de mocambique","ilha de moçambique","ilha moçambique","ilha mozambique"],["bazaruto","ilha do bazaruto","arquipelago do bazaruto"],["quirimbas","arquipelago das quirimbas"],["inhaca","ilha da inhaca"],["ibo","ilha do ibo"]] },
  { id:"c18", tipo:"lista", tempo:60, total:5, pergunta:"Nomeia 5 bairros populares de Maputo", respostas_aceites:[["xipamanine"],["malhazine"],["polana","polana cimento","polana canigo","polana caniço"],["hulene"],["zimpeto"],["chamanculo"],["alto mae","alto maé"],["sommerschield"],["costa do sol"],["albasine"],["t3"],["mafalala"],["laulane"],["mahotas"],["triunfo"]] },
  { id:"c19", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 rios importantes de Moçambique", respostas_aceites:[["zambeze","zambezi","rio zambeze"],["limpopo","rio limpopo"],["save","rio save"],["incomati","incomáti","rio incomati"],["lugela"],["rovuma","rio rovuma"],["buzi","rio buzi"]] },
  { id:"c20", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia as 3 províncias do norte de Moçambique", respostas_aceites:[["niassa"],["cabo delgado"],["nampula"]] },
  { id:"c21", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 províncias do sul de Moçambique", respostas_aceites:[["maputo","maputo cidade","cidade de maputo"],["maputo provincia","provincia de maputo"],["gaza"],["inhambane"]] },
  { id:"c22", tipo:"lista", tempo:60, total:6, pergunta:"Nomeia 6 destinos turísticos de praias em Moçambique", respostas_aceites:[["tofo","praia do tofo"],["vilanculos","vilanculo","vilankulo"],["ponta do ouro"],["pemba"],["bazaruto"],["beira"],["inhambane"],["nacala"],["bilene","sao martinho do bilene"],["macaneta"]] },
  { id:"c23", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 distritos municipais de Maputo", respostas_aceites:[["kampfumo","ka mpfumo","ka-mpfumo"],["kamavota","ka mavota","ka-mavota"],["kamubukwana","ka mubukwana"],["kamaxaquene","ka maxaquene"],["kanyaka","ka nyaka","katembe","ka tembe"]] },
  { id:"c24", tipo:"lista", tempo:60, total:5, pergunta:"Nomeia 5 cidades costeiras de Moçambique", respostas_aceites:[["maputo"],["beira"],["nacala"],["pemba"],["quelimane"],["inhambane"],["mocambique","moçambique","ilha de mocambique"]] },
  { id:"c25", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 reservas naturais ou parques nacionais de Moçambique", respostas_aceites:[["gorongosa","parque da gorongosa","gorongosa national park"],["niassa","reserva do niassa","reserva nacional do niassa"],["zinave","parque nacional do zinave"],["banhine","parque nacional do banhine"],["bazaruto","parque nacional do bazaruto","arquipelago do bazaruto"],["quirimbas","parque nacional das quirimbas"],["maputo special reserve","reserva do maputo","reserva dos elefantes"]] },
  { id:"c26", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 praias famosas da província de Inhambane", respostas_aceites:[["tofo","praia do tofo"],["vilankulo","vilanculos"],["barra","praia da barra"],["morrungulo"],["paindane"],["pomene"],["maxixe"]] },
  { id:"c27", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama a ponte que liga Maputo a Catembe?", respostas_aceites:[["ponte maputo catembe","ponte maputo katembe","ponte da catembe","katembe","catembe"]] },
  { id:"c28", tipo:"lista", tempo:60, total:4, pergunta:"Nomeia os 4 presidentes de Moçambique", respostas_aceites:[["samora machel","samora"],["joaquim chissano","chissano"],["armando guebuza","guebuza"],["filipe nyusi","nyusi"]] },
  { id:"c29", tipo:"resposta_curta", tempo:15, pergunta:"Qual é o ponto mais alto de Moçambique?", respostas_aceites:[["monte binga","binga"]] },
  { id:"c30", tipo:"resposta_curta", tempo:15, pergunta:"Qual é o maior lago de Moçambique?", respostas_aceites:[["lago niassa","niassa","lago malawi","lago nyasa"]] },
  { id:"c31", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama o aeroporto internacional de Maputo?", respostas_aceites:[["aeroporto samora machel","samora machel","aeroporto de maputo","marechal samora machel"]] },
  { id:"c32", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia as 4 províncias do centro de Moçambique", respostas_aceites:[["zambezia","zambézia"],["tete"],["manica"],["sofala"]] },
  { id:"c33", tipo:"resposta_curta", tempo:15, pergunta:"Qual é a maior e mais antiga universidade de Moçambique?", respostas_aceites:[["uem","universidade eduardo mondlane","eduardo mondlane"]] },
  { id:"c34", tipo:"lista", tempo:45, total:5, pergunta:"Nomeia os 5 países africanos de língua portuguesa (PALOPs)", respostas_aceites:[["angola"],["mocambique","moçambique"],["cabo verde"],["sao tome e principe","são tomé e príncipe","sao tome"],["guine bissau","guiné-bissau","guiné bissau"]] },
  { id:"c35", tipo:"resposta_curta", tempo:15, pergunta:"Qual cidade moçambicana é Património Mundial da UNESCO?", respostas_aceites:[["ilha de mocambique","ilha de moçambique","ilha mocambique"]] },

  // ── MÚSICA MZ ─────────────────────────────────────────────
  { id:"m01", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama o género musical urbano criado em Maputo nos anos 2000?", respostas_aceites:[["pandza"]] },
  { id:"m02", tipo:"resposta_curta", tempo:15, pergunta:"Qual é o nome do cantor moçambicano conhecido como 'Rei da Marrabenta'?", respostas_aceites:[["wazimbo","wazimbo ngungunyane"]] },
  { id:"m03", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 artistas conhecidos pelo género pandza", respostas_aceites:[["mr kuka","kuka"],["helio beatz","helio"],["bandjero"],["dj ardiles","ardiles"],["ta basilly","basilly"]] },
  { id:"m04", tipo:"resposta_curta", tempo:15, pergunta:"Qual cantora MZ ficou famosa pela música 'Mamana'?", respostas_aceites:[["mingas"]] },
  { id:"m05", tipo:"resposta_curta", tempo:15, pergunta:"Qual rapper MZ ficou famoso pela música 'Povo no Poder'?", respostas_aceites:[["azagaia","edson da luz"]] },
  { id:"m05b", tipo:"resposta_curta", tempo:15, pergunta:"Qual rapper MZ ficou conhecido por letras de crítica política ao governo Frelimo?", respostas_aceites:[["azagaia","edson da luz"]] },
  { id:"m06", tipo:"resposta_curta", tempo:15, pergunta:"Qual cantora MZ é conhecida pela música 'Djama'?", respostas_aceites:[["neyma"]] },
  { id:"m08", tipo:"resposta_curta", tempo:15, pergunta:"Qual DJ moçambicano ficou famoso pela música 'Tseke'?", respostas_aceites:[["dj ziqo","ziqo"]] },
  { id:"m10", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama o género musical tradicional de Cabo Delgado dançado em celebrações islâmicas?", respostas_aceites:[["tufo"]] },
  { id:"m12", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 novos talentos femininos da música moçambicana", respostas_aceites:[["percella"],["tamyris","tamyris moiane"],["melony"],["stefania"]] },
  { id:"m12b", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 novos talentos masculinos da música moçambicana", respostas_aceites:[["kiba the seven","kiba"],["junior loukinho","loukinho"],["akon g"],["purpleswag","purple swag"],["yung mypro","mypro"]] },
  { id:"m13", tipo:"resposta_curta", tempo:15, pergunta:"Qual rapper MZ ficou popular com a música 'Patrão'?", respostas_aceites:[["mc roger","roger"]] },
  { id:"m14", tipo:"resposta_curta", tempo:15, pergunta:"Qual artista MZ ficou conhecido com a música 'Hello'?", respostas_aceites:[["laylizzy","laylizzy davilson"]] },
  { id:"m16", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 géneros musicais com origem em Moçambique", respostas_aceites:[["marrabenta"],["pandza"],["tufo"],["timbila"],["mapiko"],["xigubo"],["xibelane"]] },
  { id:"m17", tipo:"lista", tempo:60, total:5, pergunta:"Nomeia 5 artistas masculinos moçambicanos", respostas_aceites:[["mr bow","mister bow"],["wazimbo"],["azagaia"],["laylizzy"],["mc roger","roger"],["hot blaze"],["bander"],["dygo boy","dygo"],["purpleswag","purple swag"],["yung mypro","mypro"],["kiba the seven","kiba"],["junior loukinho","loukinho"],["akon g"],["dj ziqo","ziqo"],["mr kuka","kuka"],["valentino de la vega","de la vega"],["hernani da silva","hernani"],["duas caras"],["mark exodus"],["jay arghh"],["helio beatz"],["bandjero"],["djimetta"],["king cizzy"],["twenty fingers"],["doppaz"],["kamane kamas"]] },
  { id:"m17b", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 artistas femininas moçambicanas", respostas_aceites:[["neyma"],["lizha james","lizha"],["tamyris","tamyris moiane"],["mingas"],["marllen"],["lourena nhate","lourena"],["melony"],["stefania"],["percella"],["dama do bling"]] },
  { id:"m19", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 rappers ou artistas de hip-hop moçambicanos", respostas_aceites:[["azagaia"],["laylizzy"],["djimetta"],["hot blaze"],["hernani da silva","hernani"],["jay arghh"],["bander"],["dygo boy","dygo"],["kamane kamas"],["shabba"],["yung mypro","mypro"],["valentino de la vega","de la vega"],["helio beatz"],["bandjero"],["purpleswag","purple swag"]] },
  { id:"m20", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 instrumentos musicais tradicionais de Moçambique", respostas_aceites:[["timbila"],["mbira"],["xitende"],["ngoma"],["nhacasso"],["lupembe"]] },
  { id:"m21", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 artistas africanos (não MZ) muito populares em Moçambique", respostas_aceites:[["burna boy"],["wizkid","wiz kid"],["davido"],["rema"],["nasty c"],["a reece","reece"],["diamond platnumz","diamond"],["deezy"],["monsta"],["c4 pedro","c4"],["anselmo ralph","anselmo"],["plutonio","plutônio"],["matias damasio","matias damásio","matias"],["landrick"],["gerilson israel","gerilson"],["ana joyce"],["calema"],["nga"],["prodigio"],["masta"],["don g"],["3 finer"],["yola semedo","yola"]] },
  { id:"m22", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 danças tradicionais de Moçambique", respostas_aceites:[["mapiko"],["tufo"],["xigubo"],["xibelane"]] },
  { id:"m23", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 artistas MZ conhecidos por música gospel ou cristã", respostas_aceites:[["valdemiro jose","valdemiro"],["deborah duarte","deborah"],["yadah"],["nuno abdul","nuno"],["edmazia","edmazia mayembe"],["justino ubakka","ubakka"]] },
  { id:"m24", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 rótulos de cerveja moçambicana", respostas_aceites:[["2m","dois m"],["laurentina"],["manica"],["txilar"]] },
  { id:"m25", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 podcasts ou influencers MZ conhecidos nas redes sociais", respostas_aceites:[["tu para tu"],["daniel"],["armando"],["victor rener"],["guyzelh","guyzelh ramos"],["cardo","cardo podcast"],["maxh","maxh 258"],["catamo"],["salensio"]] },

  // ── GÍRIAS E EXPRESSÕES ───────────────────────────────────
  { id:"g01", tipo:"resposta_curta", tempo:15, pergunta:"Como se diz 'obrigado' em Changana?", respostas_aceites:[["kanimambo"]] },
  { id:"g04", tipo:"resposta_curta", tempo:15, pergunta:"Como se diz 'carne' em Changana?", respostas_aceites:[["nyama"]] },
  { id:"g05", tipo:"resposta_curta", tempo:15, pergunta:"O que significa 'Salani Kahle' em português?", respostas_aceites:[["adeus","fiquem bem","fique bem","ate logo","até logo","tchau"]] },
  { id:"g16", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 formas de dizer 'amigo' ou 'colega' na gíria MZ", respostas_aceites:[["mano","manu"],["bro"],["maninho"],["edjo"],["boss"],["brada"]] },
  { id:"g18", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 pratos típicos moçambicanos", respostas_aceites:[["matapa"],["xima"],["caril de amendoim","caril amendoim"],["galinha zambeziana","galinha a zambeziana"],["frango cafreal","frango a cafreal"],["chamuças","chamucas"],["badjias"],["lagosta"],["maheu"],["kakana","cacana"],["xiguinha"]] },
  { id:"g19", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 línguas bantu faladas em Moçambique", respostas_aceites:[["changana"],["ronga"],["macua","makua"],["sena"],["ndau"],["tswa"],["chewa"],["yao"],["lomue"],["makonde"]] },
  { id:"g20", tipo:"lista", tempo:30, total:3, pergunta:"Nomeia 3 formas de pagamento usadas no dia a dia em MZ", respostas_aceites:[["metical","mt","meticais"],["mpesa","m-pesa"],["emola","e-mola"],["ponto 24","ponto24","multicaixa"],["rand"],["mkesh","m kesh"]] },
  { id:"g21", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 expressões moçambicanas de cumprimento", respostas_aceites:[["kanimambo"],["salani kahle","salani"],["xewani"],["minjani","minjane"],["nhani"],["como estás","como vai","como esta"],["kmk"],["na boa"],["estás nice","estas nice"],["u bom"],["como é que é","como e que e"]] },
  { id:"g22", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 marcas ou empresas moçambicanas", respostas_aceites:[["2m","dois m"],["laurentina"],["manica"],["txilar"],["movitel"],["tmcel"],["emola"],["mkesh","m kesh"],["millennium bim","bim"],["namaacha"],["miramar"],["stv"],["tv sucesso"]] },
  { id:"g22b", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia 2 designers de moda moçambicanos", respostas_aceites:[["nivaldo thierry","nivaldo"],["taibo bacar","taibo"]] },
  { id:"g24", tipo:"lista", tempo:45, total:4, pergunta:"Nomeia 4 objectos do dia a dia em Moçambique com nomes locais específicos", respostas_aceites:[["capulana"],["chapa"],["txopela"],["catana"],["pilão","pilao"],["baraca","barraca"],["machamba"]] },
  { id:"g25", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 festas ou celebrações culturais em Moçambique", respostas_aceites:[["lobolo"],["mapiko"],["tufo"],["25 de junho","independencia","festa da independencia"],["4 de outubro","dia da paz","festa da paz"]] },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRound() { return shuffle(BANK).slice(0, NORMAL_Q); }

export class SporcleMZEngine extends BaseEngine {
  constructor(params) {
    super(params);
    this.phase = "lobby";
    this.mode  = "equipas";

    this.questions = [];
    this.qIdx      = 0;
    this.timeLeft  = 0;

    // wager system
    this.wagersUsed  = new Map(); // playerId/teamId → number[]
    this.wagerThis   = new Map(); // playerId/teamId → number | null
    this.wagerTimer  = 0;
    this.wagerResults = {};       // playerId → { wager, delta }

    // final round
    this.finalVotes      = new Map();
    this.voteTimer       = 0;
    this.finalDifficulty = null;
    this.finalQuestion   = null;
    this.isFinalRound    = false;

    // individual
    this.scores        = new Map();
    this.playerAnswers = new Map();
    this.answerOrder   = [];
    this.answeredShort = new Set();

    // equipas
    this.equipas             = new Map();
    this.teamScores          = new Map();
    this.teamAnswers         = new Map();
    this.answerOrderTeams    = [];
    this.answeredShortTeams  = new Set();
  }

  // ── wager helpers ─────────────────────────────────────────

  _wagerKeys() {
    return this.mode === "equipas"
      ? [...this.equipas.keys()]
      : [...this.room.players.keys()];
  }

  _initWagers() {
    const keys = this._wagerKeys();
    this.wagersUsed = new Map(keys.map(k => [k, []]));
    this.wagerThis  = new Map(keys.map(k => [k, null]));
  }

  _autoFillWagers(isFinal = false) {
    for (const k of this._wagerKeys()) {
      if (this.wagerThis.get(k) === null) {
        if (isFinal) {
          this.wagerThis.set(k, 0);
        } else {
          const used = this.wagersUsed.get(k) || [];
          const available = [1,2,3,4,5,6,7,8,9,10].filter(v => !used.includes(v));
          this.wagerThis.set(k, available[0] ?? 1);
        }
      }
    }
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
      t.currentCaptainId = t.members.length > 0 ? t.members[t.captainIdx % t.members.length] : null;
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
    this.questions     = pickRound();
    this.qIdx          = 0;
    this.isFinalRound  = false;
    this.finalQuestion = null;
    this.finalDifficulty = null;
    this.wagerResults  = {};
    this._initScores();
    this._initWagers();
    this._startWager();
  }

  _startWager() {
    this.clearTimers();
    this.phase = "wager";
    this.wagerTimer = WAGER_SECS;
    for (const k of this._wagerKeys()) this.wagerThis.set(k, null);
    this.emitState();

    this._setInterval(() => {
      this.wagerTimer = Math.max(0, this.wagerTimer - 1);
      if (this.wagerTimer <= 0) {
        this.clearTimers();
        this._autoFillWagers(false);
        this._startQuestion();
      } else {
        this.emitState();
      }
    }, 1000);
  }

  _startFinalWager() {
    this.clearTimers();
    this.phase = "finalWager";
    this.wagerTimer = WAGER_SECS;
    for (const k of this._wagerKeys()) this.wagerThis.set(k, null);
    this.emitState();

    this._setInterval(() => {
      this.wagerTimer = Math.max(0, this.wagerTimer - 1);
      if (this.wagerTimer <= 0) {
        this.clearTimers();
        this._autoFillWagers(true);
        this._startQuestion();
      } else {
        this.emitState();
      }
    }, 1000);
  }

  _startFinalVote() {
    this.clearTimers();
    this.phase = "finalVote";
    this.finalVotes = new Map();
    this.voteTimer = VOTE_SECS;
    this.emitState();

    this._setInterval(() => {
      this.voteTimer = Math.max(0, this.voteTimer - 1);
      this.emitState();
      if (this.voteTimer <= 0) {
        this.clearTimers();
        this._resolveFinalVote();
      }
    }, 1000);
  }

  _resolveFinalVote() {
    const counts = { facil: 0, media: 0, dificil: 0 };
    for (const v of this.finalVotes.values()) counts[v] = (counts[v] || 0) + 1;
    this.finalDifficulty = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    const usedIds = new Set(this.questions.map(q => q.id));
    const diffFilter = {
      facil:   q => q.tipo === "resposta_curta",
      media:   q => q.tipo === "lista" && (q.total ?? q.respostas_aceites.length) <= 4,
      dificil: q => q.tipo === "lista" && (q.total ?? q.respostas_aceites.length) >= 5,
    }[this.finalDifficulty] ?? (() => true);

    const pool = BANK.filter(q => !usedIds.has(q.id) && diffFilter(q));
    const fallback = BANK.filter(q => !usedIds.has(q.id));
    const src = pool.length > 0 ? pool : fallback.length > 0 ? fallback : BANK;
    this.finalQuestion = src[Math.floor(Math.random() * src.length)];
    this.isFinalRound = true;
    this.emitState();

    this._setTimeout(() => this._startFinalWager(), 2000);
  }

  _startQuestion() {
    this.clearTimers();
    this.phase = "question";
    const q = this.isFinalRound ? this.finalQuestion : this.questions[this.qIdx];
    this.timeLeft            = q.tempo;
    this.playerAnswers       = new Map([...this.room.players.keys()].map(id => [id, new Set()]));
    this.answerOrder         = [];
    this.answeredShort       = new Set();
    this.teamAnswers         = new Map([...this.equipas.keys()].map(id => [id, new Set()]));
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
    const q = this.isFinalRound ? this.finalQuestion : this.questions[this.qIdx];
    if (!q) return;

    const prevScores = new Map(this.scores);
    this.wagerResults = {};

    if (this.mode === "individual") {
      if (q.tipo === "resposta_curta") {
        for (const [id] of this.scores) {
          const wager = this.wagerThis.get(id) ?? 1;
          const correct = this.answeredShort.has(id);
          this.scores.set(id, (this.scores.get(id) || 0) + (correct ? wager : -wager));
          if (!this.isFinalRound) {
            const used = this.wagersUsed.get(id) || [];
            this.wagersUsed.set(id, [...used, wager]);
          }
        }
      } else {
        for (const [id, acertadas] of this.playerAnswers) {
          const wager = this.wagerThis.get(id) ?? 1;
          const total = q.total ?? q.respostas_aceites.length;
          const correct = total > 0 && acertadas.size / total >= 0.5;
          this.scores.set(id, (this.scores.get(id) || 0) + (correct ? wager : -wager));
          if (!this.isFinalRound) {
            const used = this.wagersUsed.get(id) || [];
            this.wagersUsed.set(id, [...used, wager]);
          }
        }
      }
      for (const [id] of this.scores) {
        const wagerKey = id;
        this.wagerResults[id] = {
          wager: this.wagerThis.get(wagerKey) ?? null,
          delta: (this.scores.get(id) || 0) - (prevScores.get(id) || 0),
        };
      }
    } else {
      // equipas
      if (q.tipo === "resposta_curta") {
        for (const [tid] of this.teamScores) {
          const wager = this.wagerThis.get(tid) ?? 1;
          const correct = this.answeredShortTeams.has(tid);
          const delta = correct ? wager : -wager;
          this.teamScores.set(tid, (this.teamScores.get(tid) || 0) + delta);
          const team = this.equipas.get(tid);
          team?.members.forEach(mid => this.scores.set(mid, (this.scores.get(mid) || 0) + delta));
          if (!this.isFinalRound) {
            const used = this.wagersUsed.get(tid) || [];
            this.wagersUsed.set(tid, [...used, wager]);
          }
        }
      } else {
        for (const [tid, acertadas] of this.teamAnswers) {
          const wager = this.wagerThis.get(tid) ?? 1;
          const total = q.total ?? q.respostas_aceites.length;
          const correct = total > 0 && acertadas.size / total >= 0.5;
          const delta = correct ? wager : -wager;
          this.teamScores.set(tid, (this.teamScores.get(tid) || 0) + delta);
          const team = this.equipas.get(tid);
          team?.members.forEach(mid => this.scores.set(mid, (this.scores.get(mid) || 0) + delta));
          if (!this.isFinalRound) {
            const used = this.wagersUsed.get(tid) || [];
            this.wagersUsed.set(tid, [...used, wager]);
          }
        }
      }
      for (const [id] of this.scores) {
        const tid = this._teamOf(id);
        this.wagerResults[id] = {
          wager: tid ? (this.wagerThis.get(tid) ?? null) : null,
          delta: (this.scores.get(id) || 0) - (prevScores.get(id) || 0),
        };
      }
    }
  }

  _nextQ() {
    if (this.isFinalRound) {
      this.phase = "finished";
      this.emitState();
      return;
    }
    this.qIdx++;
    if (this.qIdx >= NORMAL_Q) {
      this._startFinalVote();
    } else {
      this._startWager();
    }
  }

  // ── commands ──────────────────────────────────────────────

  handleCommand(socketId, command) {
    if (this.phase === "lobby") {
      this._handleLobbyCommand(socketId, command);
      return;
    }

    if ((this.phase === "wager" || this.phase === "finalWager") && command.type === "WAGER") {
      this._handleWager(socketId, command);
      return;
    }

    if (this.phase === "finalVote" && command.type === "VOTE_DIFFICULTY") {
      this._handleVote(socketId, command);
      return;
    }

    if (this.mode === "equipas") {
      this._handleEquipasCommand(socketId, command);
    } else {
      this._handleIndividualCommand(socketId, command);
    }
  }

  _handleWager(socketId, command) {
    const isFinal = this.phase === "finalWager";
    const key = this.mode === "equipas" ? this._teamOf(socketId) : socketId;
    if (!key) return;
    if (this.mode === "equipas" && !this._isCaptain(socketId)) return;
    if (this.wagerThis.get(key) !== null) return;

    const { value } = command;
    if (typeof value !== "number") return;

    if (isFinal) {
      if (![0, 10, 20].includes(value)) return;
    } else {
      if (value < 1 || value > 10) return;
      const used = this.wagersUsed.get(key) || [];
      if (used.includes(value)) return;
    }

    this.wagerThis.set(key, value);
    this.emitState();

    const keys = this._wagerKeys();
    if (keys.every(k => this.wagerThis.get(k) !== null)) {
      this.clearTimers();
      this._startQuestion();
    }
  }

  _handleVote(socketId, command) {
    const { vote } = command;
    if (!["facil", "media", "dificil"].includes(vote)) return;
    if (this.finalVotes.has(socketId)) return;
    this.finalVotes.set(socketId, vote);
    this.emitState();

    if (this.finalVotes.size >= this.room.players.size) {
      this.clearTimers();
      this._resolveFinalVote();
    }
  }

  _handleLobbyCommand(socketId, command) {
    if (command.type === "JOIN_TEAM") {
      if (command.teamId && this.equipas.has(command.teamId)) {
        this._assignPlayer(socketId, command.teamId);
        this.emitState();
      }
      return;
    }

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
    const q = this.isFinalRound ? this.finalQuestion : this.questions[this.qIdx];
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
    const q   = this.isFinalRound ? this.finalQuestion : this.questions[this.qIdx];
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
    this.questions     = [];
    this.playerAnswers = new Map();
    this.isFinalRound  = false;
    this.finalQuestion = null;
    this.finalDifficulty = null;
    this.finalVotes    = new Map();
    this.voteTimer     = 0;
    this.wagerTimer    = 0;
    this.wagersUsed    = new Map();
    this.wagerThis     = new Map();
    this.wagerResults  = {};

    if (this.equipas.size > 0) {
      this.equipas.forEach(t => {
        t.members = t.members.filter(id => this.room.players.has(id));
        t.captainIdx = 0;
        t.currentCaptainId = t.members[0] ?? null;
      });
      this.teamScores = new Map([...this.equipas.keys()].map(id => [id, 0]));
      this.scores = new Map([...this.room.players.keys()].map(id => [id, 0]));
    } else {
      this.scores = new Map();
      this.teamScores = new Map();
    }
    this.emitState();
  }

  onPlayerJoin(player) {
    if (!this.scores.has(player.id)) this.scores.set(player.id, 0);
    if (this.mode !== "equipas") {
      if (!this.wagersUsed.has(player.id)) this.wagersUsed.set(player.id, []);
      if (!this.wagerThis.has(player.id)) this.wagerThis.set(player.id, null);
    }
  }

  onPlayerLeave(player) {
    this.playerAnswers.delete(player.id);
    this.answeredShort.delete(player.id);
    this.finalVotes.delete(player.id);

    if (this.mode !== "equipas") {
      this.wagersUsed.delete(player.id);
      this.wagerThis.delete(player.id);
    }

    const tid = this._teamOf(player.id);
    if (tid) {
      const team = this.equipas.get(tid);
      if (team) {
        team.members = team.members.filter(id => id !== player.id);
        if (team.currentCaptainId === player.id && team.members.length > 0) {
          team.captainIdx = team.captainIdx % team.members.length;
          team.currentCaptainId = team.members[team.captainIdx];
        }
      }
    }

    if (this.phase === "wager" || this.phase === "finalWager") {
      const keys = this._wagerKeys();
      if (keys.length > 0 && keys.every(k => this.wagerThis.get(k) !== null)) {
        this.clearTimers();
        this._startQuestion();
      }
    }
    if (this.phase === "finalVote" && this.finalVotes.size >= this.room.players.size) {
      this.clearTimers();
      this._resolveFinalVote();
    }
    this.emitState();
  }

  getPublicState() {
    const q = this.isFinalRound ? this.finalQuestion : this.questions[this.qIdx];

    const scores = [];
    for (const [id, score] of this.scores) {
      const p = this.room.players.get(id);
      if (p) scores.push({ id, name: p.name, score });
    }
    scores.sort((a, b) => b.score - a.score);

    const teamRanking = [];
    for (const [tid, score] of this.teamScores) {
      const t = this.equipas.get(tid);
      if (t) teamRanking.push({ id: tid, name: t.name, color: t.color, score });
    }
    teamRanking.sort((a, b) => b.score - a.score);

    const playerCounts = {};
    for (const [id, set] of this.playerAnswers) playerCounts[id] = set.size;
    const teamCounts = {};
    for (const [tid, set] of this.teamAnswers) teamCounts[tid] = set.size;

    const equipasArr = [...this.equipas.values()].map(t => ({
      id: t.id, name: t.name, color: t.color,
      members: t.members.map(mid => {
        const p = this.room.players.get(mid);
        return { id: mid, name: p?.name || mid };
      }),
      currentCaptainId: t.currentCaptainId,
    }));

    const wagerKeys = this._wagerKeys();
    const wagersIn  = wagerKeys.filter(k => this.wagerThis.get(k) !== null).length;

    return {
      phase:        this.phase,
      mode:         this.mode,
      qIdx:         this.qIdx,
      totalQ:       TOTAL_ROUNDS,
      timeLeft:     this.timeLeft,
      wagerTimer:   this.wagerTimer,
      voteTimer:    this.voteTimer,
      wagersIn,
      totalWagerers: wagerKeys.length,
      finalVoteCount: this.finalVotes.size,
      finalDifficulty: this.finalDifficulty,
      isFinalRound: this.isFinalRound,
      wagerResults: (this.phase === "reveal" || this.phase === "finished") ? this.wagerResults : null,
      scores,
      teamRanking,
      equipas:      equipasArr,
      playerCounts,
      teamCounts,
      answeredShortCount:      this.answeredShort.size,
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
    const acertadas     = this.playerAnswers.get(playerId) || new Set();
    const teamId        = this._teamOf(playerId);
    const teamAcertadas = teamId ? (this.teamAnswers.get(teamId) || new Set()) : new Set();
    const wagerKey      = this.mode === "equipas" ? teamId : playerId;

    return {
      myAcertadas:   [...acertadas],
      teamAcertadas: [...teamAcertadas],
      answeredShort: this.answeredShort.has(playerId),
      teamAnswered:  teamId ? this.answeredShortTeams.has(teamId) : false,
      isCaptain:     this._isCaptain(playerId),
      myTeamId:      teamId,
      myWager:       wagerKey ? (this.wagerThis.get(wagerKey) ?? null) : null,
      myWagersUsed:  wagerKey ? (this.wagersUsed.get(wagerKey) ?? []) : [],
      myVote:        this.finalVotes.get(playerId) ?? null,
    };
  }
}
