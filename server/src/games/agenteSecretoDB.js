// Duplicated on the server so the engine has no runtime dependency on the
// client bundle. Keep in sync with client/games/agenteSecretoDB.js.

export const AGENTE_SECRETO_TRIOS = [
  { real: "Óculos",       impostor: ["Máscara", "Protetor solar"], tipo: "universal" },
  { real: "Tatuagem",     impostor: ["Desenho", "Maquiagem"],       tipo: "universal" },
  { real: "Atacadores",   impostor: ["Cinto", "Corda"],             tipo: "universal" },
  { real: "Espelho",      impostor: ["Câmara", "Janela"],           tipo: "universal" },
  { real: "Vela",         impostor: ["Lua", "Sol"],                 tipo: "universal" },
  { real: "Almofada",     impostor: ["Urso de peluche", "Sofá"],    tipo: "universal" },
  { real: "Capulana",     impostor: ["Toalha", "Cobertor"],         tipo: "mz" },
  { real: "2M",           impostor: ["Água", "Vinho"],              tipo: "mz" },
  { real: "Chave",        impostor: ["Cartão", "Impressão digital"], tipo: "universal" },
  { real: "Guarda-chuva", impostor: ["Capacete", "Telhado"],        tipo: "universal" },
  { real: "Ventoinha",    impostor: ["Geleira", "Ar condicionado"], tipo: "universal" },
  { real: "Cadeado",      impostor: ["Cão", "Alarme"],              tipo: "universal" },
  { real: "Vassoura",     impostor: ["Aspirador", "Pano"],          tipo: "universal" },
  { real: "Colher",       impostor: ["Garfo", "Mão"],               tipo: "universal" },
  { real: "Auscultadores", impostor: ["Coluna", "Rádio"],           tipo: "universal" },
  { real: "Escada",       impostor: ["Elevador", "Corda"],          tipo: "universal" },
  { real: "Caneta",       impostor: ["Lápis", "Batom"],             tipo: "universal" },
  { real: "Corda",        impostor: ["Fita-cola", "Cola"],          tipo: "universal" },
  { real: "Cobertor",     impostor: ["Casaco", "Lareira"],          tipo: "universal" },
  { real: "Sal",          impostor: ["Açúcar", "Piri-piri"],        tipo: "mz" },
  { real: "Chapa",        impostor: ["Boleia", "Táxi"],             tipo: "mz" },
  { real: "Maheu",        impostor: ["Sumo", "Leite"],              tipo: "mz" },
  { real: "Chamussa",     impostor: ["Sandes", "Bolo"],             tipo: "mz" },
  { real: "Catana",       impostor: ["Faca", "Tesoura"],            tipo: "mz" },
  { real: "Machamba",     impostor: ["Mercado", "Frigorífico"],     tipo: "mz" },
  { real: "Curandeiro",   impostor: ["Médico", "Comprimido"],       tipo: "mz" },
  { real: "Barraca",      impostor: ["Bar", "Restaurante"],         tipo: "mz" },
  { real: "Rádio",        impostor: ["Igreja", "Jornal"],           tipo: "mz" },
  { real: "Estádio",      impostor: ["Igreja", "Mercado"],          tipo: "mz" },
];

export function impostorCount(playerCount) {
  if (playerCount <= 6)  return 1;
  if (playerCount <= 12) return 2;
  return 3;
}

export function pickTrio() {
  return AGENTE_SECRETO_TRIOS[Math.floor(Math.random() * AGENTE_SECRETO_TRIOS.length)];
}
