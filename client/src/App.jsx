import React, { useState } from "react";
import ThirtySeconds from "../games/ThirtySeconds.jsx";
import WhoIsWho from "../games/WhoIsWho.jsx";
import Imposter from "../games/Imposter.jsx";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("menu"); // menu | 30s | who | imposter

  if (screen === "30s") {
    return <ThirtySeconds onBack={() => setScreen("menu")} />;
  }

  if (screen === "who") {
    return <WhoIsWho onBack={() => setScreen("menu")} />;
  }

  if (screen === "imposter") {
    return <Imposter onBack={() => setScreen("menu")} />;
  }

  return (
    <div className="appBg">
      <div className="shell">
        <header className="topHero">
          <div className="brandLine">
            <div className="logoDot" />
            <div>
              <div className="brandTitle">MZ Party Games</div>
              <div className="brandSub">Versão web • protótipo</div>
            </div>
          </div>
        </header>

        <section className="panel">
          <div className="panelTitle">Jogos</div>

          <button className="gameCard" onClick={() => setScreen("30s")} type="button">
            <div className="gameCardRow">
              <div className="gameCardInfo">
                <div className="gameCardTitle">⏱️ 30 Segundos</div>
                <div className="gameCardSub">CulturaGeral_MZ ou Global • 30s</div>
              </div>
              <span className="gameCardBtn">Jogar</span>
            </div>
          </button>

          <button className="gameCard" onClick={() => setScreen("who")} type="button">
            <div className="gameCardRow">
              <div className="gameCardInfo">
                <div className="gameCardTitle">🎭 Quem Sou Eu?</div>
                <div className="gameCardSub">Telefone na testa</div>
              </div>
              <span className="gameCardBtn">Jogar</span>
            </div>
          </button>

          <button className="gameCard" onClick={() => setScreen("imposter")} type="button">
            <div className="gameCardRow">
              <div className="gameCardInfo">
                <div className="gameCardTitle">🕵️ Quem Está a Mentir?</div>
                <div className="gameCardSub">Deduções • tensão • 5–10 min</div>
              </div>
              <span className="gameCardBtn">Jogar</span>
            </div>
          </button>
        </section>

        <footer className="footNote">
          Dica: nos jogos o round muda sozinho quando o tempo acabar.
        </footer>
      </div>
    </div>
  );
}

