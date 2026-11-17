// Screenshot staging for Lumenhold: `?shot=play&seed=1` (and title,
// victory, defeat) arranges a real game state through the game's own
// classes and then lets the normal update loop run, so screenshots are
// genuine renders of the game code, never mock-ups.

import { FINAL_WAVE, TURRET_TYPES } from './config.js';
import { Enemy } from './enemies.js';
import { Turret } from './turrets.js';

function placeAlongPath(enemy, distance, waypoints) {
  let remaining = distance;
  enemy.x = waypoints[0].x;
  enemy.y = waypoints[0].y;
  enemy.wp = 1;
  while (enemy.wp < waypoints.length && remaining > 0) {
    const target = waypoints[enemy.wp];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= remaining) {
      enemy.x = target.x;
      enemy.y = target.y;
      remaining -= dist;
      enemy.wp += 1;
    } else {
      enemy.x += (dx / dist) * remaining;
      enemy.y += (dy / dist) * remaining;
      remaining = 0;
    }
  }
  enemy.distanceWalked = distance;
}

function addTurret(game, type, col, row, level) {
  const turret = new Turret(type, col, row);
  turret.level = level;
  turret.invested = TURRET_TYPES[type].cost * level;
  game.turrets.push(turret);
  return turret;
}

function stagePlay(game, seedText) {
  game.newRun(seedText);
  game.state = 'playing';
  game.gold = 236;
  game.score = 4850;
  game.lives = 14;
  game.kills = 96;
  game.elapsed = 372;
  game.wave = 7;
  game.waveActive = true;
  game.waveTime = 6;
  addTurret(game, 'ember', 5, 0, 2);
  addTurret(game, 'ember', 3, 3, 1);
  addTurret(game, 'ember', 1, 2, 1);
  const frost = addTurret(game, 'frost', 8, 2, 2);
  addTurret(game, 'frost', 4, 5, 1);
  addTurret(game, 'mortar', 6, 6, 2);
  addTurret(game, 'mortar', 8, 8, 1);
  game.selectedTurret = frost;
  const plan = [
    ['wisp', 120], ['wisp', 210], ['moth', 320], ['wisp', 430], ['moth', 520],
    ['shade', 640], ['wisp', 730], ['wisp', 810], ['moth', 920], ['wraith', 1040],
    ['wisp', 1150], ['moth', 1260], ['shade', 1380], ['wisp', 1500], ['moth', 1620],
    ['wisp', 1740],
  ];
  for (const [type, dist] of plan) {
    const enemy = new Enemy(type, 7, game.waypoints);
    placeAlongPath(enemy, dist, game.waypoints);
    game.enemies.push(enemy);
  }
  // Let the battle run a few seconds so bolts, bursts and slow rings are
  // mid-flight when the screenshot lands.
  for (let i = 0; i < 75; i += 1) game.update(1 / 30);
  game.setMessage('Wave 7 — the Hollow presses the bend. Frost holds them for the mortars!', 999);
  game.messageUntil = game.now + 999;
}

function stageVictory(game, seedText) {
  game.newRun(seedText);
  game.state = 'victory';
  game.gold = 412;
  game.score = 12840;
  game.lives = 9;
  game.kills = 214;
  game.goldEarned = 1930;
  game.elapsed = 1044;
  game.wave = FINAL_WAVE;
  addTurret(game, 'ember', 5, 0, 3);
  addTurret(game, 'frost', 8, 2, 3);
  addTurret(game, 'mortar', 6, 6, 3);
  addTurret(game, 'ember', 3, 3, 2);
  addTurret(game, 'frost', 4, 5, 2);
  game.endStats = {
    won: true, score: 12840, wavesCleared: FINAL_WAVE, kills: 214,
    leaked: 4, goldEarned: 1930, livesLeft: 9, elapsed: 1044, isNewBest: true,
  };
  game.message = '';
  game.messageUntil = 0;
}

function stageDefeat(game, seedText) {
  game.newRun(seedText);
  game.state = 'defeat';
  game.gold = 58;
  game.score = 5310;
  game.lives = 0;
  game.kills = 118;
  game.goldEarned = 940;
  game.elapsed = 486;
  game.wave = 8;
  addTurret(game, 'ember', 5, 0, 2);
  addTurret(game, 'frost', 8, 2, 1);
  addTurret(game, 'mortar', 6, 6, 1);
  const near = new Enemy('wraith', 8, game.waypoints);
  placeAlongPath(near, 2450, game.waypoints);
  game.enemies.push(near);
  const moth = new Enemy('moth', 8, game.waypoints);
  placeAlongPath(moth, 2320, game.waypoints);
  game.enemies.push(moth);
  game.endStats = {
    won: false, score: 5310, wavesCleared: 7, kills: 118,
    leaked: 9, goldEarned: 940, livesLeft: 0, elapsed: 486, isNewBest: false,
  };
  game.message = '';
  game.messageUntil = 0;
}

export function stageShot(game, params) {
  const shot = params.get('shot');
  const seed = params.get('seed') || '1';
  if (!shot) return false;
  game.shotMode = shot;
  if (shot === 'play') stagePlay(game, `shot-play-${seed}`);
  else if (shot === 'victory') stageVictory(game, `shot-victory-${seed}`);
  else if (shot === 'defeat') stageDefeat(game, `shot-defeat-${seed}`);
  else if (shot === 'title') game.toTitle();
  else return false;
  return true;
}
