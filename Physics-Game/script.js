window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  canvas.width = 1280;
  canvas.height = 720;
  ctx.fillStyle = "white";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";

  class Player {
    constructor(game) {
      this.game = game;
      this.collisionX = this.game.width * 0.5;
      this.collisionY = this.game.height * 0.5;
      this.collisionRadius = 30;
      this.speedX = 0;
      this.speedY = 0;
      this.dx = 0;
      this.dy = 0;
      this.speedModifier = 5;
      this.spriteWidth = 255;
      this.spriteHeight = 256;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.spriteX;
      this.spriteY;
      this.frameX = 0;
      this.frameY = 5;
      this.image = document.getElementById("bull");
      this.jumpOffset = 0;
      this.isJumping = false;
      this.jumpSpeed = 0;
      // health
      this.maxLives = 3;
      this.lives = 3;
      this.hitCooldown = 0;
      this.hitCooldownMax = 1500;
      // shield
      this.shieldActive = false;
      this.shieldTimer = 0;
      this.shieldDuration = 2000;
      this.shieldCooldownTimer = 0;
      this.shieldCooldown = 6000;
      this.shieldReady = true;
      this.shieldRadius = this.collisionRadius + 22;
    }

    activateShield() {
      if (this.shieldReady && !this.shieldActive) {
        this.shieldActive = true;
        this.shieldTimer = 0;
        this.shieldReady = false;
        this.shieldCooldownTimer = 0;
      }
    }

    jump() {
      if (!this.isJumping) {
        this.isJumping = true;
        this.jumpSpeed = -8;
      }
    }

    draw(context) {
      // shield glow
      if (this.shieldActive) {
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.01);
        const gradient = context.createRadialGradient(
          this.collisionX,
          this.collisionY,
          5,
          this.collisionX,
          this.collisionY,
          this.shieldRadius + 10,
        );
        gradient.addColorStop(0, "rgba(0, 255, 255, 0.5)");
        gradient.addColorStop(0.6, "rgba(0, 120, 255, 0.3)");
        gradient.addColorStop(1, "rgba(0, 0, 255, 0)");
        context.save();
        context.globalAlpha = pulse;
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(
          this.collisionX,
          this.collisionY,
          this.shieldRadius + 10,
          0,
          Math.PI * 2,
        );
        context.fill();
        context.strokeStyle = "#00ffff";
        context.lineWidth = 3;
        context.globalAlpha = 0.9 * pulse;
        context.stroke();
        context.restore();
      }

      // flash when hit (invincibility frames)
      const shouldFlash =
        this.hitCooldown > 0 && Math.floor(this.hitCooldown / 120) % 2 === 0;
      if (!shouldFlash) {
        context.drawImage(
          this.image,
          this.frameX * this.spriteWidth,
          this.frameY * this.spriteHeight,
          this.spriteWidth,
          this.spriteHeight,
          this.spriteX,
          this.spriteY,
          this.width,
          this.height,
        );
      }

      if (this.game.debug) {
        context.beginPath();
        context.arc(
          this.collisionX,
          this.collisionY,
          this.collisionRadius,
          0,
          Math.PI * 2,
        );
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();
        context.beginPath();
        context.moveTo(this.collisionX, this.collisionY);
        context.lineTo(this.game.mouse.x, this.game.mouse.y);
        context.stroke();
      }
    }

    update(deltaTime) {
      this.dx = this.game.mouse.x - this.collisionX;
      this.dy = this.game.mouse.y - this.collisionY;

      if (this.isJumping) {
        this.jumpOffset += this.jumpSpeed;
        this.jumpSpeed += 0.5;
        if (this.jumpOffset >= 0) {
          this.jumpOffset = 0;
          this.isJumping = false;
          this.jumpSpeed = 0;
        }
      }

      // shield timing
      if (this.shieldActive) {
        this.shieldTimer += deltaTime;
        if (this.shieldTimer >= this.shieldDuration) {
          this.shieldActive = false;
        }
      } else if (!this.shieldReady) {
        this.shieldCooldownTimer += deltaTime;
        if (this.shieldCooldownTimer >= this.shieldCooldown) {
          this.shieldReady = true;
        }
      }

      if (this.hitCooldown > 0) this.hitCooldown -= deltaTime;

      const angle = Math.atan2(this.dy, this.dx);
      if (angle < -2.74 || angle > 2.74) this.frameY = 6;
      else if (angle < -1.96) this.frameY = 7;
      else if (angle < -1.17) this.frameY = 0;
      else if (angle < -0.39) this.frameY = 1;
      else if (angle < 0.39) this.frameY = 2;
      else if (angle < 1.17) this.frameY = 3;
      else if (angle < 1.96) this.frameY = 4;
      else if (angle < 2.74) this.frameY = 5;

      const distance = Math.hypot(this.dy, this.dx);
      if (distance > this.speedModifier) {
        this.speedX = this.dx / distance || 0;
        this.speedY = this.dy / distance || 0;
      } else {
        this.speedX = 0;
        this.speedY = 0;
      }
      this.collisionX += this.speedX * this.speedModifier;
      this.collisionY += this.speedY * this.speedModifier;
      this.spriteX = this.collisionX - this.width * 0.5;
      this.spriteY =
        this.collisionY - this.height * 0.5 - 100 + this.jumpOffset;

      if (this.collisionX < this.collisionRadius)
        this.collisionX = this.collisionRadius;
      else if (this.collisionX > this.game.width - this.collisionRadius)
        this.collisionX = this.game.width - this.collisionRadius;
      if (this.collisionY < this.game.topMargin + this.collisionRadius)
        this.collisionY = this.game.topMargin + this.collisionRadius;
      else if (this.collisionY > this.game.height - this.collisionRadius)
        this.collisionY = this.game.height - this.collisionRadius;

      this.game.obstacles.forEach((obstacle) => {
        let [collision, distance, sumOfRadii, dx, dy] =
          this.game.checkCollision(this, obstacle);
        if (collision) {
          const unit_x = dx / distance;
          const unit_y = dy / distance;
          this.collisionX = obstacle.collisionX + (sumOfRadii + 1) * unit_x;
          this.collisionY = obstacle.collisionY + (sumOfRadii + 1) * unit_y;
        }
      });

      for (let i = this.game.eggs.length - 1; i >= 0; i--) {
        let egg = this.game.eggs[i];
        let [collision] = this.game.checkCollision(this, egg);
        if (collision) {
          this.game.eggs.splice(i, 1);
          this.game.score++;
          document.getElementById("score").textContent =
            "Score: " + this.game.score;
        }
      }
    }
  }

  class Obstacle {
    constructor(game) {
      this.game = game;
      this.collisionX = Math.random() * this.game.width;
      this.collisionY = Math.random() * this.game.height;
      this.collisionRadius = 40;
      this.image = document.getElementById("obstacles");
      this.spriteWidth = 250;
      this.spriteHeight = 250;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.spriteX = this.collisionX - this.width * 0.5;
      this.spriteY = this.collisionY - this.height * 0.5 - 70;
      this.frameX = Math.floor(Math.random() * 4);
      this.frameY = Math.floor(Math.random() * 3);
      // shooting
      this.shootInterval = 3000 + Math.random() * 4000;
      this.shootTimer = Math.random() * this.shootInterval;
      this.chargeTimer = 0;
      this.isCharging = false;
    }

    draw(context) {
      // warning glow before shooting
      if (this.isCharging) {
        const intensity = this.chargeTimer / 800;
        context.save();
        context.globalAlpha = intensity * 0.6;
        const gradient = context.createRadialGradient(
          this.collisionX,
          this.collisionY,
          0,
          this.collisionX,
          this.collisionY,
          this.collisionRadius + 30,
        );
        gradient.addColorStop(0, "#ff4400");
        gradient.addColorStop(1, "rgba(255, 68, 0, 0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(
          this.collisionX,
          this.collisionY,
          this.collisionRadius + 30,
          0,
          Math.PI * 2,
        );
        context.fill();
        context.restore();
      }

      context.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.width,
        this.height,
      );
      if (this.game.debug) {
        context.beginPath();
        context.arc(
          this.collisionX,
          this.collisionY,
          this.collisionRadius,
          0,
          Math.PI * 2,
        );
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    update(deltaTime) {
      this.shootTimer += deltaTime;
      const chargeTime = 800;

      if (
        !this.isCharging &&
        this.shootTimer >= this.shootInterval - chargeTime
      ) {
        this.isCharging = true;
        this.chargeTimer = 0;
      }
      if (this.isCharging) {
        this.chargeTimer += deltaTime;
      }
      if (this.shootTimer >= this.shootInterval) {
        this.shootTimer = 0;
        this.isCharging = false;
        this.chargeTimer = 0;
        this.shootInterval = 3000 + Math.random() * 4000;
        this.game.projectiles.push(
          new Projectile(this.game, this.collisionX, this.collisionY),
        );
      }
    }
  }

  class Projectile {
    constructor(game, x, y) {
      this.game = game;
      this.collisionRadius = 14;
      const dx = this.game.player.collisionX - x;
      const dy = this.game.player.collisionY - y;
      const dist = Math.hypot(dx, dy) || 1;
      this.speed = 3 + Math.random() * 2;
      const startOffset = 55;
      this.collisionX = x + (dx / dist) * startOffset;
      this.collisionY = y + (dy / dist) * startOffset;
      this.speedX = (dx / dist) * this.speed;
      this.speedY = (dy / dist) * this.speed;
      this.markedForDeletion = false;
      this.trail = [];
    }

    draw(context) {
      // trail
      this.trail.forEach((point, i) => {
        const alpha = (i / this.trail.length) * 0.4;
        const radius = (i / this.trail.length) * this.collisionRadius * 0.8;
        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = "#88ff00";
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });

      // main ball
      const gradient = context.createRadialGradient(
        this.collisionX,
        this.collisionY,
        2,
        this.collisionX,
        this.collisionY,
        this.collisionRadius,
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.3, "#ffff00");
      gradient.addColorStop(0.7, "#88cc00");
      gradient.addColorStop(1, "rgba(0, 80, 0, 0)");
      context.save();
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }

    update() {
      this.trail.push({ x: this.collisionX, y: this.collisionY });
      if (this.trail.length > 8) this.trail.shift();

      this.collisionX += this.speedX;
      this.collisionY += this.speedY;

      if (
        this.collisionX < -60 ||
        this.collisionX > this.game.width + 60 ||
        this.collisionY < -60 ||
        this.collisionY > this.game.height + 60
      ) {
        this.markedForDeletion = true;
      }
    }
  }

  class Egg {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 40;
      this.margin = this.collisionRadius * 2;
      this.collisionX =
        this.margin + Math.random() * (this.game.width - this.margin * 2);
      this.collisionY =
        this.game.topMargin +
        Math.random() * (this.game.height - this.game.topMargin - this.margin);
      this.collisionRadius = 40;
      this.image = document.getElementById("egg");
      this.spriteWidth = 110;
      this.spriteHeight = 135;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.spriteX;
      this.spriteY;
    }
    draw(context) {
      context.drawImage(this.image, this.spriteX, this.spriteY);
      if (this.game.debug) {
        context.beginPath();
        context.arc(
          this.collisionX,
          this.collisionY,
          this.collisionRadius,
          0,
          Math.PI * 2,
        );
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();
      }
    }
    update() {
      this.spriteX = this.collisionX - this.width * 0.5;
      this.spriteY = this.collisionY - this.height * 0.5 - 30;
      let collisionObjects = [this.game.player, ...this.game.obstacles];
      collisionObjects.forEach((object) => {
        let [collision, distance, sumOfRadii, dx, dy] =
          this.game.checkCollision(this, object);
        if (collision) {
          const unit_x = dx / distance;
          const unit_y = dy / distance;
          this.collisionX = object.collisionX + (sumOfRadii + 1) * unit_x;
          this.collisionY = object.collisionY + (sumOfRadii + 1) * unit_y;
        }
      });
    }
  }

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.topMargin = 260;
      this.debug = false;
      this.player = new Player(this);
      this.fps = 70;
      this.timer = 0;
      this.interval = 1000 / this.fps;
      this.eggTimer = 0;
      this.eggInterval = 1000;
      this.numberOfObstacles = 10;
      this.maxEggs = 20;
      this.obstacles = [];
      this.eggs = [];
      this.projectiles = [];
      this.gameObjects = [];
      this.score = 0;
      this.gameOver = false;
      this.mouse = {
        x: this.width * 0.5,
        y: this.height * 0.5,
        pressed: false,
      };

      canvas.addEventListener("mousedown", (e) => {
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.pressed = true;
      });
      canvas.addEventListener("mouseup", (e) => {
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.pressed = false;
      });
      canvas.addEventListener("mousemove", (e) => {
        if (this.mouse.pressed) {
          this.mouse.x = e.offsetX;
          this.mouse.y = e.offsetY;
        }
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "d") this.debug = !this.debug;
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          if (this.gameOver) {
            this.restart();
          } else {
            this.player.jump();
          }
        }
        if (e.key === "f" || e.key === "F") {
          if (!this.gameOver) this.player.activateShield();
        }
      });
      canvas.addEventListener("click", () => {
        if (this.gameOver) this.restart();
      });
    }

    restart() {
      this.score = 0;
      this.gameOver = false;
      this.projectiles = [];
      this.eggs = [];
      this.player = new Player(this);
      document.getElementById("score").textContent = "Score: 0";
    }

    render(context, deltaTime) {
      if (this.gameOver) {
        this.drawGameOver(context);
        return;
      }

      if (this.timer > this.interval) {
        context.clearRect(0, 0, this.width, this.height);

        this.player.update(deltaTime);

        this.gameObjects = [this.player, ...this.eggs, ...this.obstacles];
        this.gameObjects.sort((a, b) => a.collisionY - b.collisionY);
        this.gameObjects.forEach((object) => {
          object.draw(context);
          if (object !== this.player) object.update(deltaTime);
        });

        // projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
          const p = this.projectiles[i];
          p.update();
          p.draw(context);

          if (p.markedForDeletion) {
            this.projectiles.splice(i, 1);
            continue;
          }

          const shieldHitRadius = this.player.shieldActive
            ? this.player.shieldRadius
            : this.player.collisionRadius;

          const dx = p.collisionX - this.player.collisionX;
          const dy = p.collisionY - this.player.collisionY;
          const dist = Math.hypot(dx, dy);

          if (dist < p.collisionRadius + shieldHitRadius) {
            this.projectiles.splice(i, 1);
            if (!this.player.shieldActive && this.player.hitCooldown <= 0) {
              this.player.lives--;
              this.player.hitCooldown = this.player.hitCooldownMax;
              if (this.player.lives <= 0) {
                this.player.lives = 0;
                this.gameOver = true;
              }
            }
          }
        }

        this.drawUI(context);
        this.timer = 0;
      }
      this.timer += deltaTime;

      if (this.eggTimer > this.eggInterval && this.eggs.length < this.maxEggs) {
        this.addEgg();
        this.eggTimer = 0;
      } else {
        this.eggTimer += deltaTime;
      }
    }

    drawUI(context) {
      // hearts (top right)
      const heartX = this.width - 50;
      const heartY = 60;
      context.font = "bold 36px Arial";
      context.textAlign = "right";
      for (let i = 0; i < this.player.maxLives; i++) {
        context.fillStyle = i < this.player.lives ? "#ff1144" : "#333";
        context.fillText("♥", heartX - i * 44, heartY);
      }
      context.textAlign = "left";

      // shield bar
      const barX = this.width - 180;
      const barY = 80;
      const barW = 160;
      const barH = 14;

      context.font = "14px Arial";

      if (this.player.shieldActive) {
        const remaining =
          1 - this.player.shieldTimer / this.player.shieldDuration;
        context.fillStyle = "rgba(0,0,0,0.5)";
        context.fillRect(barX, barY, barW, barH);
        context.fillStyle = "#00ffff";
        context.fillRect(barX, barY, barW * remaining, barH);
        context.strokeStyle = "#00ffff";
        context.lineWidth = 2;
        context.strokeRect(barX, barY, barW, barH);
        context.fillStyle = "#00ffff";
        context.fillText("TARCZA aktywna [F]", barX, barY - 4);
      } else if (!this.player.shieldReady) {
        const progress =
          this.player.shieldCooldownTimer / this.player.shieldCooldown;
        context.fillStyle = "rgba(0,0,0,0.5)";
        context.fillRect(barX, barY, barW, barH);
        context.fillStyle = "#556677";
        context.fillRect(barX, barY, barW * progress, barH);
        context.strokeStyle = "#556677";
        context.lineWidth = 2;
        context.strokeRect(barX, barY, barW, barH);
        context.fillStyle = "#889aaa";
        context.fillText("TARCZA ładowanie... [F]", barX, barY - 4);
      } else {
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
        context.fillStyle = "rgba(0,0,0,0.5)";
        context.fillRect(barX, barY, barW, barH);
        context.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        context.fillRect(barX, barY, barW, barH);
        context.strokeStyle = "#00ffff";
        context.lineWidth = 2;
        context.strokeRect(barX, barY, barW, barH);
        context.fillStyle = "#00ffff";
        context.fillText("TARCZA gotowa! [F]", barX, barY - 4);
      }
    }

    drawGameOver(context) {
      context.clearRect(0, 0, this.width, this.height);
      context.save();
      context.fillStyle = "rgba(0, 0, 0, 0.75)";
      context.fillRect(0, 0, this.width, this.height);

      context.textAlign = "center";
      context.fillStyle = "#ff1144";
      context.font = "bold 80px Arial";
      context.fillText("KONIEC GRY", this.width * 0.5, this.height * 0.4);

      context.fillStyle = "#ffffff";
      context.font = "bold 40px Arial";
      context.fillText(
        "Wynik: " + this.score,
        this.width * 0.5,
        this.height * 0.5,
      );

      context.fillStyle = "#ffdd00";
      context.font = "28px Arial";
      context.fillText(
        "Kliknij lub naciśnij SPACJĘ aby zagrać ponownie",
        this.width * 0.5,
        this.height * 0.62,
      );

      context.textAlign = "left";
      context.restore();
    }

    checkCollision(a, b) {
      const dx = a.collisionX - b.collisionX;
      const dy = a.collisionY - b.collisionY;
      const distance = Math.hypot(dy, dx);
      const sumOfRadii = a.collisionRadius + b.collisionRadius;
      return [distance < sumOfRadii, distance, sumOfRadii, dx, dy];
    }

    addEgg() {
      this.eggs.push(new Egg(this));
    }

    init() {
      let attempts = 0;
      while (this.obstacles.length < this.numberOfObstacles && attempts < 500) {
        let testObstacle = new Obstacle(this);
        let overlap = false;
        this.obstacles.forEach((obstacle) => {
          const dx = testObstacle.collisionX - obstacle.collisionX;
          const dy = testObstacle.collisionY - obstacle.collisionY;
          const distance = Math.hypot(dy, dx);
          const distanceBuffer = 150;
          const sumOfRadii =
            testObstacle.collisionRadius +
            obstacle.collisionRadius +
            distanceBuffer;
          if (distance < sumOfRadii) overlap = true;
        });
        const margin = testObstacle.collisionRadius * 3;
        if (
          !overlap &&
          testObstacle.spriteX > 0 &&
          testObstacle.spriteX < this.width - testObstacle.width &&
          testObstacle.collisionY > this.topMargin + margin &&
          testObstacle.collisionY < this.height - margin
        ) {
          this.obstacles.push(testObstacle);
        }
        attempts++;
      }
    }
  }

  const game = new Game(canvas);
  game.init();

  document.getElementById("score").textContent = "Score: 0";

  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    game.render(ctx, deltaTime);
    window.requestAnimationFrame(animate);
  }
  animate(0);
});
