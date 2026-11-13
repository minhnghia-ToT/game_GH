
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WIDTH = 480;
const HEIGHT = 720;
const WIN_SCORE = 100;

export default function GameCanvas({
  onGameOver,
  onVictory,
  onExit,
}) {
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
    princeMode: false,
  });

  const [notice, setNotice] = useState("");
  const [bossDialogue, setBossDialogue] = useState(null);
  const noticeTimeoutRef = useRef(null);

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => {
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
      maxLives: 100,
      damage: 1,
      maxDamage: 3,

      player: {
        x: WIDTH / 2,
        y: HEIGHT - 95,
        width: 64,
        height: 76,
        speed: 3.8,
      },

      bullets: [],
      ghosts: [],
      items: [],
      bossActive: false,
      bossHp: 100,
      bossX: WIDTH / 2,
      bossY: 125,
      bossShots: [],
      bossAttackCount: 0,
      princeMode: false,
      bossDialogueOpen: false,
      lastBossAttack: 0,
      lastPrinceSlash: 0,
      princeSlashUntil: 0,
      bossSplitAt: 0,
      victoryPending: false,

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
      const spawnInterval = game.bossActive ? 4500 : 8000;
      if (now - game.lastItemSpawn < spawnInterval) return;

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

    function startBoss(now) {
      if (game.bossActive) return;

      game.bossActive = true;
      game.bossHp = 100;
      game.bossX = WIDTH / 2;
      game.bossShots = [];
      game.bossAttackCount = 0;
      game.ghosts = [];
      game.bullets = [];
      game.princeMode = false;
      game.bossDialogueOpen = true;
      game.lastBossAttack = now - 650;
      game.lastPrinceSlash = now;
      setHud((current) => ({
        ...current,
        score: WIN_SCORE,
        lives: game.lives,
        level: getDifficulty().level,
        damage: game.damage,
        shield: false,
        princeMode: false,
      }));

      setBossDialogue({
        title: game.princeMode ? "HOÀNG TỬ" : "THẮNG A.K.A ACQUY 666",
        message: game.princeMode
          ? "Anh xin lỗi vì để em phải chiến đấu một mình, anh đã ở đây bên em rồi em đừng lo"
          : "Chào em tao là Thắng a.k.a acquy 666 bây giờ đã sẽ hạ em và làm em quên đi hàng từ",
        action: game.princeMode ? "CHIẾN ĐẤU CÙNG HOÀNG TỬ" : "BẮT ĐẦU CHIẾN ĐẤU",
      });
    }

    function startPrincePhase(now) {
      game.princeMode = true;
      game.lives = 3;
      game.bossShots = [];
      game.bullets = [];
      game.bossDialogueOpen = true;
      game.lastPrinceSlash = now;
      game.invulnerableUntil = 0;
      game.shieldUntil = 0;
      setHud((current) => ({
        ...current,
        lives: game.lives,
        shield: false,
        princeMode: true,
      }));

      setBossDialogue({
        title: "HOÀNG TỬ",
        message:
          "Anh xin lỗi vì để em phải chiến đấu một mình, anh đã ở đây bên em rồi em đừng lo",
        action: "CHIẾN ĐẤU CÙNG HOÀNG TỬ",
      });
    }

    function defeatBoss(now) {
      if (game.ended || game.victoryPending) return;
      game.bossHp = 0;
      game.victoryPending = true;
      game.bossSplitAt = now;
    }

    function slashBoss(now, force = false) {
      const cooldown = force ? 250 : 700;
      if (
        now - game.lastPrinceSlash < cooldown ||
        game.ended ||
        game.bossHp <= 0
      ) {
        return;
      }

      game.bossHp = Math.max(0, game.bossHp - 20);
      game.lastPrinceSlash = now;
      game.princeSlashUntil = now + 240;

      if (game.bossHp === 0) {
        defeatBoss(now);
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
            if (game.bossActive) {
              game.score = WIN_SCORE;
            } else {
              startBoss(now);
            }
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
      if (game.bossDialogueOpen) return;
      if (game.victoryPending) {
        if (now - game.bossSplitAt >= 650) {
          game.victoryPending = false;
          game.ended = true;
          onVictory?.(WIN_SCORE, "prince");
        }
        return;
      }

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
      const isShooting =
        game.keys.Space ||
        game.mouseDown ||
        game.touch.shoot;

      if (game.princeMode && game.bossActive) {
        slashBoss(now, isShooting);
      } else if (isShooting && !game.bossActive) {
        shoot(now);
      }

      // Sinh ma và vật phẩm.
      if (!game.bossActive) {
        spawnGhost(now);
      }
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

      if (game.bossActive) {
        game.bossX = WIDTH / 2 + Math.sin(now / 900) * 125;

        if (
          !game.princeMode &&
          now - game.lastBossAttack >= 650
        ) {
          if (game.bossAttackCount === 0) {
            game.bossShots.push({
              x: WIDTH / 2,
              y: game.bossY + 28,
              vx: 0,
              vy: 8,
              width: WIDTH,
              height: 56,
            });
          } else {
            const angleToPlayer = Math.atan2(
              game.player.x - game.bossX,
              game.player.y - game.bossY
            );
            [-0.26, 0, 0.26].forEach((spread) => {
              const angle = angleToPlayer + spread;
              game.bossShots.push({
                x: game.bossX,
                y: game.bossY + 28,
                vx: Math.sin(angle) * 6,
                vy: Math.cos(angle) * 6,
                width: 16,
                height: 36,
              });
            });
          }
          game.bossAttackCount += 1;
          game.lastBossAttack = now;
        }

        game.bossShots.forEach((shot) => {
          shot.x += shot.vx;
          shot.y += shot.vy;
        });

        const remainingBossShots = [];
        for (const shot of game.bossShots) {
          const hitPlayer =
            Math.abs(shot.x - game.player.x) <
              (shot.width + game.player.width) / 2 &&
            Math.abs(shot.y - game.player.y) <
              (shot.height + game.player.height) / 2;

          if (hitPlayer) {
            if (!game.princeMode) {
              startPrincePhase(now);
              return;
            }
          } else if (
            shot.y < HEIGHT + shot.height &&
            shot.x > -shot.width &&
            shot.x < WIDTH + shot.width
          ) {
            remainingBossShots.push(shot);
          }
        }
        game.bossShots = remainingBossShots;
      }

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
          if (hit) break;

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

      if (!game.bossActive && game.score >= WIN_SCORE) {
        startBoss(now);
        return;
      }

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
          princeMode: game.princeMode,
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

      if (game.princeMode) {
        ctx.fillStyle = "#5ba8ff";
        ctx.fillRect(
          player.x - 19,
          player.y - 22,
          38,
          43
        );
        ctx.fillStyle = "#ffe06a";
        ctx.fillRect(player.x - 20, player.y - 30, 40, 8);
        ctx.fillRect(player.x - 14, player.y - 38, 7, 9);
        ctx.fillRect(player.x - 3, player.y - 42, 7, 13);
        ctx.fillRect(player.x + 8, player.y - 38, 7, 9);
        ctx.fillStyle = "#fff";
        ctx.fillRect(player.x - 9, player.y - 10, 5, 6);
        ctx.fillRect(player.x + 5, player.y - 10, 5, 6);

        ctx.save();
        ctx.strokeStyle = "#e7f2ff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(player.x + 22, player.y - 7);
        ctx.lineTo(player.x + 44, player.y - 36);
        ctx.stroke();
        ctx.strokeStyle = "#ffe06a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x + 15, player.y - 10);
        ctx.lineTo(player.x + 27, player.y - 1);
        ctx.stroke();
        ctx.restore();

        if (now < game.princeSlashUntil) {
          ctx.save();
          ctx.strokeStyle = "#fff36a";
          ctx.lineWidth = 8;
          ctx.shadowColor = "#fff36a";
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(player.x, player.y - 20, 72, -0.8, 0.7);
          ctx.stroke();
          ctx.restore();
        }
      } else if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
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

    function drawBoss(now) {
      if (!game.bossActive) return;

      if (game.bossHp <= 0) {
        if (!game.victoryPending) return;

        const progress = Math.min(
          1,
          (now - game.bossSplitAt) / 650
        );
        const split = 40 + progress * 45;
        ctx.save();
        ctx.fillStyle = "#5c172e";
        ctx.shadowColor = "#ff315e";
        ctx.shadowBlur = 22;
        ctx.fillRect(game.bossX - split, game.bossY - 23 - progress * 20, 40, 52);
        ctx.fillRect(game.bossX + split, game.bossY - 23 - progress * 20, 40, 52);
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.fillStyle = "#5c172e";
      ctx.shadowColor = "#ff315e";
      ctx.shadowBlur = 22;
      ctx.fillRect(game.bossX - 40, game.bossY - 23, 80, 52);
      ctx.fillRect(game.bossX - 53, game.bossY - 10, 13, 30);
      ctx.fillRect(game.bossX + 40, game.bossY - 10, 13, 30);
      ctx.fillStyle = "#ff365c";
      ctx.fillRect(game.bossX - 26, game.bossY - 9, 12, 9);
      ctx.fillRect(game.bossX + 14, game.bossY - 9, 12, 9);
      ctx.fillStyle = "#ffe4ea";
      ctx.fillRect(game.bossX - 22, game.bossY - 7, 5, 4);
      ctx.fillRect(game.bossX + 18, game.bossY - 7, 5, 4);
      ctx.restore();

      ctx.fillStyle = "#401322";
      ctx.fillRect(WIDTH / 2 - 120, 25, 240, 13);
      ctx.fillStyle = "#ff315e";
      ctx.fillRect(
        WIDTH / 2 - 120,
        25,
        240 * (game.bossHp / 100),
        13
      );
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`THẮNG A.K.A ACQUY 666 - ${game.bossHp}/100 HP`, WIDTH / 2, 19);
    }

    function drawBossShots() {
      game.bossShots.forEach((shot) => {
        ctx.save();
        ctx.fillStyle = "#ff315e";
        ctx.shadowColor = "#ff1744";
        ctx.shadowBlur = 16;
        ctx.fillRect(
          shot.x - shot.width / 2,
          shot.y - shot.height / 2,
          shot.width,
          shot.height
        );
        ctx.restore();
      });
    }

    // =========================
    // VẼ VẬT PHẨM
    // =========================

    function drawItems() {
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
      drawItems();
      drawBullets();
      drawGhosts();
      drawBoss(now);
      drawBossShots();
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

      window.clearTimeout(noticeTimeoutRef.current);
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
        <span>
          {hud.princeMode
            ? "PHASE 2 · ⚔️ HOÀNG TỬ"
            : `SÁT THƯƠNG: ${hud.damage}/3`}
        </span>
        <span>
          {hud.shield ? "🛡️ BẢO VỆ" : "⚔️ CHIẾN ĐẤU"}
        </span>
      </div>

      {notice && (
        <div className="game-notice" role="status">
          {notice}
        </div>
      )}

      {bossDialogue && (
        <div className="boss-dialogue-overlay">
          <div
            className="boss-dialogue-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="boss-dialogue-title"
          >
            <p className="boss-dialogue-label">ĐỐI THỦ XUẤT HIỆN</p>
            <h2 id="boss-dialogue-title">{bossDialogue.title}</h2>
            <p>{bossDialogue.message}</p>
            <button
              type="button"
              onClick={() => {
                if (gameRef.current) {
                  gameRef.current.bossDialogueOpen = false;
                }
                setBossDialogue(null);
              }}
            >
              {bossDialogue.action}
            </button>
          </div>
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
        <span>
          SPACE / Chuột trái: {hud.princeMode ? "Chém" : "Bắn"}
        </span>
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
          {hud.princeMode ? "⚔️" : "🔫"}
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
