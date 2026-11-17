// Full-screen overlays for Lumenhold: the title screen, the help scroll,
// the pause veil, and the victory and defeat results. Each registers its
// buttons in game.ui so input.js can answer clicks.

import { BOARD_W, FINAL_WAVE, VIEW_H, VIEW_W } from './config.js';
import { button, formatTime, panel, rr, text, wrapText } from './draw.js';

function dimBoard(ctx, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(5, 8, 20, ${alpha})`;
  ctx.fillRect(0, 0, BOARD_W, VIEW_H);
  ctx.restore();
}

function glowTitle(ctx, str, x, y, size, color) {
  ctx.save();
  ctx.font = `700 ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 26;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fffdf4';
  ctx.fillText(str, x, y);
  ctx.restore();
}

function drawTitleLantern(ctx, x, y, s, now) {
  const flicker = 0.9 + Math.sin(now * 6.1) * 0.07;
  const glow = ctx.createRadialGradient(x, y - 60 * s, 4, x, y - 60 * s, 150 * s);
  glow.addColorStop(0, 'rgba(255, 233, 168, 0.5)');
  glow.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 60 * s, 150 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d3654';
  ctx.beginPath();
  ctx.moveTo(x - 30 * s, y + 40 * s);
  ctx.lineTo(x - 20 * s, y - 44 * s);
  ctx.lineTo(x + 20 * s, y - 44 * s);
  ctx.lineTo(x + 30 * s, y + 40 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#57507a';
  ctx.fillRect(x - 24 * s, y - 50 * s, 48 * s, 8 * s);
  ctx.fillStyle = '#241f38';
  ctx.fillRect(x - 17 * s, y - 82 * s, 34 * s, 34 * s);
  ctx.fillStyle = '#fffbe8';
  ctx.beginPath();
  ctx.ellipse(x, y - 65 * s, 8 * s * flicker, 12 * s * flicker, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2440';
  ctx.beginPath();
  ctx.moveTo(x - 24 * s, y - 82 * s);
  ctx.lineTo(x, y - 104 * s);
  ctx.lineTo(x + 24 * s, y - 82 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 233, 168, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 42 * s, 46 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTitle(ctx, game) {
  // The title spans the whole window: dim the garden, then dress the
  // right side (where the command panel sits in play) as night sky.
  dimBoard(ctx, 0.45);
  const side = ctx.createLinearGradient(PANEL_EDGE_X, 0, VIEW_W, 0);
  side.addColorStop(0, 'rgba(11, 16, 38, 0.55)');
  side.addColorStop(1, '#0b1026');
  ctx.fillStyle = side;
  ctx.fillRect(PANEL_EDGE_X, 0, VIEW_W - PANEL_EDGE_X, VIEW_H);
  for (let i = 0; i < 42; i += 1) {
    const sx = 980 + ((i * 67) % 290);
    const sy = 20 + ((i * 53) % 300);
    ctx.globalAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(game.now * 1.3 + i));
    ctx.fillStyle = '#dfe6ff';
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawTitleLantern(ctx, 1128, 480, 1.5, game.now);
  text(ctx, 'The last light', 1128, 592, { font: '15px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', align: 'center' });
  text(ctx, 'in the garden.', 1128, 614, { font: '15px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', align: 'center' });

  const cx = 560;
  const halo = ctx.createRadialGradient(cx, 210, 10, cx, 210, 320);
  halo.addColorStop(0, 'rgba(255, 233, 168, 0.14)');
  halo.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, BOARD_W, VIEW_H);

  text(ctx, 'A NIGHT-GARDEN DEFENSE', cx, 118, { font: '15px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', align: 'center', weight: '700' });
  glowTitle(ctx, 'LUMENHOLD', cx, 178, 74, '#ffd76a');
  text(ctx, 'Siege of the Last Lantern', cx, 224, { font: '22px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', align: 'center' });

  ctx.save();
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  const story = 'The moths of the Hollow come for the last light in the garden. Raise lanterns along their path, kindle them brighter, and hold the flame through 12 waves until dawn.';
  const lines = wrapText(ctx, story, 640);
  lines.forEach((line, i) => {
    text(ctx, line, cx, 268 + i * 23, { font: '16px "Trebuchet MS", Verdana, sans-serif', color: '#c3cbdf', align: 'center' });
  });
  ctx.restore();

  // Three promise chips.
  const chips = ['3 lanterns, each with a job', 'Upgrades that change the fight', 'Boss moths at waves 6 & 12'];
  chips.forEach((chip, i) => {
    const x = cx - 318 + i * 218;
    panel(ctx, x, 348, 202, 34, { fill: 'rgba(19, 26, 46, 0.9)', radius: 17 });
    text(ctx, chip, x + 101, 370, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', align: 'center' });
  });

  button(game, ctx, 'begin', cx - 125, 414, 250, 56, 'BEGIN THE VIGIL', { accent: true, fontSize: 18, sub: 'or press Enter' });
  button(game, ctx, 'help-title', cx - 125, 482, 121, 40, 'How to play', { fontSize: 14 });
  button(game, ctx, 'mute-title', cx + 4, 482, 121, 40, game.sound.muted ? 'Muted' : 'Sound on', { fontSize: 14 });

  if (game.best) {
    text(ctx, `Best vigil: ${game.best.score} points · ${game.best.wavesCleared}/${FINAL_WAVE} waves${game.best.won ? ' · dawn reached' : ''}`, cx, 556, { font: '14px "Trebuchet MS", Verdana, sans-serif', color: '#ffd76a', align: 'center' });
  }
  text(ctx, 'Mouse to build & select  ·  Keys 1/2/3 build  ·  Space starts a wave  ·  P pauses  ·  M mutes', cx, 596, { font: '13px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', align: 'center' });
  text(ctx, 'An original game: every sprite, sound and line of code was made for this garden.', cx, 668, { font: '12px "Trebuchet MS", Verdana, sans-serif', color: '#6b7694', align: 'center' });
}

const PANEL_EDGE_X = 960;

export function drawHelp(ctx, game) {
  dimBoard(ctx, 0.72);
  panel(ctx, 130, 56, 700, 608, { fill: '#101827', radius: 16 });
  text(ctx, 'HOW TO PLAY', 480, 100, { font: '28px "Trebuchet MS", Verdana, sans-serif', color: '#ffe9a8', align: 'center', weight: '700' });
  const rows = [
    ['GOAL', 'Moths follow the stone path to the Last Lantern. If its light reaches 0, the night wins. Survive all 12 waves to see dawn.'],
    ['BUILD', 'Click a lantern card (or press 1, 2, 3), then click a free grass plot. Lanterns cost glowpetals; kills earn more.'],
    ['EMBER LANTERN', 'Fast bolts, steady damage. Your workhorse — plant several along the long straights.'],
    ['FROST BELL', 'Weak chimes that slow moths by 45%. Place before bends so other lanterns get more shots.'],
    ['STAR MORTAR', 'Slow, heavy shells that burst over a crowd. Keep it back: it cannot hit moths right beside it.'],
    ['KINDLE & SELL', 'Click a placed lantern to kindle it (stronger, further, faster — up to level 3) or sell it back for 70%.'],
    ['ENEMIES', 'Wisps are quick; Dusk Moths are tough; Shades split in two; Wraiths heal; the Gloom Moth Queen sheds wisps.'],
    ['WAVES', 'Press Start Wave (or Space) when ready. Clearing a wave pays a bonus. 2× speed is there for long nights.'],
    ['KEYS', '1/2/3 build · Space start wave · P pause · F speed · M mute · Esc cancel · R restart after the end.'],
  ];
  let y = 132;
  ctx.save();
  ctx.font = '14px "Trebuchet MS", Verdana, sans-serif';
  for (const [head, body] of rows) {
    text(ctx, head, 162, y, { font: '13px "Trebuchet MS", Verdana, sans-serif', color: '#ffd76a', weight: '700' });
    const lines = wrapText(ctx, body, 560);
    lines.forEach((line, i) => {
      text(ctx, line, 268, y + i * 19, { font: '14px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff' });
    });
    y += Math.max(26, lines.length * 19 + 8);
  }
  ctx.restore();
  button(game, ctx, 'close-help', 380, 596, 200, 44, 'BACK', { accent: true, fontSize: 16 });
}

export function drawPaused(ctx, game) {
  dimBoard(ctx, 0.6);
  panel(ctx, 300, 220, 360, 260, { fill: '#101827', radius: 16 });
  glowTitle(ctx, 'PAUSED', 480, 268, 34, '#7fd4ff');
  text(ctx, 'The moths wait. The light holds.', 480, 302, { font: '14px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', align: 'center' });
  button(game, ctx, 'resume', 360, 330, 240, 44, 'RESUME', { accent: true, fontSize: 16 });
  button(game, ctx, 'restart-pause', 360, 382, 240, 40, 'Restart run', { fontSize: 14 });
  button(game, ctx, 'title-pause', 360, 428, 240, 40, 'Back to title', { fontSize: 14 });
  void game;
}

function drawEndPanel(ctx, game, won) {
  const stats = game.endStats ?? { score: game.score, wavesCleared: 0, kills: game.kills, leaked: game.leaked, goldEarned: game.goldEarned, livesLeft: game.lives, elapsed: game.elapsed, isNewBest: false };
  dimBoard(ctx, won ? 0.5 : 0.62);
  panel(ctx, 180, 96, 600, 528, { fill: '#101827', radius: 18 });
  if (won) {
    glowTitle(ctx, 'DAWN BREAKS', 480, 152, 46, '#ffd76a');
    text(ctx, 'You held the light through all 12 waves.', 480, 190, { font: '16px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', align: 'center' });
  } else {
    glowTitle(ctx, 'THE LIGHT FADES', 480, 152, 46, '#ff6b6b');
    text(ctx, `The moths reached the lantern on wave ${Math.max(1, game.wave)}.`, 480, 190, { font: '16px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', align: 'center' });
  }
  if (stats.isNewBest) {
    panel(ctx, 380, 208, 200, 30, { fill: '#2a2410', stroke: '#ffd76a', radius: 15 });
    text(ctx, '★ NEW BEST SCORE ★', 480, 228, { font: '13px "Trebuchet MS", Verdana, sans-serif', color: '#ffd76a', align: 'center', weight: '700' });
  }
  const rows = [
    ['FINAL SCORE', `${stats.score}`],
    ['WAVES HELD', `${stats.wavesCleared} / ${FINAL_WAVE}`],
    ['MOTHS FELLED', `${stats.kills}`],
    ['LANTERN LIGHT LEFT', `${stats.livesLeft} / ${game.maxLives}`],
    ['GLOWPETALS EARNED', `${stats.goldEarned}`],
    ['TIME IN THE GARDEN', formatTime(stats.elapsed)],
  ];
  let y = 268;
  for (const [label, value] of rows) {
    text(ctx, label, 250, y, { font: '14px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', weight: '700' });
    text(ctx, value, 710, y, { font: '17px "Trebuchet MS", Verdana, sans-serif', color: '#eef1ff', align: 'right', weight: '700' });
    ctx.strokeStyle = '#232c44';
    ctx.beginPath();
    ctx.moveTo(250, y + 12);
    ctx.lineTo(710, y + 12);
    ctx.stroke();
    y += 40;
  }
  button(game, ctx, 'restart', 300, 516, 180, 50, 'PLAY AGAIN', { accent: true, fontSize: 17, sub: 'press R' });
  button(game, ctx, 'title-btn', 492, 516, 180, 50, 'TITLE SCREEN', { fontSize: 15 });
  text(ctx, won ? 'Thank you for keeping the garden lit.' : 'The garden remembers. Try a new arrangement.', 480, 600, { font: '13px "Trebuchet MS", Verdana, sans-serif', color: '#9aa7c7', align: 'center' });
  void rr;
}

export function drawVictory(ctx, game) {
  drawEndPanel(ctx, game, true);
}

export function drawDefeat(ctx, game) {
  drawEndPanel(ctx, game, false);
}
