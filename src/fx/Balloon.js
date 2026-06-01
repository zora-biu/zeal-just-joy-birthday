export class Balloon {
  constructor(w, h) {
    this.x = Math.random() * w;
    this.y = h + 80;

    this.r = 22 + Math.random() * 18;

    this.vy = -(0.8 + Math.random() * 1.2);

    this.seed = Math.random() * 1000;

    this.phase = Math.random() * Math.PI * 2;

    const palette = [
      "#ff4d6d",
      "#ff7aa2",
      "#a78bfa",
      "#7c83fd",
      "#60a5fa",
      "#38bdf8",
      "#fbbf24",
      "#34d399",
    ];

    this.color = palette[Math.floor(Math.random() * palette.length)];
  }

  update() {
    this.y += this.vy;
    this.x += Math.sin(this.y * 0.02 + this.seed) * 0.6;
    this.phase += 0.02;
  }

  draw(ctx) {
    ctx.save();

    const r = this.r;

    // ===== 1. 主体渐变（更像“塑料气球”）=====
    const g = ctx.createRadialGradient(
      this.x - r * 0.3,
      this.y - r * 0.4,
      r * 0.1,
      this.x,
      this.y,
      r,
    );

    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.2, this.hexToRgba(this.color, 0.85));
    g.addColorStop(1, this.hexToRgba(this.color, 0.25));

    // ===== 2. 阴影（弱一点更高级）=====
    ctx.shadowColor = this.hexToRgba(this.color, 0.25);
    ctx.shadowBlur = 25;

    // ===== 3. 气球主体 =====
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, r * 0.75, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // ===== 4. 顶部高光（关键：提升质感）=====
    ctx.beginPath();
    ctx.ellipse(
      this.x - r * 0.25,
      this.y - r * 0.35,
      r * 0.18,
      r * 0.35,
      -0.4,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();

    // ===== 5. 气球结 =====
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + r * 0.95);
    ctx.lineTo(this.x - 6, this.y + r + 6);
    ctx.lineTo(this.x + 6, this.y + r + 6);
    ctx.closePath();
    ctx.fillStyle = this.hexToRgba(this.color, 0.9);
    ctx.fill();

    // ===== 6. 绳子（更自然波动）=====
    const startX = this.x;
    const startY = this.y + r + 6;

    const sway = Math.sin(this.phase + this.seed) * 10;

    const endX = this.x + sway;
    const endY = startY + 45;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX - 10,
      startY + 15,
      endX + 10,
      startY + 30,
      endX,
      endY,
    );

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.restore();
  }

  hexToRgba(hex, a) {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
}
