import { Player } from "./Player.js";
import { Obstacle } from "./Obstacle.js";
import { Egg } from "./Egg.js";
import { Larva } from "./Larva.js";

export class Game {
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
    this.larvae = [];
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
    this.larvae = [];
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

      this.gameObjects = [
        this.player,
        ...this.eggs,
        ...this.obstacles,
        ...this.larvae,
      ];
      this.gameObjects.sort((a, b) => a.collisionY - b.collisionY);
      this.gameObjects.forEach((object) => {
        object.draw(context);
        if (object !== this.player) object.update(deltaTime);
      });

      // egg hatching
      for (let i = this.eggs.length - 1; i >= 0; i--) {
        if (this.eggs[i].markedForHatch) {
          this.larvae.push(
            new Larva(this, this.eggs[i].collisionX, this.eggs[i].collisionY),
          );
          this.eggs.splice(i, 1);
        }
      }
      this.larvae = this.larvae.filter((l) => !l.markedForDeletion);

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
    context.fillText("Wynik: " + this.score, this.width * 0.5, this.height * 0.5);

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
