// The command panel for Lumenhold: lantern health, glowpetals, score,
// wave controls, build cards, the selected lantern's upgrade panel, and
// the message line. Drawn on the right 320 px of the screen.

import { FINAL_WAVE, MAX_TURRET_LEVEL, PANEL_W, PANEL_X, TURRET_ORDER, TURRET_TYPES, waveClearBonus } from './config.js';
import { button, formatTime, panel, rr, text, wrapText } from './draw.js';
import { turretStats, turretUpgradeCost } from './turrets.js';
import { wavePreview } from './waves.js';

const PX = PANEL_X + 14;
const PW = PANEL_W - 28;

export function drawPanel(ctx, game) {
  ctx.save();
  ctx.fillStyle = '#131a2e';
  ctx.fillRect(PANEL_X, 0, PANEL_W, 720);
  ctx.fillStyle = '#0d1322';
  ctx.fillRect(PANEL_X, 0, 3, 720);
  ctx.strokeStyle = '#2c3a5e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PANEL_X + 1.5, 0);
  ctx.lineTo(PANEL_X + 1.5, 720);
  ctx.stroke();

  text(ctx, 'LUMENHOLD', PANEL_X + PANEL_W / 2, 30, { font: '26px "Trebuchet MS", Verdana, sans-serif', color: '#ffe9a8', align: 'center', weight: '700' });
  text(ctx, 'Siege of the Last Lantern', PANEL_X + PANEL_W / 2, 50, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', align: 'center' });

  drawStats(ctx, game, 62);
  drawWaveControls(ctx, game, 158);
  drawBuildCards(ctx, game, 268);
  if (game.selectedTurret) drawSelected(ctx, game, 546);
  else drawTips(ctx, game, 546);
  drawFooter(ctx, game, 640);
  ctx.restore();
}

function drawStats(ctx, game, y) {
  panel(ctx, PX, y, PW, 88, { fill: '#0d1322', radius: 10 });
  // Lantern health bar.
  text(ctx, 'LANTERN', PX + 12, y + 22, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', weight: '700' });
  const barX = PX + 84;
  const barW = PW - 96 - 44;
  rr(ctx, barX, y + 10, barW, 14, 7);
  ctx.fillStyle = '#232c44';
  ctx.fill();
  const frac = Math.max(0, game.lives / game.maxLives);
  if (frac > 0) {
    rr(ctx, barX, y + 10, Math.max(14, barW * frac), 14, 7);
    ctx.fillStyle = frac > 0.5 ? '#ffd76a' : frac > 0.25 ? '#ff9d5c' : '#ff6b6b';
    ctx.fill();
  }
  text(ctx, `${game.lives}/${game.maxLives}`, PX + PW - 12, y + 22, { font: '13px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', align: 'right', weight: '700' });
  // Gold / score / wave row.
  statCell(ctx, PX + 12, y + 40, 'GLOWPETALS', `${game.gold}`, '#ffd76a');
  statCell(ctx, PX + 112, y + 40, 'SCORE', `${game.score}`, '#eef1ff');
  statCell(ctx, PX + 206, y + 40, 'WAVE', `${Math.max(1, game.wave)}/${FINAL_WAVE}`, '#7fd4ff');
}

function statCell(ctx, x, y, label, value, color) {
  text(ctx, label, x, y + 12, { font: '10px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', weight: '700' });
  text(ctx, value, x, y + 32, { font: '19px "Trebuchet MS", Verdana, sans-serif', color, weight: '700' });
}

function drawWaveControls(ctx, game, y) {
  const ended = game.state === 'victory' || game.state === 'defeat';
  const interactive = game.state === 'playing' || game.state === 'paused';
  if (ended) {
    panel(ctx, PX, y, PW, 46, { fill: '#1d2742', radius: 9 });
    text(ctx, game.state === 'victory' ? 'Dawn reached — the vigil is won' : 'The vigil has ended', PX + PW / 2, y + 28, { font: '14px "Trebuchet MS", Verdana, sans-serif', color: game.state === 'victory' ? '#7fe8a8' : '#ff9d9d', align: 'center', weight: '700' });
  } else if (game.waveActive) {
    const remaining = game.spawnQueue.length + game.enemies.length;
    panel(ctx, PX, y, PW, 46, { fill: '#1d2742', radius: 9 });
    text(ctx, `Wave ${game.wave} — ${remaining} moth${remaining === 1 ? '' : 's'} left`, PX + PW / 2, y + 28, { font: '15px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', align: 'center', weight: '700' });
  } else if (game.wave >= FINAL_WAVE) {
    panel(ctx, PX, y, PW, 46, { fill: '#1d2742', radius: 9 });
    text(ctx, 'All waves faced', PX + PW / 2, y + 28, { font: '15px "Trebuchet MS", Verdana, sans-serif', color: '#7fe8a8', align: 'center', weight: '700' });
  } else {
    const next = game.wave + 1;
    const sub = fitSub(ctx, `Clear bonus +${waveClearBonus(next)} · ${wavePreview(next)}`, PW - 20);
    button(game, ctx, 'start-wave', PX, y, PW, 46, next === FINAL_WAVE ? 'START FINAL WAVE' : `START WAVE ${next}`, { accent: true, fontSize: 16, sub });
  }
  const bw = (PW - 18) / 4;
  button(game, ctx, 'speed', PX, y + 54, bw, 34, game.speed === 2 ? '2×' : '1×', { fontSize: 14, disabled: !interactive });
  button(game, ctx, 'pause', PX + bw + 6, y + 54, bw, 34, game.state === 'paused' ? 'Resume' : 'Pause', { fontSize: 13, disabled: !interactive });
  button(game, ctx, 'mute', PX + 2 * (bw + 6), y + 54, bw, 34, game.sound.muted ? 'Muted' : 'Sound', { fontSize: 13 });
  button(game, ctx, 'help', PX + 3 * (bw + 6), y + 54, bw, 34, 'Help', { fontSize: 13 });
}

function fitSub(ctx, str, maxWidth) {
  ctx.save();
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  if (ctx.measureText(str).width <= maxWidth) {
    ctx.restore();
    return str;
  }
  let cut = str;
  while (cut.length > 4 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  ctx.restore();
  return `${cut}…`;
}

function drawBuildCards(ctx, game, y) {
  text(ctx, 'BUILD LANTERNS  ·  click a card, then a free plot', PX, y + 14, { font: '11px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', weight: '700' });
  let cy = y + 22;
  for (const key of TURRET_ORDER) {
    const def = TURRET_TYPES[key];
    const affordable = game.gold >= def.cost;
    const selected = game.selectedBuild === key;
    const hovered = game.hover.x >= PX && game.hover.x <= PX + PW && game.hover.y >= cy && game.hover.y <= cy + 78;
    game.ui.push({ id: `build-${key}`, x: PX, y: cy, w: PW, h: 78, disabled: false });
    ctx.save();
    rr(ctx, PX, cy, PW, 78, 10);
    ctx.fillStyle = selected ? '#2a3554' : hovered ? '#1d2742' : '#161e33';
    ctx.fill();
    ctx.strokeStyle = selected ? def.color : '#2c3a5e';
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.stroke();
    // Colour chip.
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(PX + 24, cy + 26, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbe8';
    ctx.beginPath();
    ctx.arc(PX + 24, cy + 26, 4.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `[${def.hotkey}]`, PX + 24, cy + 58, { font: '11px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', align: 'center' });
    text(ctx, def.name, PX + 46, cy + 22, { font: '15px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', weight: '700' });
    text(ctx, `${def.cost} petals`, PX + PW - 12, cy + 22, { font: '14px "Trebuchet MS", Verdana, sans-serif', color: affordable ? '#ffd76a' : '#ff6b6b', align: 'right', weight: '700' });
    const stats = turretStats(key, 1);
    text(ctx, `DMG ${stats.damage} · RNG ${stats.range} · ${def.splashRadius ? `SPLASH ${stats.splashRadius}` : def.slowFactor ? 'SLOWS 45%' : 'FAST'}`, PX + 46, cy + 42, { font: '11px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7' });
    ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
    const lines = wrapText(ctx, def.blurb, PW - 58);
    text(ctx, lines[0] ?? '', PX + 46, cy + 60, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#c3cbdf' });
    if (lines[1]) text(ctx, lines[1], PX + 46, cy + 73, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#c3cbdf' });
    ctx.restore();
    cy += 86;
  }
}

function drawSelected(ctx, game, y) {
  const t = game.selectedTurret;
  const stats = t.stats;
  panel(ctx, PX, y, PW, 92, { fill: '#1a2340', radius: 10 });
  text(ctx, `${t.def.name} · Lv ${t.level}`, PX + 12, y + 21, { font: '14px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', weight: '700' });
  text(ctx, `DMG ${stats.damage} · RNG ${stats.range} · ${stats.fireInterval.toFixed(2)}s`, PX + 12, y + 40, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7' });
  if (t.level < MAX_TURRET_LEVEL) {
    const cost = turretUpgradeCost(t.type, t.level);
    button(game, ctx, 'upgrade', PX + 12, y + 50, 150, 32, `Kindle · ${cost}`, { fontSize: 13, accent: game.gold >= cost, disabled: game.gold < cost });
  } else {
    text(ctx, 'Fully kindled', PX + 12, y + 71, { font: '13px "Trebuchet MS", Verdana, sans-serif', color: '#7fe8a8', weight: '700' });
  }
  button(game, ctx, 'sell', PX + PW - 112, y + 50, 100, 32, `Sell · ${t.sellValue}`, { fontSize: 13 });
}

function drawTips(ctx, game, y) {
  panel(ctx, PX, y, PW, 92, { fill: '#0d1322', radius: 10 });
  text(ctx, 'HOW TO HOLD THE LIGHT', PX + 12, y + 20, { font: '11px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', weight: '700' });
  text(ctx, '· Click a card, then a free plot to build.', PX + 12, y + 40, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#c3cbdf' });
  text(ctx, '· Click a lantern to kindle or sell it.', PX + 12, y + 58, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#c3cbdf' });
  text(ctx, '· Frost slows · Mortars burst crowds.', PX + 12, y + 76, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#c3cbdf' });
  void game;
}

function drawFooter(ctx, game, y) {
  const showing = game.now < game.messageUntil && game.message;
  ctx.save();
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  const lines = showing ? wrapText(ctx, game.message, PW) : [];
  lines.slice(0, 2).forEach((line, i) => {
    text(ctx, line, PX, y + 16 + i * 17, { font: '13px "Trebuchet MS", Verdana, sans-serif', color: '#ffe9a8' });
  });
  text(ctx, `Time ${formatTime(game.elapsed)}  ·  Kills ${game.kills}  ·  1/2/3 build · Space wave · P pause`, PX, y + 54, { font: '11px "Trebuchet MS", Verdana, sans-serif', color: '#6b7694' });
  if (game.best) {
    text(ctx, `Best: ${game.best.score} pts · ${game.best.wavesCleared}/12 waves`, PX, y + 68, { font: '11px "Trebuchet MS", Verdana, sans-serif', color: '#6b7694' });
  }
  ctx.restore();
}
