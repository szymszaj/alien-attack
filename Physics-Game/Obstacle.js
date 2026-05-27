import { Projectile } from "./Projectile.js";

export class Obstacle {
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
