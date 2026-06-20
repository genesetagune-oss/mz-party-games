// server/src/games/sporcleMZVerification.js — espelho do cliente

export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function quaseLa(input, gruposAceites) {
  const norm = normalizar(input);
  for (const grupo of gruposAceites) {
    for (const aceite of grupo) {
      const aN = normalizar(aceite);
      const len = Math.max(norm.length, aN.length);
      if (!len) continue;
      const dist = levenshtein(norm, aN);
      const limite = len <= 5 ? 1 : 2;
      if (dist > 0 && dist <= limite && (1 - dist / len) > 0.7)
        return { match: true, sugestao: aceite };
    }
  }
  return { match: false, sugestao: null };
}

export function verificarResposta(input, gruposAceites, jaAcertadas = new Set()) {
  const norm = normalizar(input);
  if (!norm) return { resultado: "erro", grupoAcertadoIndex: null, sugestao: null };

  for (let i = 0; i < gruposAceites.length; i++) {
    if (gruposAceites[i].some(a => normalizar(a) === norm)) {
      const chave = `grupo_${i}`;
      if (jaAcertadas.has(chave))
        return { resultado: "duplicado", grupoAcertadoIndex: i, sugestao: null };
      return { resultado: "acerto", grupoAcertadoIndex: i, sugestao: null };
    }
  }

  const restantes = gruposAceites.filter((_, i) => !jaAcertadas.has(`grupo_${i}`));
  const q = quaseLa(input, restantes);
  if (q.match) return { resultado: "quase", grupoAcertadoIndex: null, sugestao: q.sugestao };

  return { resultado: "erro", grupoAcertadoIndex: null, sugestao: null };
}
