export class Projectile {
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
