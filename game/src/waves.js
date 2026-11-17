// Wave composition for Lumenhold: twelve hand-tuned waves that introduce
// each enemy in turn, then mix them, with a boss at waves 6 and 12.
// Spacing tightens as waves grow so later waves feel like a siege.

import { FINAL_WAVE } from './config.js';

export function isBossWave(wave) {
  return wave === 6 || wave === FINAL_WAVE;
}

// Returns spawn entries: { type, at } where `at` is seconds after the
// wave starts. Built from a recipe plus a seeded shuffle of the middle.
export function buildWave(wave, rng) {
  const entries = [];
  const push = (type, count, gap, startAt) => {
    for (let i = 0; i < count; i += 1) entries.push({ type, at: startAt + i * gap });
  };
  const clampGap = (g) => Math.max(0.32, g);

  if (wave === 1) {
    push('wisp', 8, 0.9, 0.5);
  } else if (wave === 2) {
    push('wisp', 12, 0.75, 0.5);
    push('moth', 2, 1.4, 4);
  } else if (wave === 3) {
    push('wisp', 10, 0.6, 0.5);
    push('moth', 5, 1.1, 2);
  } else if (wave === 4) {
    push('moth', 8, 0.9, 0.5);
    push('wisp', 10, 0.45, 1.5);
  } else if (wave === 5) {
    push('shade', 4, 1.6, 0.5);
    push('wisp', 14, 0.5, 1);
    push('moth', 5, 1.0, 3);
  } else if (wave === 6) {
    push('queen', 1, 1, 1.5);
    push('wisp', 10, 0.7, 0.5);
    push('moth', 4, 1.3, 5);
  } else if (wave === 7) {
    push('wraith', 3, 2.2, 0.5);
    push('moth', 8, 0.8, 1);
    push('wisp', 12, 0.45, 2);
  } else if (wave === 8) {
    push('shade', 6, 1.3, 0.5);
    push('wraith', 3, 2.0, 2);
    push('wisp', 16, 0.4, 1);
  } else if (wave === 9) {
    push('moth', 12, 0.6, 0.5);
    push('shade', 5, 1.4, 2);
    push('wraith', 4, 1.8, 3);
    push('wisp', 10, 0.4, 4);
  } else if (wave === 10) {
    push('wraith', 6, 1.5, 0.5);
    push('shade', 6, 1.2, 1.5);
    push('moth', 10, 0.55, 2);
  } else if (wave === 11) {
    push('wisp', 24, clampGap(0.34), 0.5);
    push('shade', 7, 1.1, 2);
    push('wraith', 5, 1.6, 3);
    push('moth', 8, 0.7, 4);
  } else {
    push('queen', 1, 1, 2);
    push('wraith', 5, 1.7, 0.5);
    push('shade', 6, 1.2, 2);
    push('moth', 10, 0.6, 3);
    push('wisp', 16, 0.4, 5);
  }

  // Jitter spawn times slightly so waves never march in lockstep.
  for (const e of entries) e.at = Math.max(0.2, e.at + rng.range(-0.12, 0.12));
  entries.sort((a, b) => a.at - b.at);
  return entries;
}

export function wavePreview(wave) {
  const counts = {};
  for (const e of buildWave(wave, { range: (a) => a })) counts[e.type] = (counts[e.type] || 0) + 1;
  const names = { wisp: 'Wisps', moth: 'Moths', shade: 'Shades', wraith: 'Wraiths', queen: 'QUEEN' };
  return Object.entries(counts).map(([k, n]) => `${n} ${names[k]}`).join(' · ');
}

export function totalWaves() {
  return FINAL_WAVE;
}
