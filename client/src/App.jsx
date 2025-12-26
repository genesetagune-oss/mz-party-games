import React, { useState } from "react";
import ThirtySeconds from "../games/ThirtySeconds.jsx";
import WhoIsWho from "../games/WhoIsWho.jsx";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("menu"); // menu | 30s | who

  // ===== ROTAS =====
  if (screen === "30s") {
    return <ThirtySeconds onBack={() => setScreen("menu")} />;
  }

  if (screen === "who") {
    return <WhoIsWho onBack={() => setScreen("menu")} />;
  }

  // ===== MENU =====
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

          {/* 30 Segundos */}
          <button
            className="gameCard"
            onClick={() => setScreen("30s")}
            type="button"
          >
            <div className="gameCardRow">
              <div className="gameCardInfo">
                <div className="gameCardTitle">⏱️ 30 Segundos</div>
                <div className="gameCardSub">CulturaGeral_MZ ou Global • 30s</div>
              </div>

              <span className="gameCardBtn">Jogar</span>
            </div>
          </button>

          {/* Who Is Who (ATIVO) */}
          <button
            className="gameCard"
            onClick={() => setScreen("who")}
            type="button"
          >
            <div className="gameCardRow">
              <div className="gameCardInfo">
                <div className="gameCardTitle">🕵️ Quem Sou Eu?</div>
                <div className="gameCardSub">Telefone na testa • 45s</div>
              </div>

              <span className="gameCardBtn">Jogar</span>
            </div>
          </button>

          {/* Charadas (Em breve) */}
          <button className="gameCard disabled" disabled type="button">
            <div className="gameCardRow">
              <div className="gameCardInfo">
                <div className="gameCardTitle">🎭 imposter</div>
                <div className="gameCardSub">....</div>
              </div>

              <span className="gameCardBtn ghost">Em breve</span>
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
