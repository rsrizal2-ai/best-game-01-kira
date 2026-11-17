// Shared canvas drawing helpers for Lumenhold: rounded panels, buttons
// that register themselves for clicks, and wrapped text.

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function panel(ctx, x, y, w, h, { fill = '#131a2e', stroke = '#2c3a5e', radius = 12, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  rr(ctx, x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

export function text(ctx, str, x, y, { font = '16px "Trebuchet MS", Verdana, sans-serif', color = '#eef1ff', align = 'left', baseline = 'alphabetic', weight = null } = {}) {
  ctx.save();
  ctx.font = weight ? `${weight} ${font}` : font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Draws a button and registers its rect in game.ui so input.js can hit it.
export function button(game, ctx, id, x, y, w, h, label, { disabled = false, accent = false, fontSize = 16, sub = null } = {}) {
  const hovered = !disabled && game.hover.x >= x && game.hover.x <= x + w && game.hover.y >= y && game.hover.y <= y + h;
  game.ui.push({ id, x, y, w, h, disabled });
  ctx.save();
  rr(ctx, x, y, w, h, 9);
  if (disabled) ctx.fillStyle = '#232c44';
  else if (accent) ctx.fillStyle = hovered ? '#ffcf5c' : '#f5b93d';
  else ctx.fillStyle = hovered ? '#2a3554' : '#1d2742';
  ctx.fill();
  ctx.strokeStyle = disabled ? '#2c3a5e' : accent ? '#ffe9a8' : '#3d4c74';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = `700 ${fontSize}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = disabled ? '#6b7694' : accent ? '#241a05' : '#eef1ff';
  const cy = sub ? y + h / 2 - 8 : y + h / 2;
  ctx.fillText(label, x + w / 2, cy);
  if (sub) {
    ctx.font = `12px "Trebuchet MS", Verdana, sans-serif`;
    ctx.fillStyle = disabled ? '#556080' : accent ? '#5a430f' : '#9aa7c7';
    ctx.fillText(sub, x + w / 2, y + h / 2 + 13);
  }
  ctx.restore();
  return hovered;
}

export function wrapText(ctx, str, maxWidth) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
