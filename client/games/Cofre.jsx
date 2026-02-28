import React, { useMemo, useRef, useState } from "react";
import "../src/App.css";

/**
 * COFRE — UI (Modo B: Guardião ativo)
 * - Sistema gera regra secreta (include/exclude) x (letter/sequence)
 * - Só Guardião vê a regra (sempre)
 * - Mesa: jogadores sugerem palavras -> ficam "pendentes" -> Guardião marca ✅/❌
 * - Adivinhar: jogadores submetem hipótese -> fica "pendente" -> Guardião decide ✅/❌
 * - Normaliza acentos e ignora maiúsculas
 */

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

// Sequências ASCII (porque normalizamos acentos)
const SEQUENCES = [
  "pre",
  "pro",
  "tra",
  "cao", // "ção" normaliza para "cao"
  "ment",
  "ar",
  "er",
  "or",
  "ao",
  "ou",
  "de",
  "se",
  "ma",
  "na",
  "re",
  "te",
  "co",
  "me",
];

function safeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stripDiacritics(input) {
  try {
    return input.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  } catch {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
}

function normalize(input) {
  return stripDiacritics(String(input || "")).toLowerCase().trim();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRule() {
  const kind = Math.random() < 0.5 ? "letter" : "sequence"; // alvo
  const mode = Math.random() < 0.5 ? "include" : "exclude"; // incluir/excluir

  const target = kind === "letter" ? pick(LETTERS) : pick(SEQUENCES);

  return { kind, mode, target }; // tudo em lowercase/ASCII
}

function ruleToText(rule) {
  const targetLabel = rule.kind === "letter" ? `a letra "${rule.target.toUpperCase()}"` : `"${rule.target}"`;
  const verb = rule.mode === "include" ? "DEVEM conter" : "NÃO podem conter";
  return `${verb} ${targetLabel}`;
}

export default function Cofre() {
  const [phase, setPhase] = useState("guardian"); // "guardian" | "table"
  const [rule, setRule] = useState(() => generateRule());

  // UI: revelar regra só enquanto pressiona
  const [revealRule, setRevealRule] = useState(false);

  // Entrada pública de palavras
  const [wordInput, setWordInput] = useState("");
  const [pendingWord, setPendingWord] = useState(null); // { id, raw }
  const [attempts, setAttempts] = useState([]); // { id, raw, accepted }

  // Adivinhar
  const [guessOpen, setGuessOpen] = useState(false);
  const [guessInput, setGuessInput] = useState("");
  const [pendingGuess, setPendingGuess] = useState(null); // { id, raw }
  const [guessFeedback, setGuessFeedback] = useState(null); // string

  // Vitória
  const [winnerMsg, setWinnerMsg] = useState(null);

  const listEndRef = useRef(null);

  const ruleText = useMemo(() => ruleToText(rule), [rule]);

  const startNewRound = () => {
    setRule(generateRule());
    setPhase("guardian");
    setRevealRule(false);

    setWordInput("");
    setPendingWord(null);
    setAttempts([]);

    setGuessOpen(false);
    setGuessInput("");
    setPendingGuess(null);
    setGuessFeedback(null);

    setWinnerMsg(null);
  };

  const submitWord = (e) => {
    e.preventDefault();
    if (pendingWord) return; // já existe uma pendente
    const raw = wordInput.trim();
    if (!raw) return;

    setPendingWord({ id: safeId(), raw });
    setWordInput("");
  };

  const guardianDecideWord = (accepted) => {
    if (!pendingWord) return;
    setAttempts((prev) => [...prev, { id: pendingWord.id, raw: pendingWord.raw, accepted }]);
    setPendingWord(null);

    // scroll
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const openGuess = () => {
    setGuessFeedback(null);
    setGuessInput("");
    setPendingGuess(null);
    setGuessOpen(true);
  };

  const closeGuess = () => {
    setGuessOpen(false);
    setGuessFeedback(null);
    setGuessInput("");
    setPendingGuess(null);
  };

  const submitGuess = (e) => {
    e.preventDefault();
    if (pendingGuess) return;
    const raw = guessInput.trim();
    if (!raw) {
      setGuessFeedback("Escreve a tua hipótese (ex: 'tem a letra a', 'não pode ter pre').");
      return;
    }
    setPendingGuess({ id: safeId(), raw });
    setGuessFeedback(null);
  };

  const guardianDecideGuess = (correct) => {
    if (!pendingGuess) return;

    if (correct) {
      setWinnerMsg("🎉 Acertaram! Cofre aberto.");
      // fecha modal e mantém histórico para “celebração”
      setGuessOpen(false);
      setPendingGuess(null);
      setGuessInput("");
    } else {
      setGuessFeedback("❌ Errado. Continuem a testar palavras.");
      setPendingGuess(null);
      setGuessInput("");
      // mantém modal aberto para novas tentativas
    }
  };

  // Helpers de “segurar para revelar”
  const holdHandlers = {
    onMouseDown: () => setRevealRule(true),
    onMouseUp: () => setRevealRule(false),
    onMouseLeave: () => setRevealRule(false),
    onTouchStart: () => setRevealRule(true),
    onTouchEnd: () => setRevealRule(false),
    onTouchCancel: () => setRevealRule(false),
  };

  return (
    <div className="cofre-root">
      <div className="cofre-screen">
        {/* HEADER */}
        <header className="cofre-header">
          <div className="cofre-title">
            <div className="cofre-badge">🔐</div>
            <div>
              <div className="cofre-name">COFRE</div>
              <div className="cofre-subtitle">Dedução + Guardião (modo mesa)</div>
            </div>
          </div>

          <div className="cofre-controls">
            <button type="button" className="cofre-secondary" onClick={startNewRound}>
              🔄 Nova Ronda
            </button>
          </div>
        </header>

        {/* BODY */}
        <main className="cofre-main">
          {phase === "guardian" ? (
            // =========================
            // TELA PRIVADA DO GUARDIÃO
            // =========================
            <section className="cofre-guardian">
              <div className="cofre-guardian-card">
                <div className="cofre-guardian-top">
                  <div className="cofre-guardian-role">👁️ Guardião</div>
                  <div className="cofre-guardian-note">Só tu podes ver isto.</div>
                </div>

                <div className="cofre-ruleBox">
                  <div className="cofre-ruleLabel">REGRA DO COFRE</div>

                  <div className={`cofre-ruleValue ${revealRule ? "" : "blurred"}`}>
                    {ruleText}
                  </div>

                  <div className="cofre-holdRow">
                    <button
                      type="button"
                      className="cofre-holdBtn"
                      {...holdHandlers}
                    >
                      👁️ Segura para revelar
                    </button>
                    <div className="cofre-holdHint">Larga para esconder</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="cofre-primary cofre-full"
                  onClick={() => setPhase("table")}
                >
                  📱 Colocar na mesa
                </button>

                <div className="cofre-guardian-minihelp">
                  Na mesa: jogadores escrevem palavras → ficam PENDENTE → tu marcas ✅/❌.
                </div>
              </div>
            </section>
          ) : (
            // =========================
            // TELA DA MESA (PÚBLICA)
            // =========================
            <section className="cofre-vault" aria-label="Mesa">
              {/* Regra do Guardião (sempre visível, mas discreta e com blur) */}
              <div className="cofre-guardianBar" aria-label="Painel do Guardião">
                <div className="cofre-guardianBarLeft">
                  <div className="cofre-guardianTag">👁️ Regra</div>
                  <div className={`cofre-guardianRule ${revealRule ? "" : "blurred"}`}>
                    {ruleText}
                  </div>
                </div>

                <button type="button" className="cofre-holdBtn small" {...holdHandlers}>
                  Segurar
                </button>
              </div>

              {/* Winner banner */}
              {winnerMsg && (
                <div className="cofre-winner">
                  <div className="cofre-winnerText">{winnerMsg}</div>
                  <button className="cofre-submit" type="button" onClick={startNewRound}>
                    Nova Ronda
                  </button>
                </div>
              )}

              {/* Display + actions */}
              <div className="cofre-vault-top">
                <div className="cofre-display">
                  <div className="cofre-display-label">ENTRADA</div>
                  <div className="cofre-display-value">
                    {wordInput.trim() ? wordInput : <span className="cofre-dim">Escreve uma palavra…</span>}
                  </div>
                </div>

                <div className="cofre-actions">
                  <button type="button" className="cofre-primary" onClick={openGuess}>
                    🔍 Adivinhar
                  </button>
                </div>
              </div>

              {/* Input */}
              <form className="cofre-form" onSubmit={submitWord}>
                <input
                  className="cofre-input"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder={pendingWord ? "Aguarda o Guardião..." : "Ex: livro, sol, casa…"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={40}
                  disabled={!!pendingWord}
                />
                <button className="cofre-submit" type="submit" disabled={!!pendingWord}>
                  Enviar
                </button>
              </form>

              {/* Pendente + botões do Guardião */}
              <div className="cofre-pendingWrap">
                <div className="cofre-pendingTitle">Decisão do Guardião</div>

                {!pendingWord ? (
                  <div className="cofre-pendingEmpty">Sem palavra pendente.</div>
                ) : (
                  <div className="cofre-pendingCard">
                    <div className="cofre-pendingWord">{pendingWord.raw}</div>
                    <div className="cofre-pendingBtns">
                      <button
                        type="button"
                        className="cofre-judge ok"
                        onClick={() => guardianDecideWord(true)}
                      >
                        ✅ Aceite
                      </button>
                      <button
                        type="button"
                        className="cofre-judge no"
                        onClick={() => guardianDecideWord(false)}
                      >
                        ❌ Rejeitada
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista */}
              <div className="cofre-list" role="region" aria-label="Tentativas">
                <div className="cofre-list-header">
                  <div className="cofre-list-title">Tentativas</div>
                  <div className="cofre-list-meta">{attempts.length} total</div>
                </div>

                {attempts.length === 0 ? (
                  <div className="cofre-empty">
                    <div className="cofre-empty-title">Sem tentativas ainda</div>
                    <div className="cofre-empty-sub">
                      Escrevam palavras e deixem o Guardião marcar ✅/❌.
                    </div>
                  </div>
                ) : (
                  <ul className="cofre-attempts">
                    {attempts.map((a) => (
                      <li key={a.id} className={`cofre-attempt ${a.accepted ? "ok" : "no"}`}>
                        <div className="cofre-word">{a.raw}</div>
                        <div className="cofre-result">{a.accepted ? "✅ Aceite" : "❌ Rejeitada"}</div>
                      </li>
                    ))}
                    <div ref={listEndRef} />
                  </ul>
                )}
              </div>
            </section>
          )}
        </main>

        {/* MODAL ADIVINHAR */}
        {guessOpen && (
          <div className="cofre-modal-backdrop" role="dialog" aria-modal="true" aria-label="Adivinhar">
            <div className="cofre-modal">
              <div className="cofre-modal-header">
                <div className="cofre-modal-title">🔍 Adivinhar</div>
                <button type="button" className="cofre-x" onClick={closeGuess} aria-label="Fechar">
                  ✕
                </button>
              </div>

              <div className="cofre-modal-body">
                {!pendingGuess ? (
                  <>
                    <p className="cofre-hint">
                      Escreve a tua hipótese. Exemplos: <em>“tem a letra A”</em>, <em>“não pode ter pre”</em>.
                    </p>

                    <form onSubmit={submitGuess} className="cofre-guess-form">
                      <input
                        className="cofre-input"
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        placeholder="A tua hipótese..."
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        maxLength={80}
                      />
                      <button className="cofre-submit" type="submit">
                        Enviar
                      </button>
                    </form>

                    {guessFeedback && <div className="cofre-feedback no">{guessFeedback}</div>}
                  </>
                ) : (
                  <>
                    <div className="cofre-pendingGuess">
                      <div className="cofre-pendingTitle">Hipótese pendente (Guardião decide)</div>
                      <div className="cofre-pendingWord big">{pendingGuess.raw}</div>

                      <div className="cofre-pendingBtns">
                        <button
                          type="button"
                          className="cofre-judge ok"
                          onClick={() => guardianDecideGuess(true)}
                        >
                          ✅ Acertou
                        </button>
                        <button
                          type="button"
                          className="cofre-judge no"
                          onClick={() => guardianDecideGuess(false)}
                        >
                          ❌ Errou
                        </button>
                      </div>

                      <div className="cofre-note">
                        <span className="cofre-note-dot">•</span>
                        Só o Guardião sabe a regra.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}