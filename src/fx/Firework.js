import { Vector } from "./Vector";

// =========================
// 爆炸粒子
// =========================
class Particle {
  constructor(x, y, hue, power = 1) {
    this.pos = new Vector(x, y);

    const angle = Math.random() * Math.PI * 2;

    // 爆炸力度（可调）
    const speed = (Math.random() * 10 + 3) * power;

    this.vel = new Vector(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.gravity = new Vector(0, 0.08);

    this.friction = 0.965 + Math.random() * 0.01;

    this.hue = hue;

    this.alpha = 1;

    this.decay = Math.random() * 0.008 + 0.004;

    this.size = Math.random() * 4 + 1;

    // 拖尾
    this.trail = [];

    this.blink = Math.random() > 0.7;
  }

  update() {
    // 记录轨迹
    this.trail.push({
      x: this.pos.x,
      y: this.pos.y,
    });

    if (this.trail.length > 6) {
      this.trail.shift();
    }

    this.vel.mult(this.friction);

    this.vel.add(this.gravity);

    this.pos.add(this.vel);

    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();

    // =========================
    // 拖尾
    // =========================
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];

      ctx.beginPath();

      ctx.globalAlpha = (i / this.trail.length) * this.alpha * 0.35;

      ctx.arc(p.x, p.y, this.size * (i / this.trail.length), 0, Math.PI * 2);

      ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;

      ctx.fill();
    }

    // =========================
    // 主粒子
    // =========================
    ctx.globalAlpha = this.alpha;

    ctx.beginPath();

    ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);

    const lightness = this.blink ? 70 + Math.random() * 20 : 70;

    ctx.fillStyle = `hsl(${this.hue}, 100%, ${lightness}%)`;

    ctx.shadowBlur = 20;

    ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;

    ctx.fill();

    ctx.restore();
  }
}

// =========================
// 主烟花类
// =========================
export class Firework {
  /**
   * @param {number} startX 起点X
   * @param {number} startY 起点Y
   * @param {number} targetX 爆炸目标X
   * @param {number} targetY 爆炸目标Y
   * @param {Object} options 配置
   *
   * options.power 爆炸范围倍率（默认1）
   * options.count 粒子数量（默认180）
   */
  constructor(startX, startY, targetX, targetY, options = {}) {
    this.pos = new Vector(startX, startY);

    this.targetY = targetY;

    this.hue = Math.random() * 360;

    this.exploded = false;

    this.particles = [];

    // =========================
    // 可配置参数
    // =========================
    this.power = options.power ?? 1;

    this.count = options.count ?? 180;

    // 中心闪光
    this.flash = 0;

    // =========================
    // 升空运动
    // =========================
    const distanceY = startY - targetY;

    const speedY = -Math.sqrt(2 * 0.15 * distanceY) * 0.9;

    const speedX = (targetX - startX) / 40;

    this.vel = new Vector(speedX, speedY);

    this.gravity = new Vector(0, 0.08);
  }

  update() {
    if (!this.exploded) {
      // 升空
      this.vel.add(this.gravity);

      this.pos.add(this.vel);

      // 到达顶点
      if (this.vel.y >= -0.5 || this.pos.y <= this.targetY) {
        this.exploded = true;

        this.explode();
      }
    } else {
      // 更新粒子
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update();

        if (this.particles[i].alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }
  }

  explode() {
    // 爆炸瞬间闪光
    this.flash = 1;

    // 生成粒子
    for (let i = 0; i < this.count; i++) {
      this.particles.push(
        new Particle(this.pos.x, this.pos.y, this.hue, this.power),
      );
    }
  }

  draw(ctx) {
    // =========================
    // 中心闪光
    // =========================
    if (this.flash > 0) {
      ctx.save();

      ctx.globalAlpha = this.flash;

      const glow = ctx.createRadialGradient(
        this.pos.x,
        this.pos.y,
        0,
        this.pos.x,
        this.pos.y,
        80 * this.power,
      );

      glow.addColorStop(0, `hsla(${this.hue},100%,70%,1)`);

      glow.addColorStop(1, `hsla(${this.hue},100%,70%,0)`);

      ctx.beginPath();

      ctx.arc(this.pos.x, this.pos.y, 80 * this.power, 0, Math.PI * 2);

      ctx.fillStyle = glow;

      ctx.fill();

      ctx.restore();

      this.flash *= 0.82;
    }

    // =========================
    // 升空阶段
    // =========================
    if (!this.exploded) {
      ctx.save();

      // 尾迹
      ctx.beginPath();

      ctx.moveTo(this.pos.x, this.pos.y + 18);

      ctx.lineTo(this.pos.x, this.pos.y);

      ctx.strokeStyle = `hsla(${this.hue},100%,70%,0.5)`;

      ctx.lineWidth = 2;

      ctx.stroke();

      // 火球
      ctx.beginPath();

      ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);

      ctx.fillStyle = "#ffffff";

      ctx.shadowBlur = 18;

      ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;

      ctx.fill();

      ctx.restore();
    } else {
      // 爆炸粒子
      this.particles.forEach((p) => p.draw(ctx));
    }
  }

  // 生命周期结束
  isDead() {
    return this.exploded && this.particles.length === 0;
  }
}
