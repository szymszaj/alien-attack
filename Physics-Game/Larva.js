export class Larva {
  constructor(game, x, y) {
    this.game = game;
    this.collisionX = x;
    this.collisionY = y;
    this.collisionRadius = 28;
    this.image = document.getElementById("larva");
    this.width = 75;
    this.height = 150;
    this.spriteX = x;
    this.spriteY = y;
    this.speed = 1.4 + Math.random() * 0.8;
    this.lifeTimer = 0;
    this.lifeDuration = 15000;
    this.markedForDeletion = false;
    this.spawnFlash = 600;
  }

  draw(context) {
    if (this.spawnFlash > 0) {
      const intensity = this.spawnFlash / 600;
      context.save();
      context.globalAlpha = intensity * 0.8;
      context.fillStyle = "#ff6600";
      context.beginPath();
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius + 20 * intensity,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }

    context.drawImage(
      this.image,
      this.spriteX,
      this.spriteY,
      this.width,
      this.height,
    );

    const lifeLeft = 1 - this.lifeTimer / this.lifeDuration;
    if (lifeLeft < 0.2) {
      context.save();
      context.globalAlpha = 1 - lifeLeft / 0.2;
      context.fillStyle = "rgba(0,0,0,0.7)";
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
    this.lifeTimer += deltaTime;
    if (this.spawnFlash > 0) this.spawnFlash -= deltaTime;
    if (this.lifeTimer >= this.lifeDuration) {
      this.markedForDeletion = true;
      return;
    }

    const dx = this.game.player.collisionX - this.collisionX;
    const dy = this.game.player.collisionY - this.collisionY;
    const dist = Math.hypot(dx, dy) || 1;
    this.collisionX += (dx / dist) * this.speed;
    this.collisionY += (dy / dist) * this.speed;

    if (this.collisionX < this.collisionRadius)
      this.collisionX = this.collisionRadius;
    else if (this.collisionX > this.game.width - this.collisionRadius)
      this.collisionX = this.game.width - this.collisionRadius;
    if (this.collisionY < this.game.topMargin + this.collisionRadius)
      this.collisionY = this.game.topMargin + this.collisionRadius;
    else if (this.collisionY > this.game.height - this.collisionRadius)
      this.collisionY = this.game.height - this.collisionRadius;

    this.game.obstacles.forEach((obstacle) => {
      let [collision, distance, sumOfRadii, odx, ody] =
        this.game.checkCollision(this, obstacle);
      if (collision) {
        const unit_x = odx / distance;
        const unit_y = ody / distance;
        this.collisionX = obstacle.collisionX + (sumOfRadii + 1) * unit_x;
        this.collisionY = obstacle.collisionY + (sumOfRadii + 1) * unit_y;
      }
    });

    this.spriteX = this.collisionX - this.width * 0.5;
    this.spriteY = this.collisionY - this.height * 0.5 - 20;

    const [playerCollision] = this.game.checkCollision(this, this.game.player);
    if (playerCollision) {
      if (this.game.player.shieldActive) {
        this.markedForDeletion = true;
      } else if (this.game.player.hitCooldown <= 0) {
        this.game.player.lives--;
        this.game.player.hitCooldown = this.game.player.hitCooldownMax;
        this.markedForDeletion = true;
        if (this.game.player.lives <= 0) {
          this.game.player.lives = 0;
          this.game.gameOver = true;
        }
      }
    }
  }
}
