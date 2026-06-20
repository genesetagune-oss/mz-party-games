// client/games/sporcleMZVerification.js

export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein distance — O(n*m) standard
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// Devolve { match, sugestao } se o input está "quase certo"
export function quaseLa(input, gruposAceites) {
  const norm = normalizar(input);
  for (const grupo of gruposAceites) {
    for (const aceite of grupo) {
      const aceiteNorm = normalizar(aceite);
      const len = Math.max(norm.length, aceiteNorm.length);
      if (len === 0) continue;
      const dist = levenshtein(norm, aceiteNorm);
      const limite = len <= 5 ? 1 : 2;
      const sim = 1 - (dist / len);
      if (dist > 0 && dist <= limite && sim > 0.7) {
        return { match: true, sugestao: aceite };
      }
    }
  }
  return { match: false, sugestao: null };
}

/**
 * verificarResposta
 * @param {string} input
 * @param {string[][]} gruposAceites
 * @param {Set<string>} jaAcertadas — Set de "grupo_N" strings
 * @returns {{ resultado, grupoAcertadoIndex, sugestao }}
 */
export function verificarResposta(input, gruposAceites, jaAcertadas = new Set()) {
  const norm = normalizar(input);
  if (!norm) return { resultado: "erro", grupoAcertadoIndex: null, sugestao: null };

  // 1. Match exato
  for (let i = 0; i < gruposAceites.length; i++) {
    const match = gruposAceites[i].some(a => normalizar(a) === norm);
    if (match) {
      const chave = `grupo_${i}`;
      if (jaAcertadas.has(chave)) {
        return { resultado: "duplicado", grupoAcertadoIndex: i, sugestao: null };
      }
      return { resultado: "acerto", grupoAcertadoIndex: i, sugestao: null };
    }
  }

  // 2. Quase
  // só verifica grupos ainda não acertados
  const gruposRestantes = gruposAceites.filter((_, i) => !jaAcertadas.has(`grupo_${i}`));
  const quase = quaseLa(input, gruposRestantes);
  if (quase.match) {
    return { resultado: "quase", grupoAcertadoIndex: null, sugestao: quase.sugestao };
  }

  return { resultado: "erro", grupoAcertadoIndex: null, sugestao: null };
}
