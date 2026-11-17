// Board geometry for Lumenhold: the grid, the winding enemy path, the
// lantern's cell, and the seeded night-garden decorations drawn behind play.

import { BOARD_W, CELL, COLS, LANTERN_CELL, PATH_CELLS, ROWS, VIEW_H } from './config.js';
import { Rng } from './random.js';

export function cellCenter(col, row) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

export function cellAt(x, y) {
  if (x < 0 || y < 0 || x >= BOARD_W || y >= VIEW_H) return null;
  return { col: Math.floor(x / CELL), row: Math.floor(y / CELL) };
}

const PATH_KEYS = new Set(PATH_CELLS.map(([c, r]) => `${c},${r}`));

export function isPathCell(col, row) {
  return PATH_KEYS.has(`${col},${row}`);
}

export function isLanternCell(col, row) {
  return col === LANTERN_CELL[0] && row === LANTERN_CELL[1];
}

export function buildWaypoints() {
  const points = [{ x: -CELL, y: cellCenter(0, 1).y }];
  for (const [col, row] of PATH_CELLS) points.push(cellCenter(col, row));
  return points;
}

// Decorations are generated once from a fixed seed so the garden looks the
// same every run: stars, grass tufts, glow-flowers and pebbles that never
// sit on the path or the lantern cell.
export function buildDecorations(seed = 20261118) {
  const rng = new Rng(seed);
  const stars = [];
  for (let i = 0; i < 90; i += 1) {
    stars.push({
      x: rng.range(0, BOARD_W),
      y: rng.range(0, 55),
      r: rng.range(0.7, 1.9),
      twinkle: rng.range(0, Math.PI * 2),
      speed: rng.range(0.6, 1.8),
    });
  }
  const tufts = [];
  const flowers = [];
  const pebbles = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (isPathCell(col, row) || isLanternCell(col, row)) continue;
      const count = rng.int(1, 3);
      for (let i = 0; i < count; i += 1) {
        const x = col * CELL + rng.range(10, CELL - 10);
        const y = row * CELL + rng.range(12, CELL - 8);
        const roll = rng.float();
        if (roll < 0.55) tufts.push({ x, y, lean: rng.range(-0.3, 0.3), h: rng.range(9, 17) });
        else if (roll < 0.82) flowers.push({ x, y, hue: rng.pick([318, 46, 190, 262]), phase: rng.range(0, 6.28) });
        else pebbles.push({ x, y, r: rng.range(2, 4.5) });
      }
    }
  }
  // Fireflies drift over the garden; their motion is time-based, not stored.
  const fireflies = [];
  for (let i = 0; i < 16; i += 1) {
    fireflies.push({
      x: rng.range(20, BOARD_W - 20),
      y: rng.range(60, VIEW_H - 30),
      a: rng.range(20, 55),
      b: rng.range(12, 30),
      speed: rng.range(0.2, 0.55),
      phase: rng.range(0, Math.PI * 2),
    });
  }
  return { stars, tufts, flowers, pebbles, fireflies };
}
