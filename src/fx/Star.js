export class Star {
  constructor(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = Math.random() * 1.5 + 0.5;
    this.angle = Math.random() * Math.PI;
    this.speed = 0.01 + Math.random() * 0.02;
  }
  draw(ctx) {
    this.angle += this.speed;
    ctx.save();
    ctx.globalAlpha = Math.abs(Math.sin(this.angle)) * 0.7 + 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  }
}
