
"use client";

export default function VictoryScreen({
  score,
  onRetry,
  onHome,
}) {
  return (
    <section className="victory-screen">

      <div className="victory-card">

        <div className="victory-crown">
          ♛
        </div>

        <p className="section-label">
          MISSION COMPLETED
        </p>

        <div className="victory-heart">

          <div className="heart-content">

            <p>
              Chúc mừng em đã
              <br />
              bảo vệ được hoàng tử
              <br />
              của đời mình
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

        <h1>YOU ARE MY HERO!</h1>

        <p className="victory-score">
          {score} / 100 SOULS DEFEATED
        </p>

        <p className="victory-description">
          Em đã hoàn thành nhiệm vụ rồi.
          <br />
          Yêu em nhiều! ♡
        </p>

        <button
          className="game-button primary-button"
          onClick={onRetry}
        >
          CHƠI LẠI
        </button>

        <button
          className="back-button"
          onClick={onHome}
        >
          QUAY VỀ MENU
        </button>

      </div>

    </section>
  );
}
