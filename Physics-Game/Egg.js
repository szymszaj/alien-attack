export class Egg {
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
    this.hatchTimer = 0;
    this.hatchDuration = 8000;
    this.markedForHatch = false;
  }

  draw(context) {
    const hatchProgress = this.hatchTimer / this.hatchDuration;

    if (hatchProgress > 0.6) {
      const urgency = (hatchProgress - 0.6) / 0.4;
      const pulse =
        0.5 + 0.5 * Math.sin(Date.now() * (0.005 + urgency * 0.02));
      context.save();
      context.globalAlpha = urgency * 0.7 * pulse;
      const gradient = context.createRadialGradient(
        this.collisionX,
        this.collisionY,
        5,
        this.collisionX,
        this.collisionY,
        this.collisionRadius + 20,
      );
      gradient.addColorStop(0, "#ff4400");
      gradient.addColorStop(1, "rgba(255, 68, 0, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius + 20,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }

    context.drawImage(this.image, this.spriteX, this.spriteY);

    // countdown arc
    const arcEnd = -Math.PI * 0.5 + (1 - hatchProgress) * Math.PI * 2;
    context.save();
    context.strokeStyle =
      hatchProgress > 0.7
        ? "#ff2200"
        : hatchProgress > 0.4
          ? "#ffaa00"
          : "#00cc44";
    context.lineWidth = 4;
    context.globalAlpha = 0.85;
    context.beginPath();
    context.arc(
      this.collisionX,
      this.collisionY - 30,
      18,
      -Math.PI * 0.5,
      arcEnd,
    );
    context.stroke();
    context.restore();

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
    this.hatchTimer += deltaTime;
    if (this.hatchTimer >= this.hatchDuration) {
      this.markedForHatch = true;
    }

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
