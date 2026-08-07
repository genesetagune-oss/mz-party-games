// Agente Secreto (Undercover-style).
// Cada palavra tem uma `hint` — uma palavra única relacionada que se dá ao
// impostor. Ex.: palavra "Cachorro" → hint "Latir" (evoca sem revelar).
// Format inspirado nas apps que usamos como referência.

export const CATEGORIAS = [
  { id: "simples",  nome: "Palavras simples", emoji: "🎯" },
  { id: "mz",       nome: "Moçambique",       emoji: "🇲🇿" },
  { id: "comida",   nome: "Comida",           emoji: "🍕" },
  { id: "animais",  nome: "Animais",          emoji: "🐾" },
  { id: "desporto", nome: "Desporto",         emoji: "⚽" },
];

export const AGENTE_SECRETO_WORDS = [
  // ── PALAVRAS SIMPLES ──────────────────────────────────────
  { palavra: "Cadeira",       hint: "Sentar",       categorias: ["simples"] },
  { palavra: "Mesa",          hint: "Jantar",       categorias: ["simples"] },
  { palavra: "Chave",         hint: "Fechadura",    categorias: ["simples"] },
  { palavra: "Porta",         hint: "Bater",        categorias: ["simples"] },
  { palavra: "Janela",        hint: "Vidro",        categorias: ["simples"] },
  { palavra: "Livro",         hint: "Ler",          categorias: ["simples"] },
  { palavra: "Almofada",      hint: "Sofá",         categorias: ["simples"] },
  { palavra: "Cobertor",      hint: "Cama",         categorias: ["simples"] },
  { palavra: "Toalha",        hint: "Banho",        categorias: ["simples"] },
  { palavra: "Espelho",       hint: "Reflexo",      categorias: ["simples"] },
  { palavra: "Vela",          hint: "Chama",        categorias: ["simples"] },
  { palavra: "Tesoura",       hint: "Cortar",       categorias: ["simples"] },
  { palavra: "Cola",          hint: "Colar",        categorias: ["simples"] },
  { palavra: "Guarda-chuva",  hint: "Chuva",        categorias: ["simples"] },
  { palavra: "Cadeado",       hint: "Segurança",    categorias: ["simples"] },
  { palavra: "Vassoura",      hint: "Limpar",       categorias: ["simples"] },
  { palavra: "Colher",        hint: "Sopa",         categorias: ["simples"] },
  { palavra: "Garfo",         hint: "Espetar",      categorias: ["simples"] },
  { palavra: "Faca",          hint: "Corte",        categorias: ["simples"] },
  { palavra: "Chinelo",       hint: "Praia",        categorias: ["simples"] },
  { palavra: "Meia",          hint: "Pé",           categorias: ["simples"] },
  { palavra: "Casaco",        hint: "Frio",         categorias: ["simples"] },
  { palavra: "Chapéu",        hint: "Cabeça",       categorias: ["simples"] },
  { palavra: "Óculos",        hint: "Vista",        categorias: ["simples"] },
  { palavra: "Relógio",       hint: "Tempo",        categorias: ["simples"] },
  { palavra: "Telemóvel",     hint: "Chamada",      categorias: ["simples"] },
  { palavra: "Comando",       hint: "Televisão",    categorias: ["simples"] },
  { palavra: "Câmara",        hint: "Foto",         categorias: ["simples"] },
  { palavra: "Escada",        hint: "Subir",        categorias: ["simples"] },
  { palavra: "Cortina",       hint: "Sombra",       categorias: ["simples"] },
  { palavra: "Cinto",         hint: "Cintura",      categorias: ["simples"] },
  { palavra: "Caneta",        hint: "Escrever",     categorias: ["simples"] },
  { palavra: "Lápis",         hint: "Grafite",      categorias: ["simples"] },
  { palavra: "Panela",        hint: "Cozinhar",     categorias: ["simples"] },
  { palavra: "Frigideira",    hint: "Fritar",       categorias: ["simples"] },
  { palavra: "Copo",          hint: "Beber",        categorias: ["simples"] },
  { palavra: "Prato",         hint: "Comer",        categorias: ["simples"] },
  { palavra: "Auscultadores", hint: "Música",       categorias: ["simples"] },
  { palavra: "Tatuagem",      hint: "Tinta",        categorias: ["simples"] },
  { palavra: "Corda",         hint: "Amarrar",      categorias: ["simples"] },
  { palavra: "Ventoinha",     hint: "Vento",        categorias: ["simples"] },
  { palavra: "Atacadores",    hint: "Sapato",       categorias: ["simples"] },

  // ── MOÇAMBIQUE ────────────────────────────────────────────
  { palavra: "Capulana",             hint: "Tecido",       categorias: ["mz"] },
  { palavra: "Chapa",                hint: "Transporte",   categorias: ["mz"] },
  { palavra: "Txopela",              hint: "Motociclo",    categorias: ["mz"] },
  { palavra: "Machamba",             hint: "Terra",        categorias: ["mz"] },
  { palavra: "Curandeiro",           hint: "Ervas",        categorias: ["mz"] },
  { palavra: "Barraca",              hint: "Cerveja",      categorias: ["mz"] },
  { palavra: "Catana",               hint: "Lâmina",       categorias: ["mz"] },
  { palavra: "Kanimambo",            hint: "Obrigado",     categorias: ["mz"] },
  { palavra: "Estádio",              hint: "Futebol",      categorias: ["mz"] },
  { palavra: "Chamussa",             hint: "Fritar",       categorias: ["mz", "comida"] },
  { palavra: "Matapa",               hint: "Folhas",       categorias: ["mz", "comida"] },
  { palavra: "Xima",                 hint: "Farinha",      categorias: ["mz", "comida"] },
  { palavra: "Maheu",                hint: "Milho",        categorias: ["mz", "comida"] },
  { palavra: "Piri-piri",            hint: "Picante",      categorias: ["mz", "comida"] },
  { palavra: "Badjias",              hint: "Feijão",       categorias: ["mz", "comida"] },
  { palavra: "Frango à Zambeziana",  hint: "Zambézia",     categorias: ["mz", "comida"] },
  { palavra: "Bolinho de coco",      hint: "Coco",         categorias: ["mz", "comida"] },
  { palavra: "Cacana",               hint: "Amargo",       categorias: ["mz", "comida"] },
  { palavra: "Amendoim",             hint: "Torrar",       categorias: ["mz", "comida"] },
  { palavra: "2M",                   hint: "Marrabenta",   categorias: ["mz", "comida"] },
  { palavra: "Laurentina",           hint: "Preta",        categorias: ["mz", "comida"] },
  { palavra: "Mabolo",               hint: "Fruta",        categorias: ["mz", "comida"] },
  { palavra: "Canhu",                hint: "Nyembeti",     categorias: ["mz", "comida"] },
  { palavra: "Simba",                hint: "Chocolate",    categorias: ["mz", "comida"] },

  // ── COMIDA (universal) ────────────────────────────────────
  { palavra: "Pizza",         hint: "Italiana",     categorias: ["comida"] },
  { palavra: "Hambúrguer",    hint: "McDonald's",   categorias: ["comida"] },
  { palavra: "Sushi",         hint: "Japonês",      categorias: ["comida"] },
  { palavra: "Chocolate",     hint: "Doce",         categorias: ["comida"] },
  { palavra: "Café",          hint: "Manhã",        categorias: ["comida"] },
  { palavra: "Chá",           hint: "Erva",         categorias: ["comida"] },
  { palavra: "Leite",         hint: "Vaca",         categorias: ["comida"] },
  { palavra: "Sumo",          hint: "Fruta",        categorias: ["comida"] },
  { palavra: "Pão",           hint: "Padaria",      categorias: ["comida"] },
  { palavra: "Queijo",        hint: "Amarelo",      categorias: ["comida"] },
  { palavra: "Ovos",          hint: "Galinha",      categorias: ["comida"] },
  { palavra: "Bolo",          hint: "Aniversário",  categorias: ["comida"] },
  { palavra: "Sanduíche",     hint: "Almoço",       categorias: ["comida"] },
  { palavra: "Sopa",          hint: "Quente",       categorias: ["comida"] },
  { palavra: "Salada",        hint: "Verde",        categorias: ["comida"] },
  { palavra: "Batata frita",  hint: "Óleo",         categorias: ["comida"] },
  { palavra: "Pipoca",        hint: "Cinema",       categorias: ["comida"] },
  { palavra: "Iogurte",       hint: "Fresco",       categorias: ["comida"] },
  { palavra: "Cerveja",       hint: "Álcool",       categorias: ["comida"] },
  { palavra: "Vinho",         hint: "Uva",          categorias: ["comida"] },
  { palavra: "Água",          hint: "Sede",         categorias: ["comida"] },
  { palavra: "Manga",         hint: "Tropical",     categorias: ["comida"] },
  { palavra: "Banana",        hint: "Macaco",       categorias: ["comida"] },
  { palavra: "Papaia",        hint: "Laranja",      categorias: ["comida"] },
  { palavra: "Melancia",      hint: "Verão",        categorias: ["comida"] },
  { palavra: "Uva",           hint: "Cacho",        categorias: ["comida"] },
  { palavra: "Maçã",          hint: "Newton",       categorias: ["comida"] },
  { palavra: "Ananás",        hint: "Espinho",      categorias: ["comida"] },
  { palavra: "Morango",       hint: "Vermelho",     categorias: ["comida"] },
  { palavra: "Magnum",        hint: "Gelado",       categorias: ["comida"] },
  { palavra: "Arroz",         hint: "Grão",         categorias: ["comida"] },
  { palavra: "Esparguete",    hint: "Massa",        categorias: ["comida"] },

  // ── ANIMAIS ───────────────────────────────────────────────
  { palavra: "Cachorro",      hint: "Latir",        categorias: ["animais"] },
  { palavra: "Gato",          hint: "Miar",         categorias: ["animais"] },
  { palavra: "Cavalo",        hint: "Corrida",      categorias: ["animais"] },
  { palavra: "Vaca",          hint: "Leite",        categorias: ["animais"] },
  { palavra: "Porco",         hint: "Bacon",        categorias: ["animais"] },
  { palavra: "Galinha",       hint: "Ovo",          categorias: ["animais"] },
  { palavra: "Pato",          hint: "Lago",         categorias: ["animais"] },
  { palavra: "Peru",          hint: "Natal",        categorias: ["animais"] },
  { palavra: "Coelho",        hint: "Páscoa",       categorias: ["animais"] },
  { palavra: "Rato",          hint: "Queijo",       categorias: ["animais"] },
  { palavra: "Leão",          hint: "Rei",          categorias: ["animais"] },
  { palavra: "Tigre",         hint: "Riscas",       categorias: ["animais"] },
  { palavra: "Elefante",      hint: "Tromba",       categorias: ["animais"] },
  { palavra: "Zebra",         hint: "Passadeira",   categorias: ["animais"] },
  { palavra: "Girafa",        hint: "Pescoço",      categorias: ["animais"] },
  { palavra: "Macaco",        hint: "Banana",       categorias: ["animais"] },
  { palavra: "Cobra",         hint: "Veneno",       categorias: ["animais"] },
  { palavra: "Crocodilo",     hint: "Réptil",       categorias: ["animais"] },
  { palavra: "Hipopótamo",    hint: "Rio",          categorias: ["animais"] },
  { palavra: "Rinoceronte",   hint: "Corno",        categorias: ["animais"] },
  { palavra: "Golfinho",      hint: "Nadar",        categorias: ["animais"] },
  { palavra: "Baleia",        hint: "Oceano",       categorias: ["animais"] },
  { palavra: "Sardinha",      hint: "Lata",         categorias: ["animais"] },
  { palavra: "Polvo",         hint: "Tentáculo",    categorias: ["animais"] },
  { palavra: "Águia",         hint: "Voar",         categorias: ["animais"] },
  { palavra: "Papagaio",      hint: "Falar",        categorias: ["animais"] },
  { palavra: "Coruja",        hint: "Noite",        categorias: ["animais"] },
  { palavra: "Pinguim",       hint: "Gelo",         categorias: ["animais"] },
  { palavra: "Pomba",         hint: "Paz",          categorias: ["animais"] },
  { palavra: "Abelha",        hint: "Mel",          categorias: ["animais"] },
  { palavra: "Formiga",       hint: "Trabalho",     categorias: ["animais"] },
  { palavra: "Borboleta",     hint: "Colorida",     categorias: ["animais"] },
  { palavra: "Aranha",        hint: "Teia",         categorias: ["animais"] },
  { palavra: "Camaleão",      hint: "Cor",          categorias: ["animais"] },
  { palavra: "Impala",        hint: "Salto",        categorias: ["animais"] },
  { palavra: "Búfalo",        hint: "Selvagem",     categorias: ["animais"] },
  { palavra: "Chita",         hint: "Rápida",       categorias: ["animais"] },
  { palavra: "Leopardo",      hint: "Manchas",      categorias: ["animais"] },

  // ── DESPORTO ──────────────────────────────────────────────
  { palavra: "Futebol",       hint: "Bola",         categorias: ["desporto"] },
  { palavra: "Basquetebol",   hint: "Aro",          categorias: ["desporto"] },
  { palavra: "Voleibol",      hint: "Rede",         categorias: ["desporto"] },
  { palavra: "Ténis",         hint: "Raquete",      categorias: ["desporto"] },
  { palavra: "Corrida",       hint: "Pista",        categorias: ["desporto"] },
  { palavra: "Natação",       hint: "Piscina",      categorias: ["desporto"] },
  { palavra: "Boxe",          hint: "Luvas",        categorias: ["desporto"] },
  { palavra: "Karate",        hint: "Faixa",        categorias: ["desporto"] },
  { palavra: "Judo",          hint: "Quimono",      categorias: ["desporto"] },
  { palavra: "Ciclismo",      hint: "Bicicleta",    categorias: ["desporto"] },
  { palavra: "Skate",         hint: "Rampa",        categorias: ["desporto"] },
  { palavra: "Yoga",          hint: "Meditar",      categorias: ["desporto"] },
  { palavra: "Golfe",         hint: "Buraco",       categorias: ["desporto"] },
  { palavra: "Rugby",         hint: "Oval",         categorias: ["desporto"] },
  { palavra: "Fórmula 1",     hint: "Velocidade",   categorias: ["desporto"] },
  { palavra: "Basebol",       hint: "Taco",         categorias: ["desporto"] },
  { palavra: "Andebol",       hint: "Mão",          categorias: ["desporto"] },
  { palavra: "Fitness",       hint: "Ginásio",      categorias: ["desporto"] },
  { palavra: "Xadrez",        hint: "Rei",          categorias: ["desporto"] },
  { palavra: "Ténis de mesa", hint: "Ping-pong",    categorias: ["desporto"] },
];

// ── Helpers ────────────────────────────────────────────────

// Auto-sugestão de impostores baseada no número de jogadores.
export function suggestedImpostorCount(playerCount) {
  if (playerCount <= 5)  return 1;
  if (playerCount <= 8)  return 1;
  if (playerCount <= 12) return 2;
  return 3;
}

// Máximo permitido de impostores dado o número de jogadores.
export function maxImpostorCount(playerCount) {
  if (playerCount <= 5)  return 1;
  if (playerCount <= 8)  return 2;
  return 3;
}

// Filtra palavras por categorias seleccionadas (união, não intersecção).
export function filterWordsByCategorias(categoriaIds) {
  if (!Array.isArray(categoriaIds) || categoriaIds.length === 0) {
    return AGENTE_SECRETO_WORDS;
  }
  const set = new Set(categoriaIds);
  return AGENTE_SECRETO_WORDS.filter(w =>
    w.categorias.some(c => set.has(c))
  );
}

// Sorteia uma palavra do pool filtrado; devolve palavra + hint específico
// (do próprio item, não da categoria).
export function pickWord(categoriaIds) {
  const pool = filterWordsByCategorias(categoriaIds);
  if (pool.length === 0) return null;
  const w = pool[Math.floor(Math.random() * pool.length)];
  const filterSet = new Set(categoriaIds || []);
  const hintCatId =
    w.categorias.find(c => filterSet.has(c)) ||
    w.categorias[0];
  return {
    palavra: w.palavra,
    hint: w.hint,
    categoriaId: hintCatId,
  };
}
