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

  // ── HISTÓRIA ──────────────────────────────────────────────
  { id:"h01", tipo:"resposta_curta", tempo:15, pergunta:"Em que ano Moçambique se tornou independente?", respostas_aceites:[["1975"]] },
  { id:"h02", tipo:"resposta_curta", tempo:15, pergunta:"Quem foi o fundador e primeiro presidente da Frelimo?", respostas_aceites:[["eduardo mondlane","mondlane","dr. eduardo mondlane"]] },
  { id:"h03", tipo:"resposta_curta", tempo:15, pergunta:"Em que cidade europeia foi assinado o Acordo Geral de Paz de 1992?", respostas_aceites:[["roma","cidade de roma","roma italia","roma itália"]] },
  { id:"h04", tipo:"resposta_curta", tempo:15, pergunta:"Como se chamava o último rei de Gaza que resistiu aos portugueses?", respostas_aceites:[["ngungunhane","gungunhana","ngungunyane","mudungazi","imperador ngungunhane"]] },
  { id:"h05", tipo:"resposta_curta", tempo:15, pergunta:"Em que país caiu o avião de Samora Machel em 1986?", respostas_aceites:[["africa do sul","áfrica do sul","south africa","mbuzini","rsa"]] },
  { id:"h06", tipo:"resposta_curta", tempo:15, pergunta:"Qual o nome da activista e primeira mulher da luta armada, esposa de Samora Machel?", respostas_aceites:[["josina machel","josina","josina abiathar muthemba"]] },
  { id:"h07", tipo:"resposta_curta", tempo:15, pergunta:"Em que ano começou a Luta Armada de Libertação Nacional em Moçambique?", respostas_aceites:[["1964"]] },
  { id:"h08", tipo:"resposta_curta", tempo:15, pergunta:"Em que ano foi assassinado Eduardo Mondlane?", respostas_aceites:[["1969"]] },
  { id:"h09", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama o feriado que celebra os Heróis Moçambicanos?", respostas_aceites:[["3 de fevereiro","tres de fevereiro","três de fevereiro","dia dos herois","dia dos heróis","dia dos herois mocambicanos","dia dos heróis moçambicanos"]] },
  { id:"h10", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia os 2 partidos principais que combateram na guerra civil moçambicana", respostas_aceites:[["frelimo","frente de libertacao de mocambique"],["renamo","resistencia nacional mocambicana"]] },
  { id:"h11", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 datas comemoradas como feriados nacionais em Moçambique", respostas_aceites:[["25 de junho","25 junho","vinte e cinco de junho","dia da independencia","independencia","independência"],["3 de fevereiro","tres de fevereiro","três de fevereiro","dia dos herois","dia dos heróis"],["25 de setembro","25 setembro","dia das fadm","fadm","dia da luta armada","luta armada"],["7 de setembro","sete de setembro","acordos de lusaka","lusaka","dia da vitoria"],["4 de outubro","quatro de outubro","dia da paz","acordo de paz"],["1 de maio","primeiro de maio","dia do trabalhador","dia dos trabalhadores"],["8 de março","8 de marco","dia da mulher","dia internacional da mulher","dia da mulher mocambicana"],["10 de novembro","dez de novembro","dia da cidade de maputo","dia de maputo"]] },
  { id:"h12", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 figuras heróicas da história de Moçambique", respostas_aceites:[["samora machel","samora"],["eduardo mondlane","mondlane"],["josina machel","josina"],["ngungunhane","gungunhana","ngungunyane"],["marcelino dos santos","marcelino"],["filipe magaia","magaia"],["uria simango","simango"],["graca machel","graça machel"]] },
  { id:"h13", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama a estrutura de Maputo desenhada por Gustave Eiffel?", respostas_aceites:[["casa de ferro","casa do ferro"]] },
  { id:"h14", tipo:"resposta_curta", tempo:15, pergunta:"Qual foi o primeiro presidente da Tanzânia, que tem uma avenida com o seu nome em Maputo?", respostas_aceites:[["julius nyerere","nyerere","mwalimu nyerere","julius mwalimu nyerere"]] },
  { id:"h15", tipo:"resposta_curta", tempo:15, pergunta:"Qual é a única mulher da história a ser casada com dois presidentes (Samora Machel e Nelson Mandela)?", respostas_aceites:[["graca machel","graça machel","graca simbine machel","graça simbine machel"]] },
  { id:"h16", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama o massacre de 1960 que despoletou a luta armada em Moçambique?", respostas_aceites:[["massacre de mueda","massacre da mueda","massacre mueda","mueda"]] },
  { id:"h17", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia os 2 países africanos que têm todas as 5 vogais no nome", respostas_aceites:[["mocambique","moçambique","mozambique"],["guine equatorial","guiné equatorial","equatorial guinea","guine ecuatorial"]] },

  // ── LITERATURA ────────────────────────────────────────────
  { id:"l01", tipo:"resposta_curta", tempo:15, pergunta:"Qual escritor moçambicano é autor de \"Terra Sonâmbula\"?", respostas_aceites:[["mia couto","antonio emilio leite couto","antónio emílio leite couto"]] },
  { id:"l02", tipo:"resposta_curta", tempo:15, pergunta:"Qual poeta é considerado o \"pai da literatura moçambicana\"?", respostas_aceites:[["jose craveirinha","josé craveirinha","craveirinha","jose joao craveirinha"]] },
  { id:"l03", tipo:"resposta_curta", tempo:15, pergunta:"Qual escritora MZ é autora de \"Balada de Amor ao Vento\"?", respostas_aceites:[["paulina chiziane","chiziane"]] },
  { id:"l04", tipo:"resposta_curta", tempo:15, pergunta:"Qual poetisa é conhecida como a \"mãe dos poetas moçambicanos\"?", respostas_aceites:[["noemia de sousa","noémia de sousa","noemia sousa","noémia sousa","noemia"]] },
  { id:"l05", tipo:"resposta_curta", tempo:15, pergunta:"Qual escritor moçambicano é autor de \"Ualalapi\", sobre o rei Ngungunhane?", respostas_aceites:[["ungulani ba ka khosa","ungulani","ba ka khosa","francisco esau cossa"]] },
  { id:"l06", tipo:"resposta_curta", tempo:15, pergunta:"Que prémio internacional prestigiado ganhou Mia Couto em 2013?", respostas_aceites:[["premio camoes","prémio camões","camoes","camões"]] },
  { id:"l07", tipo:"resposta_curta", tempo:15, pergunta:"Qual foi a 1ª mulher africana a ganhar o Prémio Camões, em 2021?", respostas_aceites:[["paulina chiziane","chiziane"]] },
  { id:"l08", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 obras conhecidas da literatura moçambicana", respostas_aceites:[["terra sonambula","terra sonâmbula"],["ualalapi"],["balada de amor ao vento","balada de amor"],["nos matamos o cao tinhoso","nós matámos o cão tinhoso","cao tinhoso","cão tinhoso"],["karingana wa karingana","karingana"],["a confissao da leoa","a confissão da leoa","confissao da leoa"],["o ultimo voo do flamingo","o último voo do flamingo","ultimo voo do flamingo"],["mulheres de cinzas"],["xitala mati"],["neighbours"],["a varanda do frangipani","varanda do frangipani"]] },
  { id:"l09", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 escritores ou poetas moçambicanos", respostas_aceites:[["mia couto","couto"],["jose craveirinha","josé craveirinha","craveirinha"],["paulina chiziane","chiziane"],["noemia de sousa","noémia de sousa","noemia"],["ungulani ba ka khosa","ungulani"],["luis bernardo honwana","luís bernardo honwana","honwana"],["joao paulo borges coelho","joão paulo borges coelho","borges coelho"],["lilia momple","lília momplé","momple","momplé"],["rui knopfli","knopfli"],["marcelino dos santos","marcelino"],["eduardo white"],["sebastiao alba","sebastião alba"],["odete semedo","odete costa semedo"]] },
  { id:"l10", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia 2 mulheres da literatura moçambicana", respostas_aceites:[["paulina chiziane","chiziane"],["noemia de sousa","noémia de sousa","noemia"],["lilia momple","lília momplé","momple","momplé"],["odete semedo","odete costa semedo"],["sonia sultuane","sónia sultuane","sultuane"]] },
  { id:"l11", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 poetas moçambicanos", respostas_aceites:[["jose craveirinha","josé craveirinha","craveirinha"],["noemia de sousa","noémia de sousa","noemia"],["rui knopfli","knopfli"],["marcelino dos santos","marcelino"],["sebastiao alba","sebastião alba"],["eduardo white"],["odete semedo","odete costa semedo"],["gloria de sant'anna","glória de sant'anna","sant'anna"]] },
  { id:"l12", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia 2 moçambicanos que ganharam o Prémio Camões", respostas_aceites:[["jose craveirinha","josé craveirinha","craveirinha"],["mia couto","couto"],["paulina chiziane","chiziane"]] },

  // ── DESPORTO ──────────────────────────────────────────────
  { id:"d01", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama a selecção nacional masculina de futebol de Moçambique?", respostas_aceites:[["mambas","os mambas"]] },
  { id:"d02", tipo:"resposta_curta", tempo:15, pergunta:"Qual atleta moçambicana ganhou ouro olímpico nos 800m em Sydney 2000?", respostas_aceites:[["maria mutola","mutola","maria de lurdes mutola"]] },
  { id:"d03", tipo:"resposta_curta", tempo:15, pergunta:"Que jogador nascido em Lourenço Marques ganhou a Bola de Ouro em 1965?", respostas_aceites:[["eusebio","eusébio","eusebio da silva ferreira","pantera negra"]] },
  { id:"d04", tipo:"resposta_curta", tempo:15, pergunta:"Qual estádio nacional foi inaugurado em Maputo em 2011?", respostas_aceites:[["zimpeto","estadio do zimpeto","estádio do zimpeto","estadio nacional do zimpeto"]] },
  { id:"d05", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 clubes de futebol moçambicanos", respostas_aceites:[["costa do sol","gd costa do sol"],["ferroviario de maputo","ferroviário de maputo","ferroviario maputo"],["desportivo de maputo","desportivo maputo","gd desportivo"],["maxaquene","gd maxaquene"],["uniao desportiva do songo","união desportiva do songo","songo","ud songo"],["ferroviario da beira","ferroviário da beira","ferroviario beira"],["ferroviario de nampula","ferroviário de nampula","ferroviario nampula"],["black bulls","black bulls fc"],["textafrica","textáfrica","textafrica do chimoio"],["liga muculmana","liga muçulmana","liga desportiva muculmana"],["hcb","hcb songo","hcb tete"]] },
  { id:"d06", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 estádios de futebol em Moçambique", respostas_aceites:[["zimpeto","estadio do zimpeto","estádio do zimpeto"],["machava","estadio da machava","estádio da machava","estadio nacional da machava"],["costa do sol","estadio costa do sol"],["ferroviario","estadio do ferroviario","campo do ferroviario"],["1 de maio","primeiro de maio","estadio 1 de maio","estadio primeiro de maio"],["chidenguele","estadio de chidenguele"]] },
  { id:"d07", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 modalidades desportivas populares em Moçambique", respostas_aceites:[["futebol","futbol"],["atletismo"],["basquetebol","basquete"],["futebol de praia","beach soccer"],["voleibol","volei","vólei"],["hoquei em patins","hóquei em patins","hoquei"],["boxe","boxing"],["tenis","ténis"],["judo","judô"],["karate","karaté"],["natacao","natação"]] },
  { id:"d08", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 jogadores de futebol moçambicanos", respostas_aceites:[["eusebio","eusébio","pantera negra"],["tico tico","tico-tico","manuel bucuane","bucuane"],["simao mate","simão mate","simao mate junior","simão mate júnior"],["elias pelembe","pelembe"],["mexer","fernando sitoe"],["reginaldo faife","reginaldo"],["stanley ratifo","ratifo"],["reinildo mandava","reinildo","mandava"],["geny catamo","catamo","geny"],["dominguez","joao domingues"]] },
  { id:"d09", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia 2 atletas moçambicanos famosos internacionalmente", respostas_aceites:[["maria mutola","mutola"],["eusebio","eusébio"],["kurt couto"],["tico tico","tico-tico","manuel bucuane"],["reinildo mandava","reinildo","mandava"],["geny catamo","catamo","geny"]] },
  { id:"d10", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia 2 títulos importantes ganhos por Maria Mutola", respostas_aceites:[["ouro olimpico sydney 2000","ouro sydney 2000","ouro olimpico 2000","sydney 2000","medalha de ouro olimpica"],["campea mundial","campea do mundo","campeonato do mundo","mundial 1993","mundial 2001","mundial 2003","tri campea mundial"],["bronze atlanta 1996","bronze olimpico atlanta","medalha bronze atlanta"],["ouro jogos da commonwealth","ouro commonwealth","commonwealth games"]] },
  { id:"d11", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama o campeonato nacional de futebol de Moçambique?", respostas_aceites:[["mocambola","moçambola","campeonato mocambola","liga mocambola","liga moçambola"]] },
  { id:"d12", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 clubes que já ganharam o Moçambola", respostas_aceites:[["costa do sol","gd costa do sol"],["ferroviario de maputo","ferroviário de maputo","ferroviario maputo"],["desportivo de maputo","desportivo maputo","gd desportivo"],["maxaquene","gd maxaquene"],["uniao desportiva do songo","união desportiva do songo","songo","ud songo"],["ferroviario da beira","ferroviário da beira","ferroviario beira"],["textafrica","textáfrica","textafrica do chimoio"],["black bulls","black bulls fc"]] },
  { id:"d13", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 jogadores moçambicanos com carreira em clubes europeus", respostas_aceites:[["eusebio","eusébio","pantera negra"],["tico tico","tico-tico","manuel bucuane","bucuane"],["simao mate","simão mate","simao mate junior"],["mexer","fernando sitoe"],["reinildo mandava","reinildo","mandava"],["geny catamo","catamo","geny"],["elias pelembe","pelembe"],["reginaldo faife","reginaldo"]] },

  // ── TV / CINEMA ───────────────────────────────────────────
  { id:"t01", tipo:"resposta_curta", tempo:15, pergunta:"Qual é o principal canal privado de TV de Moçambique?", respostas_aceites:[["stv","soico tv","soico"]] },
  { id:"t02", tipo:"resposta_curta", tempo:15, pergunta:"Qual comediante/YouTuber tem hoje o maior canal em Moçambique?", respostas_aceites:[["maxh258","maxh","maxh 258","max 258"]] },
  { id:"t03", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 canais de TV moçambicanos", respostas_aceites:[["stv","soico tv"],["tvm","televisao de mocambique","televisão de moçambique"],["miramar","tv miramar"],["tim","tv independente","tv independente de mocambique"],["tv sucesso"]] },
  { id:"t04", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 apresentadores ou personalidades de TV moçambicanos", respostas_aceites:[["puto aires","aires"],["sergio ramos","sérgio ramos","sergio","sérgio"],["dygo boy","dygo"],["fred"],["neyma nacimo","neyma","nacimo"],["sara sittoe","sara"]] },
  { id:"t05", tipo:"lista", tempo:45, total:3, pergunta:"Nomeia 3 comediantes moçambicanos populares", respostas_aceites:[["maxh258","maxh","maxh 258"],["mayra santos","mayra"],["noslen araujo","noslen araújo","noslen"],["wanaki"]] },
  { id:"t06", tipo:"resposta_curta", tempo:15, pergunta:"Qual é o filme moçambicano dirigido por Alcy Caluamba?", respostas_aceites:[["caly"]] },

  // ── GASTRONOMIA (extra) ───────────────────────────────────
  { id:"gm01", tipo:"resposta_curta", tempo:15, pergunta:"Como se chama a bebida alcoólica caseira MZ, forte, feita de cana ou fruta fermentada?", respostas_aceites:[["tontonto","kachasu","aguardente caseira"]] },
  { id:"gm02", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia 2 bebidas tradicionais moçambicanas (não cerveja)", respostas_aceites:[["maheu"],["tontonto","kachasu"],["sura"],["uputo"],["chibuku"]] },
  { id:"gm03", tipo:"lista", tempo:30, total:2, pergunta:"Nomeia 2 pratos moçambicanos com peixe ou marisco", respostas_aceites:[["caril de camarao","caril de camarão","caril camarao"],["lagosta grelhada","lagosta"],["matapa de siri-siri","matapa de siri siri","matapa siri siri"],["peixe a zambeziana","peixe à zambeziana","peixe zambeziana"],["cabidela de peixe","cabidela"],["lulas grelhadas","lulas"]] },
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
    this.mode  = "individual";

    this.questions = [];
    this.qIdx      = 0;
    this.timeLeft  = 0;

    // Host-toggled: default OFF for a simpler, faster loop. When true, the
    // pre-question wager phase runs and scoring uses wager multipliers.
    // When false, we skip straight to the question and score 1 pt per
    // correct short answer / 1 pt per correct list item (classic Sporcle).
    this.wagerMode = false;

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

  // ── reconnect ─────────────────────────────────────────────
  remapPlayerId(oldId, newId) {
    if (oldId === newId) return;
    const remapMap = (m) => {
      if (!m || !m.has(oldId)) return;
      m.set(newId, m.get(oldId));
      m.delete(oldId);
    };
    const remapSet = (s) => {
      if (!s || !s.has(oldId)) return;
      s.add(newId);
      s.delete(oldId);
    };
    remapMap(this.wagersUsed);
    remapMap(this.wagerThis);
    remapMap(this.finalVotes);
    remapMap(this.scores);
    remapMap(this.playerAnswers);
    remapSet(this.answeredShort);
    if (Array.isArray(this.answerOrder)) {
      this.answerOrder = this.answerOrder.map((id) => (id === oldId ? newId : id));
    }
    if (this.wagerResults && Object.prototype.hasOwnProperty.call(this.wagerResults, oldId)) {
      this.wagerResults[newId] = this.wagerResults[oldId];
      delete this.wagerResults[oldId];
    }
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

  setSettings(socketId, settings = {}) {
    const me = this.room.players.get(socketId);
    if (!me?.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.phase !== "lobby") return this.emitError(socketId, "NOT_IN_LOBBY");
    if (typeof settings.wagerMode === "boolean") {
      this.wagerMode = settings.wagerMode;
    }
    this.emitState();
  }

  startGame(socketId) {
    const me = this.room.players.get(socketId);
    if (!me?.isHost || this.phase !== "lobby") return;
    if (this.room.players.size < 2) return;
    this.questions     = pickRound();
    this.qIdx          = 0;
    this.isFinalRound  = false;
    this.finalQuestion = null;
    this.finalDifficulty = null;
    this.wagerResults  = {};
    this._initScores();
    this._initWagers();
    // Wager mode OFF → skip the pre-question wager phase entirely.
    if (this.wagerMode) this._startWager();
    else this._startQuestion();
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

    this._setTimeout(() => {
      if (this.wagerMode) this._startFinalWager();
      else { this.isFinalRound = true; this._startQuestion(); }
    }, 2000);
  }

  _startQuestion() {
    this.clearTimers();
    this.phase = "question";
    const q = this.isFinalRound ? this.finalQuestion : this.questions[this.qIdx];
    this.timeLeft            = q.tempo;
    this.playerAnswers = new Map([...this.room.players.keys()].map(id => [id, new Set()]));
    this.answerOrder   = [];
    this.answeredShort = new Set();
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
    this.emitState();
    this._setTimeout(() => this._nextQ(), REVEAL_SECS * 1000);
  }

  _atribuirPontos() {
    const q = this.isFinalRound ? this.finalQuestion : this.questions[this.qIdx];
    if (!q) return;

    const prevScores = new Map(this.scores);
    this.wagerResults = {};

    if (q.tipo === "resposta_curta") {
      for (const [id] of this.scores) {
        const correct = this.answeredShort.has(id);
        if (this.wagerMode) {
          // Wager mode: correct = +wager, wrong = -wager.
          const wager = this.wagerThis.get(id) ?? 1;
          this.scores.set(id, (this.scores.get(id) || 0) + (correct ? wager : -wager));
          if (!this.isFinalRound) {
            const used = this.wagersUsed.get(id) || [];
            this.wagersUsed.set(id, [...used, wager]);
          }
        } else {
          // Classic Sporcle: correct = +1, wrong = 0 (no penalty).
          if (correct) this.scores.set(id, (this.scores.get(id) || 0) + 1);
        }
      }
    } else {
      for (const [id, acertadas] of this.playerAnswers) {
        if (this.wagerMode) {
          // Proportional payout: points = wager * (correct / required).
          const wager = this.wagerThis.get(id) ?? 1;
          const total = q.total ?? q.respostas_aceites.length;
          const payout = total > 0 ? Math.round(wager * (acertadas.size / total)) : 0;
          this.scores.set(id, (this.scores.get(id) || 0) + payout);
          if (!this.isFinalRound) {
            const used = this.wagersUsed.get(id) || [];
            this.wagersUsed.set(id, [...used, wager]);
          }
        } else {
          // Classic Sporcle: 1 point per correct answer named.
          this.scores.set(id, (this.scores.get(id) || 0) + acertadas.size);
        }
      }
    }
    for (const [id] of this.scores) {
      this.wagerResults[id] = {
        wager: this.wagerMode ? (this.wagerThis.get(id) ?? null) : null,
        delta: (this.scores.get(id) || 0) - (prevScores.get(id) || 0),
      };
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

    this._handleIndividualCommand(socketId, command);
  }

  _handleWager(socketId, command) {
    const isFinal = this.phase === "finalWager";
    const key = socketId;
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

  _handleLobbyCommand(_socketId, _command) {
    // no lobby commands needed for individual mode
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

    this.scores = new Map();
    this.emitState();
  }

  onPlayerJoin(player) {
    if (!this.scores.has(player.id)) this.scores.set(player.id, 0);
    if (!this.wagersUsed.has(player.id)) this.wagersUsed.set(player.id, []);
    if (!this.wagerThis.has(player.id)) this.wagerThis.set(player.id, null);
  }

  onPlayerLeave(player) {
    this.playerAnswers.delete(player.id);
    this.answeredShort.delete(player.id);
    this.finalVotes.delete(player.id);
    this.wagersUsed.delete(player.id);
    this.wagerThis.delete(player.id);

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

    const playerCounts = {};
    for (const [id, set] of this.playerAnswers) playerCounts[id] = set.size;

    const players = [...this.room.players.keys()];
    const wagersIn = players.filter(id => this.wagerThis.get(id) !== null).length;

    return {
      phase:          this.phase,
      wagerMode:      this.wagerMode,
      qIdx:           this.qIdx,
      totalQ:         TOTAL_ROUNDS,
      timeLeft:       this.timeLeft,
      wagerTimer:     this.wagerTimer,
      voteTimer:      this.voteTimer,
      wagersIn,
      totalWagerers:  players.length,
      finalVoteCount: this.finalVotes.size,
      finalDifficulty: this.finalDifficulty,
      isFinalRound:   this.isFinalRound,
      wagerResults:   (this.phase === "reveal" || this.phase === "finished") ? this.wagerResults : null,
      scores,
      playerCounts,
      answeredShortCount: this.answeredShort.size,
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
    const acertadas = this.playerAnswers.get(playerId) || new Set();
    return {
      myAcertadas:   [...acertadas],
      answeredShort: this.answeredShort.has(playerId),
      myWager:       this.wagerThis.get(playerId) ?? null,
      myWagersUsed:  this.wagersUsed.get(playerId) ?? [],
      myVote:        this.finalVotes.get(playerId) ?? null,
    };
  }
}
