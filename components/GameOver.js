
"use client";

export default function GameOver({
  score,
  onRetry,
  onHome,
}) {
  return (
    <section className="result-screen">

      <div className="result-card">

        <div className="broken-heart">
          💔
        </div>

        <p className="section-label">
          THE JOURNEY ENDS HERE
        </p>

        <h1 className="game-over-title">
          GAME OVER
        </h1>

        <div className="final-score">
          <p>ĐIỂM ĐẠT ĐƯỢC</p>

          <strong>{score}</strong>
        </div>

        <p className="result-description">
          Đừng buồn nhé!
          Hãy thử lại một lần nữa
          để bảo vệ hoàng tử của mình.
        </p>

        <button
          className="game-button primary-button"
          onClick={onRetry}
        >
          ↻ CHƠI LẠI
        </button>

        <button
          className="game-button"
          onClick={onHome}
        >
          ⌂ QUAY VỀ MENU
        </button>

      </div>

    </section>
  );
}
