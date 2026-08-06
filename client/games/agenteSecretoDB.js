// Client copy of Agente Secreto data. Mantém em sincronia com
// server/src/games/agenteSecretoDB.js.

export const CATEGORIAS = [
  { id: "simples",  nome: "Palavras simples", emoji: "🎯", hint: "Objecto" },
  { id: "mz",       nome: "Moçambique",       emoji: "🇲🇿", hint: "Moçambicano" },
  { id: "comida",   nome: "Comida",           emoji: "🍕", hint: "Comida" },
  { id: "animais",  nome: "Animais",          emoji: "🐾", hint: "Animal" },
  { id: "desporto", nome: "Desporto",         emoji: "⚽", hint: "Desporto" },
];

export function suggestedImpostorCount(playerCount) {
  if (playerCount <= 5)  return 1;
  if (playerCount <= 8)  return 1;
  if (playerCount <= 12) return 2;
  return 3;
}

export function maxImpostorCount(playerCount) {
  if (playerCount <= 5)  return 1;
  if (playerCount <= 8)  return 2;
  return 3;
}
