// Turrets for Lumenhold: the garden lanterns that guard the path.
// A turret picks the enemy furthest along the path within range, aims,
// and fires through the game's projectile list.

import { MAX_TURRET_LEVEL, TURRET_TYPES, upgradeCost } from './config.js';
import { cellCenter } from './path.js';

export function turretStats(typeKey, level) {
  const def = TURRET_TYPES[typeKey];
  const steps = level - 1;
  return {
    damage: Math.round(def.damage * (1 + 0.55 * steps)),
    range: Math.round(def.range * (1 + 0.12 * steps)),
    fireInterval: def.fireInterval / (1 + 0.16 * steps),
    splashRadius: def.splashRadius ? Math.round(def.splashRadius * (1 + 0.1 * steps)) : 0,
    slowFactor: def.slowFactor ?? null,
    slowSeconds: def.slowSeconds ?? 0,
  };
}

export function turretUpgradeCost(typeKey, level) {
  if (level >= MAX_TURRET_LEVEL) return null;
  return upgradeCost(typeKey) + (level - 1) * Math.round(TURRET_TYPES[typeKey].cost * 0.35);
}

export class Turret {
  constructor(typeKey, col, row) {
    const center = cellCenter(col, row);
    this.type = typeKey;
    this.def = TURRET_TYPES[typeKey];
    this.col = col;
    this.row = row;
    this.x = center.x;
    this.y = center.y;
    this.level = 1;
    this.invested = this.def.cost;
    this.cooldown = 0;
    this.angle = -Math.PI / 2;
    this.recoil = 0;
    this.muzzleFlash = 0;
  }

  get stats() {
    return turretStats(this.type, this.level);
  }

  get sellValue() {
    return Math.floor(this.invested * 0.7);
  }

  acquireTarget(enemies) {
    const { range } = this.stats;
    const minRange = this.def.minRange ?? 0;
    let best = null;
    let bestWalked = -1;
    for (const enemy of enemies) {
      if (enemy.dead || enemy.reachedLantern) continue;
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist > range || dist < minRange) continue;
      if (enemy.distanceWalked > bestWalked) {
        best = enemy;
        bestWalked = enemy.distanceWalked;
      }
    }
    return best;
  }

  update(dt, game) {
    this.cooldown -= dt;
    this.recoil = Math.max(0, this.recoil - dt * 4);
    this.muzzleFlash = Math.max(0, this.muzzleFlash - dt);
    const target = this.acquireTarget(game.enemies);
    if (target) {
      const want = Math.atan2(target.y - this.y, target.x - this.x);
      let diff = want - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * Math.min(1, dt * 12);
      if (this.cooldown <= 0) {
        this.cooldown = this.stats.fireInterval;
        this.recoil = 1;
        this.muzzleFlash = 0.08;
        game.fireTurret(this, target);
      }
    }
  }

  draw(ctx, now) {
    const { range } = this.stats;
    void range;
    ctx.save();
    ctx.translate(this.x, this.y);
    // Stone base.
    ctx.beginPath();
    ctx.ellipse(0, 14, 26, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.fillStyle = '#3d3654';
    ctx.beginPath();
    ctx.moveTo(-20, 14);
    ctx.lineTo(-14, -6);
    ctx.lineTo(14, -6);
    ctx.lineTo(20, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#57507a';
    ctx.fillRect(-16, -8, 32, 4);
    // Rotating head, drawn per type.
    ctx.save();
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.translate(0, -this.recoil * 3);
    if (this.type === 'ember') {
      ctx.fillStyle = '#2a2440';
      ctx.fillRect(-9, -24, 18, 20);
      ctx.fillStyle = this.def.color;
      ctx.beginPath();
      ctx.arc(0, -14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.arc(0, -14, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'frost') {
      ctx.fillStyle = '#2a2440';
      ctx.fillRect(-4, -26, 8, 22);
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(-11, -12);
      ctx.lineTo(11, -12);
      ctx.closePath();
      ctx.fillStyle = this.def.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -10, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#eaf8ff';
      ctx.fill();
    } else {
      ctx.fillStyle = '#2a2440';
      ctx.fillRect(-7, -30, 14, 26);
      ctx.beginPath();
      ctx.arc(0, -30, 8, Math.PI, 0);
      ctx.fillStyle = this.def.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -30, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fffbe8';
      ctx.fill();
    }
    ctx.restore();
    // Glow halo + level pips.
    const pulse = 0.5 + Math.sin(now * 2.4 + this.x) * 0.12;
    const glow = ctx.createRadialGradient(0, -12, 2, 0, -12, 34);
    glow.addColorStop(0, this.hexA(this.def.glow, 0.35 * pulse + 0.15));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -12, 34, 0, Math.PI * 2);
    ctx.fill();
    if (this.muzzleFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(Math.cos(this.angle) * 26, Math.sin(this.angle) * 26 - 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < this.level; i += 1) {
      ctx.beginPath();
      ctx.arc(-10 + i * 10, 19, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.def.color;
      ctx.fill();
    }
    ctx.restore();
  }

  hexA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
