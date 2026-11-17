// Lumenhold — balance and layout constants.
// One place for every number a designer would tune: board geometry, the
// winding path, turret and enemy stats, wave pacing and the colour palette.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The board is the left 960 px; the right 320 px is the command panel.
export const BOARD_W = 960;
export const PANEL_X = 960;
export const PANEL_W = 320;

export const COLS = 12;
export const ROWS = 9;
export const CELL = 80;

// Grid cells the enemy path runs through, in walking order. The last cell
// holds the Last Lantern itself.
export const PATH_CELLS = [
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],
  [9, 2], [9, 3], [9, 4],
  [8, 4], [7, 4], [6, 4], [5, 4], [4, 4], [3, 4], [2, 4],
  [2, 5], [2, 6], [2, 7],
  [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
  [10, 8], [11, 8],
];
export const LANTERN_CELL = [11, 8];

export const START_GOLD = 170;
export const START_LIVES = 20;
export const FINAL_WAVE = 12;
export const SELL_REFUND = 0.7;

export function waveClearBonus(wave) {
  return 30 + wave * 6;
}

export function enemyHealthScale(wave) {
  return 1 + 0.19 * (wave - 1) + 0.013 * (wave - 1) * (wave - 1);
}

// Turret definitions. `stats` are level-1 values; each upgrade multiplies
// damage and range and quickens the fire rate (see turrets.js).
export const TURRET_TYPES = {
  ember: {
    key: 'ember',
    name: 'Ember Lantern',
    short: 'Ember',
    cost: 50,
    hotkey: '1',
    blurb: 'Quick bolts of lantern-light. Reliable against single moths.',
    damage: 9,
    range: 135,
    fireInterval: 0.42,
    projectileSpeed: 420,
    color: '#ffb347',
    glow: '#ff8c1a',
  },
  frost: {
    key: 'frost',
    name: 'Frost Bell',
    short: 'Frost',
    cost: 75,
    hotkey: '2',
    blurb: 'Chilling chimes slow moths to a crawl. Little damage, big control.',
    damage: 5,
    range: 125,
    fireInterval: 0.8,
    projectileSpeed: 330,
    slowFactor: 0.55,
    slowSeconds: 1.7,
    color: '#7fd4ff',
    glow: '#3aa7ff',
  },
  mortar: {
    key: 'mortar',
    name: 'Star Mortar',
    short: 'Mortar',
    cost: 110,
    hotkey: '3',
    blurb: 'Lobs falling stars that burst over a crowd. Needs room to arc.',
    damage: 26,
    range: 195,
    fireInterval: 1.8,
    projectileSpeed: 260,
    splashRadius: 58,
    minRange: 45,
    color: '#ffd76a',
    glow: '#ffe9a8',
  },
};
export const TURRET_ORDER = ['ember', 'frost', 'mortar'];
export const MAX_TURRET_LEVEL = 3;

export function upgradeCost(type) {
  const base = TURRET_TYPES[type].cost;
  return Math.round(base * 0.75);
}

// Enemy definitions. Health is multiplied by enemyHealthScale(wave).
export const ENEMY_TYPES = {
  wisp: {
    key: 'wisp',
    name: 'Wisp',
    health: 26,
    speed: 64,
    reward: 8,
    leak: 1,
    radius: 13,
    color: '#b8a7ff',
    core: '#efe9ff',
  },
  moth: {
    key: 'moth',
    name: 'Dusk Moth',
    health: 78,
    speed: 44,
    reward: 14,
    leak: 2,
    radius: 17,
    color: '#8f7bd8',
    core: '#d9ccff',
  },
  shade: {
    key: 'shade',
    name: 'Shade',
    health: 150,
    speed: 35,
    reward: 22,
    leak: 2,
    radius: 19,
    color: '#5b4a9e',
    core: '#9d8ce8',
    splitsInto: 'wisp',
    splitCount: 2,
  },
  wraith: {
    key: 'wraith',
    name: 'Hollow Wraith',
    health: 250,
    speed: 31,
    reward: 34,
    leak: 3,
    radius: 20,
    color: '#3f6d8e',
    core: '#a8e0ff',
    regenPerSecond: 6,
  },
  queen: {
    key: 'queen',
    name: 'Gloom Moth Queen',
    health: 1700,
    speed: 25,
    reward: 260,
    leak: 10,
    radius: 30,
    color: '#2c1f56',
    core: '#ffd76a',
    boss: true,
  },
};

export const PALETTE = {
  skyTop: '#0b1026',
  skyBottom: '#1a1440',
  groundA: '#16241c',
  groundB: '#101a14',
  pathStone: '#4a4360',
  pathEdge: '#6b6288',
  panel: '#131a2e',
  panelEdge: '#2c3a5e',
  panelHi: '#1d2742',
  gold: '#ffd76a',
  text: '#eef1ff',
  dimText: '#9aa7c7',
  danger: '#ff6b6b',
  good: '#7fe8a8',
  lanternGlow: '#ffe9a8',
};
