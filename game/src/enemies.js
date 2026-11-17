// Enemies for Lumenhold: the shadow creatures crawling the garden path.
// Each enemy walks the waypoints, can be slowed, and draws itself as a
// glowing moth-like creature with a health bar.

import { ENEMY_TYPES, enemyHealthScale } from './config.js';

let NEXT_ID = 1;

export class Enemy {
  constructor(typeKey, wave, waypoints) {
    const def = ENEMY_TYPES[typeKey];
    this.id = NEXT_ID;
    NEXT_ID += 1;
    this.type = typeKey;
    this.def = def;
    this.maxHp = Math.round(def.health * enemyHealthScale(wave));
    this.hp = this.maxHp;
    this.speed = def.speed * (0.94 + Math.random() * 0.12);
    this.waypoints = waypoints;
    this.wp = 1;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.slowUntil = 0;
    this.slowFactor = 1;
    this.flashUntil = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.distanceWalked = 0;
    this.dead = false;
    this.reachedLantern = false;
    this.spawnTimer = 0;
    this.aliveTime = 0;
  }

  get radius() {
    return this.def.radius;
  }

  get reward() {
    return this.def.reward;
  }

  get slowed() {
    return this.slowUntil > this.aliveTime;
  }

  applyDamage(amount, now, slow = null) {
    this.hp -= amount;
    this.flashUntil = now + 0.08;
    if (slow) {
      this.slowUntil = Math.max(this.slowUntil, this.aliveTime + slow.seconds);
      this.slowFactor = Math.min(this.slowFactor, slow.factor);
      if (this.slowUntil <= this.aliveTime) this.slowFactor = 1;
    }
    if (this.hp <= 0) this.dead = true;
  }

  update(dt, game) {
    this.aliveTime += dt;
    if (this.slowUntil <= this.aliveTime) this.slowFactor = 1;
    if (this.def.regenPerSecond && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.def.regenPerSecond * dt);
    }
    const speed = this.speed * this.slowFactor;
    let remaining = speed * dt;
    while (remaining > 0 && this.wp < this.waypoints.length) {
      const target = this.waypoints[this.wp];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        this.x = target.x;
        this.y = target.y;
        this.distanceWalked += dist;
        remaining -= dist;
        this.wp += 1;
      } else {
        this.x += (dx / dist) * remaining;
        this.y += (dy / dist) * remaining;
        this.distanceWalked += remaining;
        remaining = 0;
      }
    }
    if (this.wp >= this.waypoints.length) this.reachedLantern = true;
    this.wobble += dt * 6;
    // The Queen sheds wisps as she lumbers along.
    if (this.def.boss) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= 4.5) {
        this.spawnTimer = 0;
        game.spawnMinion(this);
      }
    }
  }

  draw(ctx, now) {
    const bob = Math.sin(this.wobble) * 2;
    const y = this.y + bob;
    const flash = now < this.flashUntil;
    const flap = Math.sin(this.wobble * 1.7);
    ctx.save();
    ctx.translate(this.x, y);
    // Outer glow.
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 2.1);
    glow.addColorStop(0, flash ? 'rgba(255,255,255,0.55)' : this.hexA(this.def.color, 0.4));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 2.1, 0, Math.PI * 2);
    ctx.fill();
    // Wings.
    const wingSpread = 0.7 + Math.abs(flap) * 0.35;
    ctx.fillStyle = this.hexA(this.def.color, 0.85);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.beginPath();
      ctx.ellipse(this.radius * 0.75, -2, this.radius * 0.85 * wingSpread, this.radius * 0.55, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 0.55, this.radius * 0.78, 0, 0, Math.PI * 2);
    ctx.fillStyle = flash ? '#ffffff' : this.def.color;
    ctx.fill();
    // Core + eyes.
    ctx.beginPath();
    ctx.arc(0, -this.radius * 0.15, this.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = this.def.core;
    ctx.fill();
    ctx.fillStyle = '#10131f';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.16, -this.radius * 0.3, 2.2, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.16, -this.radius * 0.3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Slow tint.
    if (this.slowed) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(127, 212, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    // Health bar (bosses get a wider one).
    const w = this.def.boss ? 64 : 34;
    const h = this.def.boss ? 6 : 4;
    const frac = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(8, 10, 24, 0.8)';
    ctx.fillRect(this.x - w / 2, y - this.radius - 12, w, h);
    ctx.fillStyle = frac > 0.5 ? '#7fe8a8' : frac > 0.25 ? '#ffd76a' : '#ff6b6b';
    ctx.fillRect(this.x - w / 2, y - this.radius - 12, w * frac, h);
  }

  hexA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}

export function spawnEnemy(typeKey, wave, waypoints) {
  return new Enemy(typeKey, wave, waypoints);
}
