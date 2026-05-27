export class Player {
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
