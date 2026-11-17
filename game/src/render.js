// Scene rendering for Lumenhold: the night garden, the winding path, the
// Last Lantern, and every entity drawn in the right order. Pure drawing:
// nothing here changes game state.

import { BOARD_W, CELL, LANTERN_CELL, PALETTE, VIEW_H } from './config.js';
import { buildWaypoints, cellCenter, isPathCell } from './path.js';
import { Rng } from './random.js';

const WAYPOINTS = buildWaypoints();

// Cobblestones along the path, placed once from a fixed seed.
const COBBLES = (() => {
  const rng = new Rng(77);
  const stones = [];
  for (let i = 0; i < WAYPOINTS.length - 1; i += 1) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.floor(len / 26);
    for (let j = 0; j < n; j += 1) {
      const t = (j + 0.5) / n;
      stones.push({
        x: a.x + (b.x - a.x) * t + rng.range(-14, 14),
        y: a.y + (b.y - a.y) * t + rng.range(-14, 14),
        r: rng.range(2.5, 5),
      });
    }
  }
  return stones;
})();

export function drawScene(ctx, game) {
  const now = game.now;
  const deco = game.decorations;
  ctx.save();
  if (game.shakeTime > 0) {
    const mag = game.shakeMag * (game.shakeTime / 0.35);
    ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
  }
  drawSky(ctx, deco, now);
  drawGround(ctx, deco, now);
  drawPath(ctx);
  drawFireflies(ctx, deco, now);
  drawLantern(ctx, game, now);
  drawPlacementPreview(ctx, game);
  const enemies = game.state === 'title' || game.state === 'help' ? game.demoEnemies : game.enemies;
  const sorted = [...enemies].sort((a, b) => a.y - b.y);
  for (const turret of game.turrets) turret.draw(ctx, now);
  for (const enemy of sorted) enemy.draw(ctx, now);
  for (const projectile of game.projectiles) projectile.draw(ctx);
  game.particles.draw(ctx);
  drawVignette(ctx);
  ctx.restore();
}

function drawSky(ctx, deco, now) {
  const sky = ctx.createLinearGradient(0, 0, 0, 120);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, BOARD_W, 120);
  for (const star of deco.stars) {
    const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(now * star.speed + star.twinkle));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#dfe6ff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Moon with a soft halo, top-right of the board.
  const mx = 830;
  const my = 40;
  const halo = ctx.createRadialGradient(mx, my, 8, mx, my, 78);
  halo.addColorStop(0, 'rgba(240, 240, 255, 0.5)');
  halo.addColorStop(1, 'rgba(240, 240, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(mx, my, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2f0e4';
  ctx.beginPath();
  ctx.arc(mx, my, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ddd8c4';
  ctx.beginPath();
  ctx.arc(mx - 8, my - 5, 6, 0, Math.PI * 2);
  ctx.arc(mx + 10, my + 8, 4, 0, Math.PI * 2);
  ctx.arc(mx + 5, my - 11, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx, deco, now) {
  const ground = ctx.createLinearGradient(0, 64, 0, VIEW_H);
  ground.addColorStop(0, '#1a2b20');
  ground.addColorStop(1, PALETTE.groundB);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 64, BOARD_W, VIEW_H - 64);
  // Distant hills along the horizon.
  ctx.fillStyle = '#141c33';
  ctx.beginPath();
  ctx.moveTo(0, 170);
  ctx.quadraticCurveTo(220, 100, 470, 160);
  ctx.quadraticCurveTo(680, 112, BOARD_W, 165);
  ctx.lineTo(BOARD_W, 210);
  ctx.lineTo(0, 210);
  ctx.closePath();
  ctx.fill();
  for (const pebble of deco.pebbles) {
    ctx.fillStyle = '#3a4152';
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, pebble.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#2e4a33';
  ctx.lineWidth = 2;
  for (const tuft of deco.tufts) {
    ctx.beginPath();
    ctx.moveTo(tuft.x, tuft.y);
    ctx.quadraticCurveTo(tuft.x + tuft.lean * 8, tuft.y - tuft.h * 0.6, tuft.x + tuft.lean * 12, tuft.y - tuft.h);
    ctx.moveTo(tuft.x + 5, tuft.y);
    ctx.quadraticCurveTo(tuft.x + 5, tuft.y - tuft.h * 0.7, tuft.x + 8, tuft.y - tuft.h * 0.9);
    ctx.stroke();
  }
  for (const flower of deco.flowers) {
    const glow = 0.6 + 0.4 * Math.sin(now * 1.4 + flower.phase);
    ctx.fillStyle = `hsla(${flower.hue}, 80%, 72%, ${glow})`;
    for (let p = 0; p < 5; p += 1) {
      const a = (p / 5) * Math.PI * 2 + flower.phase;
      ctx.beginPath();
      ctx.arc(flower.x + Math.cos(a) * 4, flower.y + Math.sin(a) * 4, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(flower.x, flower.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPath(ctx) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
  for (let i = 1; i < WAYPOINTS.length; i += 1) ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
  ctx.strokeStyle = PALETTE.pathEdge;
  ctx.lineWidth = 52;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.pathStone;
  ctx.lineWidth = 44;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  for (const stone of COBBLES) {
    ctx.beginPath();
    ctx.arc(stone.x, stone.y, stone.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Faint direction chevrons so the route reads at a glance.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  for (let i = 1; i < WAYPOINTS.length - 1; i += 1) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -7);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawFireflies(ctx, deco, now) {
  for (const fly of deco.fireflies) {
    const x = fly.x + Math.sin(now * fly.speed + fly.phase) * fly.a;
    const y = fly.y + Math.cos(now * fly.speed * 0.8 + fly.phase) * fly.b;
    const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(now * 2.2 + fly.phase * 3));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLantern(ctx, game, now) {
  const center = cellCenter(LANTERN_CELL[0], LANTERN_CELL[1]);
  const healthFrac = game.maxLives ? game.lives / game.maxLives : 1;
  const flicker = 0.85 + Math.sin(now * 7.3) * 0.06 + Math.sin(now * 13.1) * 0.05;
  const glowStrength = 0.25 + 0.75 * healthFrac;
  const gx = center.x;
  const gy = center.y - 16;
  // Light pool on the ground.
  const pool = ctx.createRadialGradient(gx, center.y + 16, 4, gx, center.y + 16, 110 * glowStrength + 30);
  pool.addColorStop(0, `rgba(255, 233, 168, ${0.34 * glowStrength})`);
  pool.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(gx, center.y + 16, 140, 0, Math.PI * 2);
  ctx.fill();
  // Tower.
  ctx.fillStyle = '#3d3654';
  ctx.beginPath();
  ctx.moveTo(gx - 22, center.y + 30);
  ctx.lineTo(gx - 15, center.y - 34);
  ctx.lineTo(gx + 15, center.y - 34);
  ctx.lineTo(gx + 22, center.y + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#57507a';
  ctx.fillRect(gx - 18, center.y - 38, 36, 6);
  // Lamp housing and flame.
  ctx.fillStyle = '#241f38';
  ctx.fillRect(gx - 13, center.y - 62, 26, 26);
  const flame = ctx.createRadialGradient(gx, center.y - 49, 1, gx, center.y - 49, 26 * flicker);
  flame.addColorStop(0, `rgba(255, 250, 225, ${0.95 * glowStrength})`);
  flame.addColorStop(0.45, `rgba(255, 214, 106, ${0.7 * glowStrength})`);
  flame.addColorStop(1, 'rgba(255, 160, 60, 0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.arc(gx, center.y - 49, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffbe8';
  ctx.beginPath();
  ctx.ellipse(gx, center.y - 49, 6 * flicker, 9 * flicker, 0, 0, Math.PI * 2);
  ctx.fill();
  // Roof.
  ctx.fillStyle = '#2a2440';
  ctx.beginPath();
  ctx.moveTo(gx - 18, center.y - 62);
  ctx.lineTo(gx, center.y - 78);
  ctx.lineTo(gx + 18, center.y - 62);
  ctx.closePath();
  ctx.fill();
  // Rising embers, a pure function of time.
  for (let i = 0; i < 6; i += 1) {
    const t = ((now * 0.35 + i / 6) % 1);
    const ex = gx + Math.sin(now * 1.7 + i * 2.1) * 10 * t;
    const ey = center.y - 58 - t * 46;
    ctx.globalAlpha = (1 - t) * 0.8 * glowStrength;
    ctx.fillStyle = '#ffcf7a';
    ctx.beginPath();
    ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Health pips under the lantern.
  const pips = 10;
  for (let i = 0; i < pips; i += 1) {
    const on = (i + 0.5) / pips <= healthFrac;
    ctx.fillStyle = on ? '#ffd76a' : '#3a3452';
    ctx.beginPath();
    ctx.arc(gx - 27 + i * 6, center.y + 38, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlacementPreview(ctx, game) {
  if (game.state !== 'playing') return;
  const cell = game.hoverCell;
  // Selected turret's range ring.
  if (game.selectedTurret) {
    const t = game.selectedTurret;
    ctx.save();
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.stats.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 233, 168, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 233, 168, 0.5)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 2;
    ctx.strokeRect(t.col * CELL + 3, t.row * CELL + 3, CELL - 6, CELL - 6);
    ctx.restore();
  }
  if (!cell || !game.selectedBuild) return;
  const ok = game.canPlaceAt(cell.col, cell.row);
  const center = cellCenter(cell.col, cell.row);
  ctx.save();
  ctx.fillStyle = ok ? 'rgba(127, 232, 168, 0.18)' : 'rgba(255, 107, 107, 0.18)';
  ctx.fillRect(cell.col * CELL, cell.row * CELL, CELL, CELL);
  ctx.strokeStyle = ok ? '#7fe8a8' : '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.strokeRect(cell.col * CELL + 2, cell.row * CELL + 2, CELL - 4, CELL - 4);
  // Ghost of the turret-to-be plus its range.
  const def = game.selectedBuildDef;
  if (def) {
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(center.x, center.y, def.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(center.x, center.y - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(center.x, center.y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  void isPathCell;
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(BOARD_W / 2, VIEW_H / 2, VIEW_H * 0.42, BOARD_W / 2, VIEW_H / 2, VIEW_H * 0.85);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(4,6,18,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, BOARD_W, VIEW_H);
}
