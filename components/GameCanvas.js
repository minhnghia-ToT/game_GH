
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WIDTH = 480;
const HEIGHT = 720;
const WIN_SCORE = 100;

export default function GameCanvas({ onGameOver, onVictory, onExit }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animationRef = useRef(null);
  const imageRef = useRef(null);

  const [hud, setHud] = useState({
    score: 0,
    lives: 3,
    level: "DỄ",
    damage: 1,
    shield: false,
  });

  const [notice, setNotice] = useState("");

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(showNotice.timeout);
    showNotice.timeout = window.setTimeout(() => {
      setNotice("");
    }, 1400);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const princess = new Image();
    princess.src = "/images/princess.png";
    imageRef.current = princess;

    const game = {
      score: 0,
      lives: 3,
      maxLives: 5,
      damage: 1,
      maxDamage: 3,

      player: {
        x: WIDTH / 2,
        y: HEIGHT - 95,
        width: 64,
        height: 76,
        speed: 5,
      },

      bullets: [],
      ghosts: [],
      items: [],

      keys: {},
      mouseDown: false,
      touch: {
        left: false,
        right: false,
        shoot: false,
      },

      lastShot: 0,
      lastSpawn: 0,
      lastItemSpawn: 0,

      invulnerableUntil: 0,
      shieldUntil: 0,
      explosionUntil: 0,

      hardStartedAt: 0,
      nextShieldAt: 0,

      stars: Array.from({ length: 65 }, () => ({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        speed: 0.3 + Math.random() * 1.2,
        size: Math.random() * 2 + 1,
      })),

      ended: false,
      lastHudUpdate: 0,
    };

    gameRef.current = game;

    // =========================
    // ĐỘ KHÓ
    // =========================

    function getDifficulty() {
      if (game.score <= 30) {
        return {
          level: "DỄ",
          spawn: 1150,
          speed: 1.5,
          hp: 2,
          maxGhosts: 5,
        };
      }

      if (game.score <= 70) {
        return {
          level: "KHÁ",
          spawn: 850,
          speed: 2.2,
          hp: 1,
          maxGhosts: 7,
        };
      }

      return {
        level: "KHÓ",
        spawn: 600,
        speed: 3.2,
        hp: 1,
        maxGhosts: 9,
      };
    }

    // =========================
    // TẠO ĐẠN
    // =========================

    function shoot(now) {
      if (now - game.lastShot < 250) return;

      game.bullets.push({
        x: game.player.x,
        y: game.player.y - 30,
        width: 7 + game.damage,
        height: 18,
        speed: 8,
        damage: game.damage,
      });

      game.lastShot = now;
    }

    // =========================
    // TẠO MA
    // =========================

    function spawnGhost(now) {
      const difficulty = getDifficulty();

      if (now - game.lastSpawn < difficulty.spawn) return;
      if (game.ghosts.length >= difficulty.maxGhosts) return;

      const size = 34 + Math.random() * 12;

      game.ghosts.push({
        x: 30 + Math.random() * (WIDTH - 60),
        y: -size,
        width: size,
        height: size,
        speed: difficulty.speed + Math.random() * 1.1,
        hp: difficulty.hp,
        maxHp: difficulty.hp,
        wobble: Math.random() * Math.PI * 2,
      });

      game.lastSpawn = now;
    }

    // =========================
    // TẠO VẬT PHẨM
    // =========================

    function spawnItem(now) {
      if (now - game.lastItemSpawn < 8000) return;

      // M10 chỉ xuất hiện khi có ít nhất 8 con ma.
      const canSpawnM10 = game.ghosts.length >= 8;

      // Không cho nhiều M10 xuất hiện cùng lúc.
      if (game.items.some((item) => item.type === "M10")) return;

      const random = Math.random();
      let type = null;

      if (canSpawnM10 && random < 0.1) {
        type = "M10";
      } else if (game.lives < game.maxLives && random < 0.45) {
        type = "HEART";
      } else if (game.damage < game.maxDamage && random < 0.75) {
        type = "POWER";
      } else {
        type = "SHIELD";
      }

      game.items.push({
        x: 30 + Math.random() * (WIDTH - 60),
        y: -35,
        size: 32,
        speed: getDifficulty().speed * 0.8,
        type,
      });

      game.lastItemSpawn = now;
    }

    // =========================
    // BẤT TỬ
    // =========================

    function updateShield(now) {
      if (game.score < 71) return;

      if (game.hardStartedAt === 0) {
        game.hardStartedAt = now;
        game.nextShieldAt = now + 10000;
      }

      // Cứ 10 giây nhận 2 giây bất tử.
      if (now >= game.nextShieldAt) {
        game.shieldUntil = Math.max(game.shieldUntil, now + 2000);
        game.nextShieldAt = now + 10000;
        showNotice("🛡️ BẠN ĐANG BẤT TỬ!");
      }
    }

    // =========================
    // MẤT MẠNG
    // =========================

    function loseLife(now) {
      if (now < game.invulnerableUntil) return;
      if (now < game.shieldUntil) return;

      game.lives -= 1;
      game.invulnerableUntil = now + 1500;

      showNotice("Bạn đã mất 1 mạng!");

      if (game.lives <= 0) {
        game.ended = true;
        onGameOver?.(game.score);
      }
    }

    // =========================
    // NHẶT VẬT PHẨM
    // =========================

    function collectItem(item, now) {
      switch (item.type) {
        case "HEART": {
          if (game.lives >= game.maxLives) {
            showNotice("❤️ Mạng đã đầy!");
          } else {
            game.lives = Math.min(game.lives + 1, game.maxLives);
            showNotice("❤️ +1 MẠNG!");
          }
          break;
        }

        case "POWER": {
          if (game.damage >= game.maxDamage) {
            showNotice("⚡ Sức mạnh đã tối đa!");
          } else {
            game.damage = Math.min(game.damage + 1, game.maxDamage);
            showNotice(`⚡ SÁT THƯƠNG CẤP ${game.damage}!`);
          }
          break;
        }

        case "SHIELD": {
          game.shieldUntil = Math.max(game.shieldUntil, now) + 5000;
          showNotice("🛡️ BẤT TỬ 5 GIÂY!");
          break;
        }

        case "M10": {
          const destroyedCount = game.ghosts.length;

          game.ghosts = [];
          game.score = Math.min(WIN_SCORE, game.score + destroyedCount);
          game.explosionUntil = now + 1000;

          showNotice(`💣 M10! TIÊU DIỆT ${destroyedCount} CON MA!`);

          if (game.score >= WIN_SCORE) {
            game.ended = true;
            onVictory?.(WIN_SCORE);
          }
          break;
        }

        default:
          break;
      }
    }

    // =========================
    // CẬP NHẬT GAME
    // =========================

    function update(now) {
      if (game.ended) return;

      const difficulty = getDifficulty();

      updateShield(now);

      // Di chuyển nhân vật.
      const moveLeft =
        game.keys.ArrowLeft ||
        game.keys.a ||
        game.keys.A ||
        game.touch.left;

      const moveRight =
        game.keys.ArrowRight ||
        game.keys.d ||
        game.keys.D ||
        game.touch.right;

      if (moveLeft) {
        game.player.x -= game.player.speed;
      }

      if (moveRight) {
        game.player.x += game.player.speed;
      }

      game.player.x = Math.max(
        game.player.width / 2,
        Math.min(WIDTH - game.player.width / 2, game.player.x)
      );

      // Bắn đạn.
      if (
        game.keys.Space ||
        game.mouseDown ||
        game.touch.shoot
      ) {
        shoot(now);
      }

      // Sinh ma và vật phẩm.
      spawnGhost(now);
      spawnItem(now);

      // Di chuyển sao nền.
      game.stars.forEach((star) => {
        star.y += star.speed;

        if (star.y > HEIGHT) {
          star.y = 0;
          star.x = Math.random() * WIDTH;
        }
      });

      // Di chuyển đạn.
      game.bullets.forEach((bullet) => {
        bullet.y -= bullet.speed;
      });

      game.bullets = game.bullets.filter(
        (bullet) => bullet.y + bullet.height > 0
      );

      // Di chuyển vật phẩm.
      game.items.forEach((item) => {
        item.y += item.speed;
      });

      // Kiểm tra nhặt vật phẩm.
      const remainingItems = [];

      for (const item of game.items) {
        const collected =
          Math.abs(item.x - game.player.x) < 38 &&
          Math.abs(item.y - game.player.y) < 48;

        if (collected) {
          collectItem(item, now);

          if (game.ended) return;
        } else if (item.y < HEIGHT + 40) {
          remainingItems.push(item);
        }
      }

      game.items = remainingItems;

      // Di chuyển ma.
      game.ghosts.forEach((ghost) => {
        ghost.y += ghost.speed;
        ghost.wobble += 0.04;
        ghost.x += Math.sin(ghost.wobble) * 0.35;
      });

      // Kiểm tra đạn va chạm với ma.
      const remainingBullets = [];

      for (const bullet of game.bullets) {
        let hit = false;

        for (const ghost of game.ghosts) {
          const collision =
            Math.abs(bullet.x - ghost.x) <
              (ghost.width + bullet.width) / 2 &&
            Math.abs(bullet.y - ghost.y) <
              (ghost.height + bullet.height) / 2;

          if (collision) {
            ghost.hp -= bullet.damage;
            hit = true;

            if (ghost.hp <= 0) {
              ghost.destroyed = true;
              game.score = Math.min(WIN_SCORE, game.score + 1);
            }

            break;
          }
        }

        if (!hit) {
          remainingBullets.push(bullet);
        }
      }

      game.bullets = remainingBullets;
      game.ghosts = game.ghosts.filter((ghost) => !ghost.destroyed);

      // Ma chạm vào người chơi hoặc vượt khỏi màn hình.
      for (const ghost of game.ghosts) {
        const collision =
          Math.abs(ghost.x - game.player.x) <
            (ghost.width + game.player.width) / 2 - 10 &&
          Math.abs(ghost.y - game.player.y) <
            (ghost.height + game.player.height) / 2 - 10;

        if (collision) {
          ghost.destroyed = true;
          loseLife(now);
        } else if (ghost.y - ghost.height / 2 > HEIGHT) {
          ghost.destroyed = true;
          loseLife(now);
        }

        if (game.ended) return;
      }

      game.ghosts = game.ghosts.filter((ghost) => !ghost.destroyed);

      // Kiểm tra chiến thắng.
      if (game.score >= WIN_SCORE) {
        game.ended = true;
        onVictory?.(WIN_SCORE);
        return;
      }

      // Cập nhật HUD.
      if (now - game.lastHudUpdate > 100) {
        setHud({
          score: game.score,
          lives: game.lives,
          level: difficulty.level,
          damage: game.damage,
          shield:
            now < game.shieldUntil ||
            now < game.invulnerableUntil,
        });

        game.lastHudUpdate = now;
      }
    }

    // =========================
    // VẼ NỀN
    // =========================

    function drawBackground() {
      ctx.fillStyle = "#090914";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Sao.
      game.stars.forEach((star) => {
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Vệt sáng hai bên.
      ctx.fillStyle = "rgba(255, 90, 170, 0.08)";
      ctx.fillRect(0, 0, 5, HEIGHT);
      ctx.fillRect(WIDTH - 5, 0, 5, HEIGHT);
    }

    // =========================
    // VẼ NGƯỜI CHƠI
    // =========================

    function drawPlayer(now) {
      const player = game.player;

      // Nhấp nháy khi được bảo vệ.
      if (
        now < game.invulnerableUntil ||
        now < game.shieldUntil
      ) {
        if (Math.floor(now / 100) % 2 === 0) {
          ctx.globalAlpha = 0.45;
        }
      }

      if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
        ctx.drawImage(
          imageRef.current,
          player.x - player.width / 2,
          player.y - player.height / 2,
          player.width,
          player.height
        );
      } else {
        ctx.fillStyle = "#ff75c3";
        ctx.fillRect(
          player.x - player.width / 2,
          player.y - player.height / 2,
          player.width,
          player.height
        );
      }

      ctx.globalAlpha = 1;

      // Vòng bảo vệ.
      if (now < game.shieldUntil) {
        ctx.strokeStyle = "#65eaff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 47, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // =========================
    // VẼ ĐẠN
    // =========================

    function drawBullets() {
      game.bullets.forEach((bullet) => {
        ctx.fillStyle =
          bullet.damage >= 3
            ? "#fff36a"
            : bullet.damage === 2
              ? "#65eaff"
              : "#ff9bdd";

        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;

        ctx.fillRect(
          bullet.x - bullet.width / 2,
          bullet.y - bullet.height / 2,
          bullet.width,
          bullet.height
        );

        ctx.shadowBlur = 0;
      });
    }

    // =========================
    // VẼ MA
    // =========================

    function drawGhosts() {
      game.ghosts.forEach((ghost) => {
        const x = ghost.x;
        const y = ghost.y;
        const size = ghost.width;

        ctx.fillStyle = "#c78cff";

        // Thân ma pixel.
        ctx.fillRect(
          x - size / 2,
          y - size / 2,
          size,
          size * 0.72
        );

        ctx.fillRect(
          x - size / 2,
          y + size * 0.1,
          size * 0.25,
          size * 0.25
        );

        ctx.fillRect(
          x - size * 0.12,
          y + size * 0.1,
          size * 0.25,
          size * 0.25
        );

        ctx.fillRect(
          x + size * 0.25,
          y + size * 0.1,
          size * 0.25,
          size * 0.25
        );

        // Mắt.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - size * 0.23, y - size * 0.12, 5, 7);
        ctx.fillRect(x + size * 0.12, y - size * 0.12, 5, 7);

        // Thanh máu.
        if (ghost.maxHp > 1) {
          ctx.fillStyle = "#3a2445";
          ctx.fillRect(x - size / 2, y - size / 2 - 9, size, 4);

          ctx.fillStyle = "#ff75bd";
          ctx.fillRect(
            x - size / 2,
            y - size / 2 - 9,
            size * (ghost.hp / ghost.maxHp),
            4
          );
        }
      });
    }

    // =========================
    // VẼ VẬT PHẨM
    // =========================

    function drawItems(now) {
      game.items.forEach((item) => {
        const x = item.x;
        const y = item.y;
        const size = item.size;

        const styles = {
          HEART: {
            color: "#ff4f91",
            symbol: "♥",
          },
          POWER: {
            color: "#ffe45e",
            symbol: "⚡",
          },
          SHIELD: {
            color: "#65eaff",
            symbol: "S",
          },
          M10: {
            color: "#ff573d",
            symbol: "M10",
          },
        };

        const style = styles[item.type];

        ctx.save();

        ctx.shadowColor = style.color;
        ctx.shadowBlur = item.type === "M10" ? 22 : 12;

        ctx.fillStyle = "rgba(15, 12, 30, 0.95)";
        ctx.fillRect(
          x - size / 2,
          y - size / 2,
          size,
          size
        );

        ctx.strokeStyle = style.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(
          x - size / 2,
          y - size / 2,
          size,
          size
        );

        ctx.shadowBlur = 0;
        ctx.fillStyle = style.color;
        ctx.font =
          item.type === "M10"
            ? "bold 13px monospace"
            : "bold 23px monospace";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(style.symbol, x, y);

        ctx.restore();
      });
    }

    // =========================
    // HIỆU ỨNG M10
    // =========================

    function drawExplosion(now) {
      if (now > game.explosionUntil) return;

      const progress =
        1 - (game.explosionUntil - now) / 1000;

      const radius = 30 + progress * 350;

      ctx.save();

      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = "#ff573d";
      ctx.lineWidth = 12;
      ctx.shadowColor = "#ff573d";
      ctx.shadowBlur = 35;

      ctx.beginPath();
      ctx.arc(WIDTH / 2, HEIGHT / 2, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 87, 61, 0.15)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.restore();
    }

    // =========================
    // VẼ GAME
    // =========================

    function draw(now) {
      drawBackground();
      drawItems(now);
      drawBullets();
      drawGhosts();
      drawPlayer(now);
      drawExplosion(now);
    }

    // =========================
    // VÒNG LẶP GAME
    // =========================

    function gameLoop(now) {
      update(now);
      draw(now);

      if (!game.ended) {
        animationRef.current = requestAnimationFrame(gameLoop);
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);

    // =========================
    // BÀN PHÍM
    // =========================

    function handleKeyDown(event) {
      const key = event.key;

      if (
        ["ArrowLeft", "ArrowRight", " "].includes(key)
      ) {
        event.preventDefault();
      }

      game.keys[key] = true;

      if (key === " ") {
        game.keys.Space = true;
      }
    }

    function handleKeyUp(event) {
      game.keys[event.key] = false;

      if (event.key === " ") {
        game.keys.Space = false;
      }
    }

    // =========================
    // CHUỘT
    // =========================

    function handleMouseDown(event) {
      if (event.button === 0) {
        game.mouseDown = true;
      }
    }

    function handleMouseUp() {
      game.mouseDown = false;
    }

    // =========================
    // ĐIỀU KHIỂN CẢM ỨNG
    // =========================

    function handleTouchStart(event) {
      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];

      const x =
        ((touch.clientX - rect.left) / rect.width) * WIDTH;

      if (x < WIDTH * 0.33) {
        game.touch.left = true;
      } else if (x > WIDTH * 0.66) {
        game.touch.right = true;
      } else {
        game.touch.shoot = true;
      }
    }

    function handleTouchMove(event) {
      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];

      const x =
        ((touch.clientX - rect.left) / rect.width) * WIDTH;

      game.touch.left = x < WIDTH * 0.33;
      game.touch.right = x > WIDTH * 0.66;
      game.touch.shoot =
        x >= WIDTH * 0.33 && x <= WIDTH * 0.66;
    }

    function handleTouchEnd() {
      game.touch.left = false;
      game.touch.right = false;
      game.touch.shoot = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mouseup", handleMouseUp);

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    canvas.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      cancelAnimationFrame(animationRef.current);

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mouseup", handleMouseUp);

      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);

      window.clearTimeout(showNotice.timeout);
    };
  }, [onGameOver, onVictory, showNotice]);

  return (
    <div className="game-container">
      <div className="game-topbar">
        <button
          type="button"
          className="game-exit-button"
          onClick={onExit}
        >
          ← Thoát
        </button>

        <div className="game-score">
          ĐIỂM: {hud.score}/{WIN_SCORE}
        </div>

        <div className="game-lives">
          {"❤️".repeat(hud.lives)}
        </div>
      </div>

      <div className="game-status">
        <span>ĐỘ KHÓ: {hud.level}</span>
        <span>SÁT THƯƠNG: {hud.damage}/3</span>
        <span>
          {hud.shield ? "🛡️ BẢO VỆ" : "⚔️ CHIẾN ĐẤU"}
        </span>
      </div>

      {notice && (
        <div className="game-notice" role="status">
          {notice}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="game-canvas"
      />

      <div className="game-controls-help">
        <span>← → / A D: Di chuyển</span>
        <span>SPACE / Chuột trái: Bắn</span>
      </div>

      <div className="mobile-controls">
        <button
          type="button"
          onTouchStart={(event) => {
            event.preventDefault();
            if (gameRef.current) {
              gameRef.current.touch.left = true;
            }
          }}
          onTouchEnd={() => {
            if (gameRef.current) {
              gameRef.current.touch.left = false;
            }
          }}
          onMouseDown={() => {
            if (gameRef.current) {
              gameRef.current.touch.left = true;
            }
          }}
          onMouseUp={() => {
            if (gameRef.current) {
              gameRef.current.touch.left = false;
            }
          }}
        >
          ◀
        </button>

        <button
          type="button"
          onTouchStart={(event) => {
            event.preventDefault();
            if (gameRef.current) {
              gameRef.current.touch.shoot = true;
            }
          }}
          onTouchEnd={() => {
            if (gameRef.current) {
              gameRef.current.touch.shoot = false;
            }
          }}
          onMouseDown={() => {
            if (gameRef.current) {
              gameRef.current.touch.shoot = true;
            }
          }}
          onMouseUp={() => {
            if (gameRef.current) {
              gameRef.current.touch.shoot = false;
            }
          }}
        >
          🔫
        </button>

        <button
          type="button"
          onTouchStart={(event) => {
            event.preventDefault();
            if (gameRef.current) {
              gameRef.current.touch.right = true;
            }
          }}
          onTouchEnd={() => {
            if (gameRef.current) {
              gameRef.current.touch.right = false;
            }
          }}
          onMouseDown={() => {
            if (gameRef.current) {
              gameRef.current.touch.right = true;
            }
          }}
          onMouseUp={() => {
            if (gameRef.current) {
              gameRef.current.touch.right = false;
            }
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
