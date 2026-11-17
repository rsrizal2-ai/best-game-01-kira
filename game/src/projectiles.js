// Projectiles for Lumenhold: homing ember and frost bolts, and arcing
// star shells that burst over an area when they land.

export class Projectile {
  constructor({ kind, x, y, target, targetX, targetY, speed, damage, splashRadius = 0, slow = null, color }) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.target = target ?? null;
    this.targetX = targetX ?? 0;
    this.targetY = targetY ?? 0;
    this.speed = speed;
    this.damage = damage;
    this.splashRadius = splashRadius;
    this.slow = slow;
    this.color = color;
    this.dead = false;
    this.trail = [];
    this.flightTime = 0;
    this.flightTotal = 0;
    if (kind === 'shell') {
      const dist = Math.hypot(this.targetX - x, this.targetY - y);
      this.flightTotal = Math.max(0.35, dist / speed);
    }
  }

  update(dt, game) {
    this.flightTime += dt;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 7) this.trail.shift();
    if (this.kind === 'shell') {
      const t = Math.min(1, this.flightTime / this.flightTotal);
      this.x = this.startX + (this.targetX - this.startX) * t;
      this.y = this.startY + (this.targetY - this.startY) * t;
      if (t >= 1) {
        this.dead = true;
        game.explodeShell(this);
      }
      return;
    }
    // Homing bolt: re-aim at the living target, or fly on and fizzle.
    if (this.target && !this.target.dead && !this.target.reachedLantern) {
      this.targetX = this.target.x;
      this.targetY = this.target.y;
    }
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step + 6) {
      this.dead = true;
      if (this.target && !this.target.dead && !this.target.reachedLantern) {
        game.hitEnemy(this.target, this.damage, this.slow, this.x, this.y);
      } else {
        game.particles.burst(this.x, this.y, { color: this.color, count: 5, speed: 60, life: 0.3, size: 2 });
      }
      return;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  draw(ctx) {
    ctx.save();
    for (let i = 0; i < this.trail.length; i += 1) {
      const p = this.trail[i];
      ctx.globalAlpha = (i / this.trail.length) * 0.35;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    let drawY = this.y;
    let scale = 1;
    if (this.kind === 'shell') {
      const t = Math.min(1, this.flightTime / Math.max(0.01, this.flightTotal));
      const arc = Math.sin(t * Math.PI) * 46;
      drawY = this.y - arc;
      scale = 1 + Math.sin(t * Math.PI) * 0.4;
      // Landing marker so the burst never feels random.
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(this.targetX, this.targetY, 10, 5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const glow = ctx.createRadialGradient(this.x, drawY, 1, this.x, drawY, 12 * scale);
    glow.addColorStop(0, 'rgba(255,255,255,0.9)');
    glow.addColorStop(0.35, this.color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, drawY, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, drawY, 3.2 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
