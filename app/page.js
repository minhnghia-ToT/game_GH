"use client";

import { useCallback, useState } from "react";
import MainMenu from "../components/MainMenu";
import Instructions from "../components/Instructions";
import Explanation from "../components/Explanation";
import GameCanvas from "../components/GameCanvas";
import GameOver from "../components/GameOver";
import VictoryScreen from "../components/VictoryScreen";

export default function Home() {
  const [screen, setScreen] = useState("menu");
  const [score, setScore] = useState(0);
  const [gameId, setGameId] = useState(0);
  const [bossLosses, setBossLosses] = useState(0);
  const [victoryType, setVictoryType] = useState("princess");

  // Bắt đầu một hành trình mới: xóa số lần thua Boss.
  const handleStartGame = () => {
    setScore(0);
    setBossLosses(0);
    setVictoryType("princess");
    setGameId((prev) => prev + 1);
    setScreen("playing");
  };

  // Chơi lại: giữ nguyên số lần thất bại với Boss.
  const handleRetry = () => {
    setScore(0);
    setGameId((prev) => prev + 1);
    setScreen("playing");
  };

  const handleBossLoss = useCallback(() => {
    setBossLosses((prev) => prev + 1);
  }, []);

  const handleGameOver = useCallback((finalScore) => {
    setScore(finalScore);
    setScreen("gameover");
  }, []);

  const handleVictory = useCallback((finalScore, type = "princess") => {
    setScore(finalScore);
    setVictoryType(type);
    setScreen("victory");
  }, []);

  const handleBackToMenu = () => {
    setBossLosses(0);
    setScreen("menu");
  };

  return (
    <main className="game-app">
      {screen === "menu" && (
        <MainMenu
          onPlay={handleStartGame}
          onInstructions={() => setScreen("instructions")}
          onExplanation={() => setScreen("explanation")}
        />
      )}

      {screen === "instructions" && (
        <Instructions
          onBack={handleBackToMenu}
          onPlay={handleStartGame}
        />
      )}

      {screen === "explanation" && (
        <Explanation onBack={handleBackToMenu} />
      )}

      {screen === "playing" && (
        <GameCanvas
          key={gameId}
          bossLosses={bossLosses}
          onBossLoss={handleBossLoss}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
          onExit={handleBackToMenu}
        />
      )}

      {screen === "gameover" && (
        <GameOver
          score={score}
          onRetry={handleRetry}
          onHome={handleBackToMenu}
        />
      )}

      {screen === "victory" && (
        <VictoryScreen
          score={score}
          victoryType={victoryType}
          onRetry={handleStartGame}
          onHome={handleBackToMenu}
        />
      )}
    </main>
  );
}