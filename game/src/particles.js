// Particles and floating text for Lumenhold: bursts, rings, drifting
// embers and the little "+8" popups that make every kill feel paid.

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
  }

  clear() {
    this.particles = [];
    this.texts = [];
  }

  burst(x, y, { color = '#ffd76a', count = 14, speed = 120, life = 0.55, size = 3, gravity = 60 } = {}) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.9);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 20,
        life: life * (0.6 + Math.random() * 0.7),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
        gravity,
        drag: 2.2,
        kind: 'dot',
      });
    }
  }

  ring(x, y, { color = '#ffe9a8', maxRadius = 60, life = 0.4, width = 3 } = {}) {
    this.particles.push({ x, y, vx: 0, vy: 0, life, maxLife: life, size: width, color, gravity: 0, drag: 0, kind: 'ring', maxRadius });
  }

  ember(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10, y,
      vx: (Math.random() - 0.5) * 14, vy: -26 - Math.random() * 22,
      life: 0.9 + Math.random() * 0.6, maxLife: 1.4,
      size: 1.6 + Math.random() * 1.6, color: '#ffb347', gravity: -8, drag: 0.4, kind: 'dot',
    });
  }

  floatText(x, y, text, { color = '#ffd76a', size = 16 } = {}) {
    this.texts.push({ x, y, text, color, size, life: 1.0, maxLife: 1.0 });
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      const drag = 1 - Math.min(0.9, p.drag * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 34 * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      if (p.kind === 'ring') {
        const progress = 1 - a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.maxRadius * progress, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * a + 0.5;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      const a = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = Math.min(1, a * 2);
      ctx.font = `700 ${t.size}px "Trebuchet MS", Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(10, 12, 30, 0.85)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
