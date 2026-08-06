// Agente Secreto (Undercover-style) — nova mecânica:
// Grupo recebe uma palavra; impostor(es) sabem que são impostor(es) e vêem
// uma dica curta (nome da categoria, por defeito). Cada palavra pode ter
// múltiplas categorias — filtra-se o pool pelas categorias seleccionadas
// pelo host no ecrã de setup.

export const CATEGORIAS = [
  { id: "simples",  nome: "Palavras simples", emoji: "🎯", hint: "Objecto" },
  { id: "mz",       nome: "Moçambique",       emoji: "🇲🇿", hint: "Moçambicano" },
  { id: "comida",   nome: "Comida",           emoji: "🍕", hint: "Comida" },
  { id: "animais",  nome: "Animais",          emoji: "🐾", hint: "Animal" },
  { id: "desporto", nome: "Desporto",         emoji: "⚽", hint: "Desporto" },
];

export const AGENTE_SECRETO_WORDS = [
  // ── PALAVRAS SIMPLES (objectos do dia a dia) ──────────────
  { palavra: "Cadeira",       categorias: ["simples"] },
  { palavra: "Mesa",          categorias: ["simples"] },
  { palavra: "Chave",         categorias: ["simples"] },
  { palavra: "Porta",         categorias: ["simples"] },
  { palavra: "Janela",        categorias: ["simples"] },
  { palavra: "Livro",         categorias: ["simples"] },
  { palavra: "Almofada",      categorias: ["simples"] },
  { palavra: "Cobertor",      categorias: ["simples"] },
  { palavra: "Toalha",        categorias: ["simples"] },
  { palavra: "Espelho",       categorias: ["simples"] },
  { palavra: "Vela",          categorias: ["simples"] },
  { palavra: "Tesoura",       categorias: ["simples"] },
  { palavra: "Cola",          categorias: ["simples"] },
  { palavra: "Guarda-chuva",  categorias: ["simples"] },
  { palavra: "Cadeado",       categorias: ["simples"] },
  { palavra: "Vassoura",      categorias: ["simples"] },
  { palavra: "Colher",        categorias: ["simples"] },
  { palavra: "Garfo",         categorias: ["simples"] },
  { palavra: "Faca",          categorias: ["simples"] },
  { palavra: "Chinelo",       categorias: ["simples"] },
  { palavra: "Meia",          categorias: ["simples"] },
  { palavra: "Casaco",        categorias: ["simples"] },
  { palavra: "Chapéu",        categorias: ["simples"] },
  { palavra: "Óculos",        categorias: ["simples"] },
  { palavra: "Relógio",       categorias: ["simples"] },
  { palavra: "Telemóvel",     categorias: ["simples"] },
  { palavra: "Comando",       categorias: ["simples"] },
  { palavra: "Câmara",        categorias: ["simples"] },
  { palavra: "Escada",        categorias: ["simples"] },
  { palavra: "Cortina",       categorias: ["simples"] },
  { palavra: "Cinto",         categorias: ["simples"] },
  { palavra: "Caneta",        categorias: ["simples"] },
  { palavra: "Lápis",         categorias: ["simples"] },
  { palavra: "Panela",        categorias: ["simples"] },
  { palavra: "Frigideira",    categorias: ["simples"] },
  { palavra: "Copo",          categorias: ["simples"] },
  { palavra: "Prato",         categorias: ["simples"] },
  { palavra: "Auscultadores", categorias: ["simples"] },
  { palavra: "Tatuagem",      categorias: ["simples"] },
  { palavra: "Corda",         categorias: ["simples"] },
  { palavra: "Ventoinha",     categorias: ["simples"] },
  { palavra: "Atacadores",    categorias: ["simples"] },

  // ── MOÇAMBIQUE ────────────────────────────────────────────
  { palavra: "Capulana",             categorias: ["mz"] },
  { palavra: "Chapa",                categorias: ["mz"] },
  { palavra: "Txopela",              categorias: ["mz"] },
  { palavra: "Machamba",             categorias: ["mz"] },
  { palavra: "Curandeiro",           categorias: ["mz"] },
  { palavra: "Barraca",              categorias: ["mz"] },
  { palavra: "Catana",               categorias: ["mz"] },
  { palavra: "Kanimambo",            categorias: ["mz"] },
  { palavra: "Estádio",              categorias: ["mz"] },
  { palavra: "Chamussa",             categorias: ["mz", "comida"] },
  { palavra: "Matapa",               categorias: ["mz", "comida"] },
  { palavra: "Xima",                 categorias: ["mz", "comida"] },
  { palavra: "Maheu",                categorias: ["mz", "comida"] },
  { palavra: "Piri-piri",            categorias: ["mz", "comida"] },
  { palavra: "Badjias",              categorias: ["mz", "comida"] },
  { palavra: "Frango à Zambeziana",  categorias: ["mz", "comida"] },
  { palavra: "Bolinho de coco",      categorias: ["mz", "comida"] },
  { palavra: "Cacana",               categorias: ["mz", "comida"] },
  { palavra: "Amendoim",             categorias: ["mz", "comida"] },
  { palavra: "2M",                   categorias: ["mz", "comida"] },
  { palavra: "Laurentina",           categorias: ["mz", "comida"] },
  { palavra: "Mabolo",               categorias: ["mz", "comida"] },
  { palavra: "Canhu",                categorias: ["mz", "comida"] },
  { palavra: "Simba",                categorias: ["mz", "comida"] },

  // ── COMIDA (universal) ────────────────────────────────────
  { palavra: "Pizza",         categorias: ["comida"] },
  { palavra: "Hambúrguer",    categorias: ["comida"] },
  { palavra: "Sushi",         categorias: ["comida"] },
  { palavra: "Chocolate",     categorias: ["comida"] },
  { palavra: "Café",          categorias: ["comida"] },
  { palavra: "Chá",           categorias: ["comida"] },
  { palavra: "Leite",         categorias: ["comida"] },
  { palavra: "Sumo",          categorias: ["comida"] },
  { palavra: "Pão",           categorias: ["comida"] },
  { palavra: "Queijo",        categorias: ["comida"] },
  { palavra: "Ovos",          categorias: ["comida"] },
  { palavra: "Bolo",          categorias: ["comida"] },
  { palavra: "Sanduíche",     categorias: ["comida"] },
  { palavra: "Sopa",          categorias: ["comida"] },
  { palavra: "Salada",        categorias: ["comida"] },
  { palavra: "Batata frita",  categorias: ["comida"] },
  { palavra: "Pipoca",        categorias: ["comida"] },
  { palavra: "Iogurte",       categorias: ["comida"] },
  { palavra: "Cerveja",       categorias: ["comida"] },
  { palavra: "Vinho",         categorias: ["comida"] },
  { palavra: "Água",          categorias: ["comida"] },
  { palavra: "Manga",         categorias: ["comida"] },
  { palavra: "Banana",        categorias: ["comida"] },
  { palavra: "Papaia",        categorias: ["comida"] },
  { palavra: "Melancia",      categorias: ["comida"] },
  { palavra: "Uva",           categorias: ["comida"] },
  { palavra: "Maçã",          categorias: ["comida"] },
  { palavra: "Ananás",        categorias: ["comida"] },
  { palavra: "Morango",       categorias: ["comida"] },
  { palavra: "Magnum",        categorias: ["comida"] },
  { palavra: "Arroz",         categorias: ["comida"] },
  { palavra: "Esparguete",    categorias: ["comida"] },

  // ── ANIMAIS ───────────────────────────────────────────────
  { palavra: "Cachorro",      categorias: ["animais"] },
  { palavra: "Gato",          categorias: ["animais"] },
  { palavra: "Cavalo",        categorias: ["animais"] },
  { palavra: "Vaca",          categorias: ["animais"] },
  { palavra: "Porco",         categorias: ["animais"] },
  { palavra: "Galinha",       categorias: ["animais"] },
  { palavra: "Pato",          categorias: ["animais"] },
  { palavra: "Peru",          categorias: ["animais"] },
  { palavra: "Coelho",        categorias: ["animais"] },
  { palavra: "Rato",          categorias: ["animais"] },
  { palavra: "Leão",          categorias: ["animais"] },
  { palavra: "Tigre",         categorias: ["animais"] },
  { palavra: "Elefante",      categorias: ["animais"] },
  { palavra: "Zebra",         categorias: ["animais"] },
  { palavra: "Girafa",        categorias: ["animais"] },
  { palavra: "Macaco",        categorias: ["animais"] },
  { palavra: "Cobra",         categorias: ["animais"] },
  { palavra: "Crocodilo",     categorias: ["animais"] },
  { palavra: "Hipopótamo",    categorias: ["animais"] },
  { palavra: "Rinoceronte",   categorias: ["animais"] },
  { palavra: "Golfinho",      categorias: ["animais"] },
  { palavra: "Baleia",        categorias: ["animais"] },
  { palavra: "Sardinha",      categorias: ["animais"] },
  { palavra: "Polvo",         categorias: ["animais"] },
  { palavra: "Águia",         categorias: ["animais"] },
  { palavra: "Papagaio",      categorias: ["animais"] },
  { palavra: "Coruja",        categorias: ["animais"] },
  { palavra: "Pinguim",       categorias: ["animais"] },
  { palavra: "Pomba",         categorias: ["animais"] },
  { palavra: "Abelha",        categorias: ["animais"] },
  { palavra: "Formiga",       categorias: ["animais"] },
  { palavra: "Borboleta",     categorias: ["animais"] },
  { palavra: "Aranha",        categorias: ["animais"] },
  { palavra: "Camaleão",      categorias: ["animais"] },
  { palavra: "Impala",        categorias: ["animais"] },
  { palavra: "Búfalo",        categorias: ["animais"] },
  { palavra: "Chita",         categorias: ["animais"] },
  { palavra: "Leopardo",      categorias: ["animais"] },

  // ── DESPORTO ──────────────────────────────────────────────
  { palavra: "Futebol",       categorias: ["desporto"] },
  { palavra: "Basquetebol",   categorias: ["desporto"] },
  { palavra: "Voleibol",      categorias: ["desporto"] },
  { palavra: "Ténis",         categorias: ["desporto"] },
  { palavra: "Corrida",       categorias: ["desporto"] },
  { palavra: "Natação",       categorias: ["desporto"] },
  { palavra: "Boxe",          categorias: ["desporto"] },
  { palavra: "Karate",        categorias: ["desporto"] },
  { palavra: "Judo",          categorias: ["desporto"] },
  { palavra: "Ciclismo",      categorias: ["desporto"] },
  { palavra: "Skate",         categorias: ["desporto"] },
  { palavra: "Yoga",          categorias: ["desporto"] },
  { palavra: "Golfe",         categorias: ["desporto"] },
  { palavra: "Rugby",         categorias: ["desporto"] },
  { palavra: "Fórmula 1",     categorias: ["desporto"] },
  { palavra: "Basebol",       categorias: ["desporto"] },
  { palavra: "Andebol",       categorias: ["desporto"] },
  { palavra: "Fitness",       categorias: ["desporto"] },
  { palavra: "Xadrez",        categorias: ["desporto"] },
  { palavra: "Ténis de mesa", categorias: ["desporto"] },
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
// Nunca deixamos mais de ~1/3 dos jogadores como impostores.
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

// Sorteia uma palavra do pool filtrado; devolve também a categoria escolhida
// para servir de hint (a primeira que bate nas categorias seleccionadas).
export function pickWord(categoriaIds) {
  const pool = filterWordsByCategorias(categoriaIds);
  if (pool.length === 0) return null;
  const word = pool[Math.floor(Math.random() * pool.length)];
  // Categoria mais representativa para o hint: primeiro match no filtro do
  // host; senão, primeira categoria da palavra.
  const filterSet = new Set(categoriaIds || []);
  const hintCatId =
    word.categorias.find(c => filterSet.has(c)) ||
    word.categorias[0];
  const cat = CATEGORIAS.find(c => c.id === hintCatId);
  return {
    palavra: word.palavra,
    hint: cat?.hint || cat?.nome || "?",
    categoriaId: hintCatId,
  };
}
