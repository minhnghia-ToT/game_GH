
"use client";

import { useState } from "react";

import MainMenu from "../components/MainMenu";
import Instructions from "../components/Instructions";
import Explanation from "../components/Explanation";
import GameCanvas from "../components/GameCanvas";
import GameOver from "../components/GameOver";
import VictoryScreen from "../components/VictoryScreen";

export default function Home() {
  // Quản lý màn hình hiện tại
  const [screen, setScreen] = useState("menu");

  // Quản lý điểm số
  const [score, setScore] = useState(0);

  // Tạo ID mới để khởi động lại game
  const [gameId, setGameId] = useState(0);

  // Bắt đầu game mới
  const handleStartGame = () => {
    setScore(0);
    setGameId((prev) => prev + 1);
    setScreen("playing");
  };

  // Kết thúc game
  const handleGameOver = (finalScore) => {
    setScore(finalScore);
    setScreen("gameover");
  };

  // Chiến thắng
  const handleVictory = (finalScore) => {
    setScore(finalScore);
    setScreen("victory");
  };

  // Quay về menu chính
  const handleBackToMenu = () => {
    setScreen("menu");
  };

  return (
    <main className="game-app">

      {/* MÀN HÌNH MENU */}
      {screen === "menu" && (
        <MainMenu
          onPlay={handleStartGame}
          onInstructions={() => setScreen("instructions")}
          onExplanation={() => setScreen("explanation")}
        />
      )}

      {/* MÀN HÌNH HƯỚNG DẪN */}
      {screen === "instructions" && (
        <Instructions
          onBack={handleBackToMenu}
          onPlay={handleStartGame}
        />
      )}  

      {/* MÀN HÌNH GIẢI THÍCH */}
      {screen === "explanation" && (
        <Explanation
          onBack={handleBackToMenu}
        />
      )}

      {/* MÀN HÌNH GAMEPLAY */}
      {screen === "playing" && (
        <GameCanvas
          key={gameId}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
          onExit={handleBackToMenu}
        />
      )}

      {/* MÀN HÌNH GAME OVER */}
      {screen === "gameover" && (
        <GameOver
          score={score}
          onRetry={handleStartGame}
          onHome={handleBackToMenu}
        />
      )}

      {/* MÀN HÌNH CHIẾN THẮNG */}
      {screen === "victory" && (
        <VictoryScreen
          score={score}
          onRetry={handleStartGame}
          onHome={handleBackToMenu}
        />
      )}

    </main>
  );
}
