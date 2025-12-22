import { useEffect, useRef, useState } from "react";

const CATEGORIES = {
  famosos_mz: ["Mia Couto", "Samora Machel", "Maputo", "Beira", "Gorongosa", "Ilha de Moçambique"],
  lugares_mz: ["Nampula", "Pemba", "Chimoio", "Tete", "Inhambane", "Quelimane"],
  global: ["Cristiano Ronaldo", "Beyoncé", "Messi", "Netflix", "Coca-Cola", "Paris"],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [phase, setPhase] = useState("setup"); // setup | playing | end
  const [categoryId, setCategoryId] = useState("famosos_mz");
  const [seconds, setSeconds] = useState(30);
  const [item, setItem] = useState("");
  const [score, setScore] = useState(0);

  const timerRef = useRef(null);

  function startGame() {
    setScore(0);
    setSeconds(30);
    setItem(pickRandom(CATEGORIES[categoryId]));
    setPhase("playing");
  }

  function stopGame() {
    setPhase("end");
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function correct() {
    setScore((s) => s + 1);
    setItem(pickRandom(CATEGORIES[categoryId]));
  }

  function pass() {
    setItem(pickRandom(CATEGORIES[categoryId]));
  }

  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          stopGame();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>MZ Party Games</h1>
      <p style={{ opacity: 0.7 }}>Modo: 1 telefone (offline) — 30 segundos</p>

      {phase === "setup" && (
        <div style={{ display: "grid", gap: 10 }}>
          <label>
            Categoria:
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
            >
              {Object.keys(CATEGORIES).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>

          <button onClick={startGame} style={{ padding: 12 }}>
            Começar (30s)
          </button>

          <p style={{ opacity: 0.7 }}>
            Passe o telefone para a pessoa que vai explicar. O outro adivinha. Use ✅/❌.
          </p>
        </div>
      )}

      {phase === "playing" && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Tempo: {seconds}s</b>
            <b>Pontos: {score}</b>
          </div>

          <div
  style={{
    fontSize: 32,
    margin: "16px 0",
    padding: "24px 16px",
    borderRadius: 12,
    background: "#ffffff",
    color: "#000000",
    textAlign: "center",
    fontWeight: "700",
    border: "2px solid #000",
  }}
>
  {item}
</div>


          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={correct} style={{ flex: 1, padding: 12 }}>
              ✅ Acertou
            </button>
            <button onClick={pass} style={{ flex: 1, padding: 12 }}>
              ❌ Passou
            </button>
          </div>

          <button onClick={stopGame} style={{ width: "100%", padding: 10, marginTop: 10 }}>
            Terminar
          </button>
        </div>
      )}

      {phase === "end" && (
        <div style={{ marginTop: 12 }}>
          <h2>Fim!</h2>
          <p>Pontos: <b>{score}</b></p>
          <button onClick={() => setPhase("setup")} style={{ padding: 12, width: "100%" }}>
            Jogar de novo
          </button>
        </div>
      )}
    </div>
  );
}
