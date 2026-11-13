
"use client";

export default function MainMenu({
  onPlay,
  onInstructions,
  onExplanation,
}) {
  return (
    <section className="main-menu">
      <div className="menu-decoration">
        <span>✦</span>
        <span>♥</span>
        <span>✧</span>
      </div>

      <div className="menu-logo">
        <p className="menu-subtitle">
          A LITTLE GAME MADE WITH LOVE
        </p>

        <h1>
          PIXEL <span>LOVE</span>
        </h1>

        <div className="logo-divider">
          <span>──────</span> ♡ <span>──────</span>
        </div>
      </div>

      <div className="menu-content">
        <div className="character-container">
          <div className="character-glow"></div>

          <img
            src="/images/princess.png"
            alt="Pixel Love Princess"
            className="main-character"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <div className="character-caption">
            Let's protect our prince!
          </div>
        </div>

        <div className="menu-buttons">
          <p className="menu-welcome">
            WELCOME, LITTLE HERO
          </p>

          <h2>Cuộc phiêu lưu bắt đầu</h2>

          <p className="menu-description">
            Những linh hồn đang kéo đến.
            Hãy sử dụng phép thuật của mình
            để bảo vệ hoàng tử nhé!
          </p>

          <button
            className="game-button primary-button"
            onClick={onPlay}
          >
            ▶ CHƠI MỚI
          </button>

          <button
            className="game-button"
            onClick={onInstructions}
          >
            ▤ HƯỚNG DẪN CƠ BẢN
          </button>

          <button
            className="game-button"
            onClick={onExplanation}
          >
            ♡ GIẢI THÍCH
          </button>
        </div>
      </div>

      <div className="menu-footer">
        MADE WITH <span>♥</span> FOR YOU
      </div>
    </section>
  );
}
