"use client";

export default function VictoryScreen({
  score,
  onRetry,
  onHome,
  victoryType = "princess",
}) {
  const princeVictory = victoryType === "prince";

  return (
    <section className="victory-screen">
      <div className="victory-card">
        <div className="victory-crown">
          {princeVictory ? "⚔" : "♛"}
        </div>

        <p className="section-label">
          {princeVictory ? "THE PRINCE HAS ARRIVED" : "MISSION COMPLETED"}
        </p>

        <div className="victory-heart">
          <div className="heart-content">
            <p>
              {princeVictory
                ? "Anh đã đến để bảo vệ em"
                : "Chúc mừng em đã bảo vệ được hoàng tử của đời mình"}
            </p>
            <span>♥</span>
          </div>
        </div>

        <div className="victory-character">
          <img
            src="/images/princess.png"
            alt="Princess"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span>♡</span>
        </div>

        <h1>
          {princeVictory ? "I WILL PROTECT YOU!" : "YOU ARE MY HERO!"}
        </h1>

        <p className="victory-score">
          {score} / 100 SOULS DEFEATED
        </p>

        <p className="victory-description">
          {princeVictory ? (
            <>
              Anh đã nói là sẽ không để em chịu thiệt hay tổn thương mà.
              <br />
              Thằng này sẽ phải chết!!!
            </>
          ) : (
            <>
              Em đã hoàn thành nhiệm vụ rồi.
              <br />
              Yêu em nhiều! ♡
            </>
          )}
        </p>

        <button
          className="game-button primary-button"
          onClick={onRetry}
        >
          CHƠI LẠI
        </button>

        <button className="back-button" onClick={onHome}>
          QUAY VỀ MENU
        </button>
      </div>
    </section>
  );
}