import { useState, useEffect, useRef } from "react";

const LS_RULES = "mzpg_rules_seen_sabetudo";
const TOTAL = 5;
const SECS = 12;

const BANK = [
  // ── HISTÓRIA ──────────────────────────────────────────────────────────────
  { q: "Em que ano Moçambique se tornou independente?", opts: ["1973","1974","1975","1976"], ans: 2 },
  { q: "Quem foi o primeiro presidente de Moçambique?", opts: ["Eduardo Mondlane","Joaquim Chissano","Samora Machel","Armando Guebuza"], ans: 2 },
  { q: "Qual é o dia da Independência de Moçambique?", opts: ["4 de Outubro","25 de Junho","7 de Setembro","3 de Fevereiro"], ans: 1 },
  { q: "Em que ano foi assinado o Acordo Geral de Paz em Moçambique?", opts: ["1990","1991","1992","1993"], ans: 2 },
  { q: "Quem fundou a FRELIMO?", opts: ["Samora Machel","Joaquim Chissano","Afonso Dhlakama","Eduardo Mondlane"], ans: 3 },
  { q: "Quem liderou a RENAMO durante mais de 30 anos?", opts: ["Ossufo Momade","André Matsangaíssa","Afonso Dhlakama","Daviz Simango"], ans: 2 },
  { q: "O que se celebra a 3 de Fevereiro em Moçambique?", opts: ["Dia da Independência","Dia dos Heróis","Dia da Paz","Dia da Mulher"], ans: 1 },
  { q: "Qual foi o segundo presidente de Moçambique?", opts: ["Armando Guebuza","Filipe Nyusi","Joaquim Chissano","Daniel Chapo"], ans: 2 },
  { q: "O que se celebra a 4 de Outubro em Moçambique?", opts: ["Dia da Independência","Dia dos Heróis","Dia da Paz e Reconciliação","Dia das FAPLA"], ans: 2 },
  { q: "Qual arma aparece na bandeira de Moçambique?", opts: ["Pistola","Espingarda","AK-47","Catana"], ans: 2 },
  { q: "Qual presidente da FRELIMO foi assassinado em 1969?", opts: ["Samora Machel","Eduardo Mondlane","Marcelino dos Santos","Armando Guebuza"], ans: 1 },
  { q: "Em que ano começou o conflito armado entre FRELIMO e RENAMO?", opts: ["1975","1976","1977","1978"], ans: 2 },
  // ── GEOGRAFIA ─────────────────────────────────────────────────────────────
  { q: "Qual é a capital de Moçambique?", opts: ["Beira","Nampula","Matola","Maputo"], ans: 3 },
  { q: "Qual é o rio mais longo que atravessa Moçambique?", opts: ["Limpopo","Save","Incomáti","Zambeze"], ans: 3 },
  { q: "Em que província fica a Barragem de Cahora Bassa?", opts: ["Manica","Sofala","Tete","Zambézia"], ans: 2 },
  { q: "Qual lago fica na fronteira norte de Moçambique?", opts: ["Lago Vitória","Lago Niassa","Lago Tanganica","Lago Nakuru"], ans: 1 },
  { q: "Qual país faz fronteira a norte de Moçambique?", opts: ["Zâmbia","Malawi","Zimbabwe","Tanzânia"], ans: 3 },
  { q: "Qual é a capital da província de Sofala?", opts: ["Chimoio","Beira","Dondo","Nhamatanda"], ans: 1 },
  { q: "Qual arquipélago fica ao largo da costa de Inhambane?", opts: ["Quirimbas","Bazaruto","Inhaca","Macaneta"], ans: 1 },
  { q: "Qual é o ponto mais alto de Moçambique?", opts: ["Monte Gorongosa","Monte Namúli","Serra Choa","Monte Binga"], ans: 3 },
  { q: "Em que província fica o Parque Nacional da Gorongosa?", opts: ["Manica","Tete","Sofala","Zambézia"], ans: 2 },
  { q: "Qual é a segunda maior cidade de Moçambique por população?", opts: ["Beira","Nampula","Matola","Quelimane"], ans: 2 },
  { q: "Qual é o maior estádio de Moçambique?", opts: ["Estádio da Machava","Estádio do Zimpeto","Estádio Costa do Sol","Estádio da Maxaquene"], ans: 1 },
  // ── CULTURA & TRADIÇÕES ───────────────────────────────────────────────────
  { q: "O que é o 'Lobolo' na cultura moçambicana?", opts: ["Instrumento musical","Dote/preço da noiva","Prato típico","Dança de Cabo Delgado"], ans: 1 },
  { q: "O que é a 'Capulana'?", opts: ["Cesta de palha","Tecido colorido tradicional","Bebida fermentada","Canoa de pesca"], ans: 1 },
  { q: "O que é o 'Xitique'?", opts: ["Jogo de tabuleiro","Dança tradicional","Sistema de poupança colectiva","Prato típico do sul"], ans: 2 },
  { q: "O que significa 'Kanimambo' em Changana?", opts: ["Bom dia","Boa noite","Obrigado","Como estás?"], ans: 2 },
  { q: "Qual é o género musical tradicional de Maputo?", opts: ["Pandza","Mapiko","Marrabenta","Timbila"], ans: 2 },
  { q: "O que é o 'Matapa'?", opts: ["Tecido bordado","Prato de folhas de mandioca com amendoim","Instrumento de percussão","Bebida fermentada"], ans: 1 },
  { q: "Qual instrumento é típico da etnia Chopi?", opts: ["Mbira","Djembe","Timbila","Ngoma"], ans: 2 },
  { q: "Qual dança é tradicional da etnia Makonde?", opts: ["Xibelane","Mapiko","Tufo","Xigubo"], ans: 1 },
  { q: "Qual é a língua oficial de Moçambique?", opts: ["Changana","Macua","Português","Ronga"], ans: 2 },
  { q: "Qual é a moeda de Moçambique?", opts: ["Kwanza","Metical","Rand","Cedi"], ans: 1 },
  { q: "Qual dança é popular em festas muçulmanas no norte de MZ?", opts: ["Marrabenta","Mapiko","Tufo","Xigubo"], ans: 2 },
  { q: "O que é o 'Maheu'?", opts: ["Dança tradicional","Bebida fermentada de farinha de milho","Instrumento de cordas","Chapéu tradicional"], ans: 1 },
  // ── DESPORTO & PERSONALIDADES ─────────────────────────────────────────────
  { q: "Qual atleta MZ ganhou ouro olímpico nos Jogos de Sydney 2000?", opts: ["Ana Guedes","Lurdes Mutola","Manuela Machado","Helena Xavier"], ans: 1 },
  { q: "Em que modalidade Lurdes Mutola ganhou o ouro olímpico?", opts: ["400 metros","1500 metros","800 metros","Maratona"], ans: 2 },
  { q: "Em que cidade nasceu Eusébio, o craque do Benfica?", opts: ["Beira","Nampula","Lourenço Marques (Maputo)","Inhambane"], ans: 2 },
  { q: "Qual escritor MZ é autor de 'Terra Sonâmbula'?", opts: ["José Craveirinha","Ungulani Ba Ka Khosa","Paulina Chiziane","Mia Couto"], ans: 3 },
  { q: "Qual escritora MZ ganhou o Prémio Camões em 2021?", opts: ["Noémia de Sousa","Paulina Chiziane","Graça Machel","Lina Magaia"], ans: 1 },
  { q: "Qual artista plástico MZ é internacionalmente famoso pelas suas pinturas?", opts: ["Alberto Chissano","Malangatana","Reinata Sadimba","Bertina Lopes"], ans: 1 },
  { q: "Qual cantor MZ é conhecido como o Rei da Marrabenta?", opts: ["Stewart Sukuma","Feliciano dos Santos","Wazimbo","Dilon Djindji"], ans: 2 },
  { q: "Qual rapper MZ ficou famoso pelo álbum 'Muthiana Omukhulu'?", opts: ["Mr. Bow","Azagaia","Dama do Bling","Laylizzy"], ans: 1 },
  { q: "Qual é a alcunha da seleção nacional de basquete de Moçambique?", opts: ["Leões","Mambas","Elefantes","Caimões"], ans: 1 },
  { q: "Qual poeta MZ foi o primeiro a ganhar o Prémio Camões (1991)?", opts: ["Mia Couto","José Craveirinha","Ungulani Ba Ka Khosa","Paulina Chiziane"], ans: 1 },
  { q: "Em que clube português ficou famoso Eusébio?", opts: ["Sporting","Porto","Benfica","Braga"], ans: 2 },
  { q: "Qual escritora MZ publicou 'Balada de Amor ao Vento' em 1990?", opts: ["Noémia de Sousa","Graça Machel","Paulina Chiziane","Lina Magaia"], ans: 2 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRound() {
  return shuffle(BANK).slice(0, TOTAL).map((q) => {
    const order = shuffle([0, 1, 2, 3]);
    return { q: q.q, opts: order.map((i) => q.opts[i]), ans: order.indexOf(q.ans) };
  });
}

const LETTERS = ["A", "B", "C", "D"];

export default function SabeTudo({ onBack }) {
  const [showRules, setShowRules] = useState(!localStorage.getItem(LS_RULES));
  const [qs, setQs] = useState(pickRound);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [secs, setSecs] = useState(SECS);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const ivRef = useRef(null);

  const q = qs[idx];
  const isAnswered = picked !== null;
  const timerPct = (secs / SECS) * 100;
  const timerColor = secs > 6 ? "#00e5b0" : secs > 3 ? "#f97316" : "#ef4444";

  // Timer
  useEffect(() => {
    if (showRules || done || isAnswered) return;
    ivRef.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { clearInterval(ivRef.current); setPicked(-1); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ivRef.current);
  }, [idx, showRules, done, isAnswered]);

  // Auto-advance
  useEffect(() => {
    if (!isAnswered || done) return;
    const t = setTimeout(() => {
      if (idx + 1 >= TOTAL) { setDone(true); return; }
      setIdx((i) => i + 1);
      setPicked(null);
      setSecs(SECS);
    }, 1600);
    return () => clearTimeout(t);
  }, [isAnswered, idx, done]);

  function pick(i) {
    if (isAnswered) return;
    clearInterval(ivRef.current);
    setPicked(i);
    if (i === q.ans) setScore((s) => s + 1);
  }

  function restart() {
    setQs(pickRound());
    setIdx(0); setPicked(null); setSecs(SECS); setScore(0); setDone(false);
  }

  function closeRules() {
    localStorage.setItem(LS_RULES, "1");
    setShowRules(false);
  }

  // ── REGRAS (primeira vez) ──────────────────────────────────────────────────
  if (showRules) {
    return (
      <div className="appBg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          background: "#0F1320", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 24, padding: "36px 24px", maxWidth: 400, width: "100%",
          display: "flex", flexDirection: "column", gap: 20, textAlign: "center",
        }}>
          <div style={{ fontSize: 52 }}>🧠</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>Sabe Tudo?</div>
          <div style={{
            color: "rgba(255,255,255,.7)", fontSize: 14, lineHeight: 1.7,
            textAlign: "left", display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div>📍 <b style={{ color: "#fff" }}>5 perguntas</b> sobre Moçambique</div>
            <div>⏱️ <b style={{ color: "#fff" }}>12 segundos</b> por pergunta</div>
            <div>✅ Escolhe a resposta correcta de <b style={{ color: "#fff" }}>4 opções</b></div>
            <div>🏆 Cada acerto vale <b style={{ color: "#fff" }}>1 ponto</b></div>
          </div>
          <button className="btnPrimary" onClick={closeRules} type="button">
            Percebido! Jogar →
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTADO ─────────────────────────────────────────────────────────────
  if (done) {
    const feedback =
      score === 5 ? ["🏆", "Incrível! Sabes tudo!"] :
      score >= 4  ? ["🎯", "Muito bom! Quase perfeito"] :
      score >= 3  ? ["👍", "Bom! Mais de metade certa"] :
      score >= 2  ? ["📚", "Ainda a aprender…"] :
                    ["😅", "Tenta de novo!"];

    return (
      <div className="appBg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          background: "#0F1320", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 24, padding: "40px 24px", maxWidth: 400, width: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}>
          <div style={{ fontSize: 56 }}>{feedback[0]}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center" }}>{feedback[1]}</div>
          <div style={{
            fontSize: 64, fontWeight: 950, lineHeight: 1,
            background: "linear-gradient(135deg,#7c5dfa,#00e5b0)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {score}<span style={{ fontSize: 32, opacity: .5 }}>/{TOTAL}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <button className="btnPrimary" onClick={restart} type="button">🔁 Jogar outra vez</button>
            <button className="btnGhost" onClick={onBack} type="button">← Menu</button>
          </div>
        </div>
      </div>
    );
  }

  // ── JOGO ──────────────────────────────────────────────────────────────────
  return (
    <div className="appBg">
      <div className="shell" style={{ display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header className="gameHeader">
          <button className="btnGhost" onClick={onBack} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">Sabe Tudo?</div>
          </div>
          <div className="timerPill" style={{ color: timerColor }}>{secs}s</div>
        </header>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "10px 0 6px" }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} style={{
              width: 36, height: 5, borderRadius: 99,
              background: i < idx ? "#7c5dfa" : i === idx ? "#00e5b0" : "rgba(255,255,255,.12)",
              transition: "background .3s",
            }} />
          ))}
        </div>

        {/* Timer bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,.08)", margin: "6px 0 14px", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${timerPct}%`,
            background: timerColor,
            transition: "width 1s linear, background .4s",
          }} />
        </div>

        <main className="gameMain" style={{ gap: 14, paddingBottom: 12 }}>

          {/* Q number */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", textAlign: "center" }}>
            Pergunta {idx + 1} de {TOTAL}
          </div>

          {/* Question */}
          <div style={{
            background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 20, padding: "22px 18px",
            fontSize: "clamp(15px,4vw,20px)", fontWeight: 800, color: "#fff",
            textAlign: "center", lineHeight: 1.4,
            minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {q.q}
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: "1 1 auto" }}>
            {q.opts.map((opt, i) => {
              const isCorrect = i === q.ans;
              const isChosen  = i === picked;
              let bg     = "rgba(255,255,255,.05)";
              let border = "1px solid rgba(255,255,255,.1)";
              let col    = "#fff";
              let cirBg  = "rgba(255,255,255,.08)";
              if (isAnswered) {
                if (isCorrect)                     { bg = "rgba(0,200,100,.18)"; border = "1px solid rgba(0,200,100,.5)"; cirBg = "rgba(0,200,100,.3)"; }
                else if (isChosen)                 { bg = "rgba(220,50,50,.18)"; border = "1px solid rgba(220,50,50,.5)"; cirBg = "rgba(220,50,50,.3)"; }
                else                               { col = "rgba(255,255,255,.3)"; }
              }
              return (
                <button key={i} type="button" disabled={isAnswered} onClick={() => pick(i)}
                  style={{
                    background: bg, border, borderRadius: 16,
                    padding: "13px 16px", textAlign: "left",
                    color: col, fontSize: 14, fontWeight: 700,
                    cursor: isAnswered ? "default" : "pointer",
                    transition: "background .2s, border .2s",
                    display: "flex", alignItems: "center", gap: 12,
                    WebkitTapHighlightColor: "transparent",
                  }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: cirBg, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 11, fontWeight: 900,
                    flexShrink: 0, color: col,
                  }}>
                    {isAnswered && isCorrect ? "✅" : isAnswered && isChosen ? "❌" : LETTERS[i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Score */}
          <div style={{ textAlign: "center", color: "rgba(255,255,255,.35)", fontSize: 12, fontWeight: 700 }}>
            {score} ponto{score !== 1 ? "s" : ""}
          </div>

        </main>
      </div>
    </div>
  );
}
