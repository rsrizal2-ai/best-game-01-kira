// Game state for Lumenhold: the run, the economy, wave flow, combat
// resolution and win/lose transitions. Rendering lives in render.js and
// hud.js; input lives in input.js; this file only decides what happens.

import {
  FINAL_WAVE, START_GOLD, START_LIVES, TURRET_TYPES, waveClearBonus,
} from './config.js';
import { buildDecorations, buildWaypoints, isLanternCell, isPathCell } from './path.js';
import { Enemy } from './enemies.js';
import { Turret, turretUpgradeCost } from './turrets.js';
import { Projectile } from './projectiles.js';
import { ParticleSystem } from './particles.js';
import { SoundEngine } from './audio.js';
import { Rng, hashSeed } from './random.js';
import { buildWave } from './waves.js';
import { loadBest, recordRun } from './storage.js';

export class Game {
  constructor() {
    this.state = 'title'; // title | playing | paused | help | victory | defeat
    this.helpReturn = 'title';
    this.sound = new SoundEngine();
    this.particles = new ParticleSystem();
    this.waypoints = buildWaypoints();
    this.decorations = buildDecorations();
    this.rng = new Rng((Date.now() % 2147483647) || 1);
    this.best = loadBest();
    this.ui = []; // clickable rects rebuilt every frame by hud/screens
    this.hover = { x: -1, y: -1 };
    this.hoverCell = null;
    this.now = 0;
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.demoEnemies = [];
    this.demoTimer = 0;
    this.shotMode = null;
    this.newRun();
    this.state = 'title';
  }

  newRun(seedText = null) {
    if (seedText) this.rng = new Rng(hashSeed(seedText));
    this.gold = START_GOLD;
    this.score = 0;
    this.lives = START_LIVES;
    this.maxLives = START_LIVES;
    this.wave = 0;
    this.waveActive = false;
    this.spawnQueue = [];
    this.waveTime = 0;
    this.enemies = [];
    this.turrets = [];
    this.projectiles = [];
    this.particles.clear();
    this.selectedBuild = null;
    this.selectedTurret = null;
    this.speed = 1;
    this.kills = 0;
    this.leaked = 0;
    this.goldEarned = 0;
    this.elapsed = 0;
    this.runClock = 0;
    this.message = '';
    this.messageUntil = 0;
    this.endStats = null;
    this.isNewBest = false;
    this.demoEnemies = [];
    this.setMessage('Place lanterns, then press Start Wave.', 5);
  }

  startRun() {
    this.newRun();
    this.state = 'playing';
    this.sound.unlock();
    this.sound.startAmbient();
    this.sound.play('wave');
  }

  toTitle() {
    this.state = 'title';
    this.demoEnemies = [];
    this.demoTimer = 0;
    this.sound.stopAmbient();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  toggleSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
  }

  toggleMute() {
    this.sound.setMuted(!this.sound.muted);
  }

  openHelp(fromState) {
    this.helpReturn = fromState;
    this.state = 'help';
  }

  closeHelp() {
    this.state = this.helpReturn === 'help' ? 'title' : this.helpReturn;
  }

  setMessage(text, seconds = 3) {
    this.message = text;
    this.messageUntil = this.now + seconds;
  }

  // ---- Building ----

  get selectedBuildDef() {
    return this.selectedBuild ? TURRET_TYPES[this.selectedBuild] : null;
  }

  turretAt(col, row) {
    return this.turrets.find((t) => t.col === col && t.row === row) ?? null;
  }

  canPlaceAt(col, row) {
    if (col < 0 || row < 0 || col >= 12 || row >= 9) return false;
    if (isPathCell(col, row) || isLanternCell(col, row)) return false;
    if (this.turretAt(col, row)) return false;
    return true;
  }

  placeTurretAt(col, row) {
    const type = this.selectedBuild;
    if (!type) return false;
    if (!this.canPlaceAt(col, row)) {
      this.sound.play('deny');
      this.setMessage('Nothing grows there — the path and lantern must stay clear.');
      return false;
    }
    const cost = TURRET_TYPES[type].cost;
    if (this.gold < cost) {
      this.sound.play('deny');
      this.setMessage('Not enough glowpetals for that lantern.');
      return false;
    }
    this.gold -= cost;
    const turret = new Turret(type, col, row);
    this.turrets.push(turret);
    this.particles.burst(turret.x, turret.y - 10, { color: turret.def.color, count: 18, speed: 110 });
    this.particles.ring(turret.x, turret.y, { color: turret.def.color, maxRadius: 44 });
    this.sound.play('place');
    this.selectedTurret = turret;
    if (this.gold < cost) this.selectedBuild = null;
    return true;
  }

  upgradeSelected() {
    const turret = this.selectedTurret;
    if (!turret) return;
    const cost = turretUpgradeCost(turret.type, turret.level);
    if (cost === null) return;
    if (this.gold < cost) {
      this.sound.play('deny');
      this.setMessage('Not enough glowpetals to kindle this lantern further.');
      return;
    }
    this.gold -= cost;
    turret.invested += cost;
    turret.level += 1;
    this.particles.burst(turret.x, turret.y - 12, { color: '#ffe9a8', count: 22, speed: 130 });
    this.particles.ring(turret.x, turret.y, { color: '#ffe9a8', maxRadius: 52 });
    this.sound.play('upgrade');
    this.setMessage(`${turret.def.name} kindled to level ${turret.level}.`);
  }

  sellSelected() {
    const turret = this.selectedTurret;
    if (!turret) return;
    this.gold += turret.sellValue;
    this.particles.floatText(turret.x, turret.y - 24, `+${turret.sellValue}`, { color: '#ffd76a' });
    this.turrets = this.turrets.filter((t) => t !== turret);
    this.selectedTurret = null;
    this.sound.play('click');
  }

  // ---- Waves ----

  startWave() {
    if (this.state !== 'playing' || this.waveActive) return;
    if (this.wave >= FINAL_WAVE) return;
    this.wave += 1;
    this.spawnQueue = buildWave(this.wave, this.rng);
    this.waveTime = 0;
    this.waveActive = true;
    this.selectedBuild = null;
    this.setMessage(this.wave === FINAL_WAVE ? 'The final night. Hold the light!' : `Wave ${this.wave} approaches…`, 3);
    this.sound.play('wave');
  }

  spawnMinion(queen) {
    if (this.enemies.length > 60) return;
    const minion = new Enemy('wisp', this.wave, this.waypoints);
    minion.x = queen.x;
    minion.y = queen.y;
    minion.wp = queen.wp;
    minion.distanceWalked = queen.distanceWalked;
    this.enemies.push(minion);
    this.particles.burst(queen.x, queen.y, { color: '#b8a7ff', count: 8, speed: 70, life: 0.4, size: 2 });
  }

  // ---- Combat ----

  fireTurret(turret, target) {
    const stats = turret.stats;
    if (turret.type === 'mortar') {
      this.projectiles.push(new Projectile({
        kind: 'shell',
        x: turret.x, y: turret.y - 24,
        targetX: target.x, targetY: target.y,
        speed: turret.def.projectileSpeed,
        damage: stats.damage,
        splashRadius: stats.splashRadius,
        color: turret.def.color,
      }));
      this.sound.play('mortar');
    } else {
      const slow = stats.slowFactor ? { factor: stats.slowFactor, seconds: stats.slowSeconds } : null;
      this.projectiles.push(new Projectile({
        kind: 'bolt',
        x: turret.x, y: turret.y - 14,
        target,
        speed: turret.def.projectileSpeed,
        damage: stats.damage,
        slow,
        color: turret.def.color,
      }));
      this.sound.play('shoot');
    }
  }

  hitEnemy(enemy, damage, slow, x, y) {
    if (enemy.dead) return;
    enemy.applyDamage(damage, this.now, slow);
    this.particles.burst(x, y, { color: '#ffffff', count: 4, speed: 60, life: 0.25, size: 2 });
    if (enemy.dead) this.killEnemy(enemy);
  }

  explodeShell(shell) {
    const { targetX, targetY, splashRadius } = shell;
    this.particles.burst(targetX, targetY, { color: shell.color, count: 26, speed: 170, life: 0.6, size: 3.5 });
    this.particles.ring(targetX, targetY, { color: shell.color, maxRadius: splashRadius + 12 });
    this.sound.play('burst');
    for (const enemy of [...this.enemies]) {
      if (enemy.dead || enemy.reachedLantern) continue;
      const dist = Math.hypot(enemy.x - targetX, enemy.y - targetY);
      if (dist <= splashRadius + enemy.radius) {
        const falloff = dist < splashRadius * 0.5 ? 1 : 0.7;
        enemy.applyDamage(Math.round(shell.damage * falloff), this.now);
        if (enemy.dead) this.killEnemy(enemy);
      }
    }
  }

  killEnemy(enemy) {
    this.kills += 1;
    this.gold += enemy.reward;
    this.goldEarned += enemy.reward;
    this.score += enemy.reward * 10;
    this.particles.burst(enemy.x, enemy.y, { color: enemy.def.color, count: 18, speed: 140, life: 0.6 });
    this.particles.floatText(enemy.x, enemy.y - 20, `+${enemy.reward}`, { color: '#ffd76a', size: 15 });
    this.sound.play('pop');
    if (enemy.def.splitsInto) {
      for (let i = 0; i < enemy.def.splitCount; i += 1) {
        const child = new Enemy(enemy.def.splitsInto, this.wave, this.waypoints);
        child.x = enemy.x + (i === 0 ? -10 : 10);
        child.y = enemy.y;
        child.wp = enemy.wp;
        child.distanceWalked = enemy.distanceWalked;
        this.enemies.push(child);
      }
    }
  }

  damageLantern(enemy) {
    this.lives -= enemy.def.leak;
    this.leaked += 1;
    this.shakeTime = 0.35;
    this.shakeMag = 7;
    const lantern = this.waypoints[this.waypoints.length - 1];
    this.particles.burst(lantern.x, lantern.y - 20, { color: '#ff6b6b', count: 24, speed: 160 });
    this.particles.floatText(lantern.x - 20, lantern.y - 60, `-${enemy.def.leak}`, { color: '#ff6b6b', size: 20 });
    this.sound.play('leak');
    this.setMessage(`${enemy.def.name} struck the lantern!`, 2.5);
    if (this.lives <= 0) {
      this.lives = 0;
      this.endRun(false);
    }
  }

  endRun(won) {
    const wavesCleared = won ? FINAL_WAVE : Math.max(0, this.wave - (this.waveActive ? 1 : 0));
    if (won) this.score += this.lives * 100;
    const { record, isNewBest } = recordRun(this.score, wavesCleared, won);
    this.best = record;
    this.isNewBest = isNewBest;
    this.endStats = {
      won, score: this.score, wavesCleared, kills: this.kills,
      leaked: this.leaked, goldEarned: this.goldEarned,
      livesLeft: this.lives, elapsed: this.elapsed, isNewBest,
    };
    this.state = won ? 'victory' : 'defeat';
    this.waveActive = false;
    this.message = '';
    this.messageUntil = 0;
    this.sound.stopAmbient();
    this.sound.play(won ? 'victory' : 'defeat');
  }

  // ---- Update ----

  update(rawDt) {
    const dt = Math.min(0.05, rawDt);
    this.now += dt;
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.particles.update(dt);

    if (this.state === 'title' || this.state === 'help' && this.helpReturn === 'title') {
      this.updateDemo(dt);
      return;
    }
    if (this.state !== 'playing') return;

    const simDt = dt * this.speed;
    this.elapsed += simDt;
    this.runClock += simDt;

    if (this.waveActive) {
      this.waveTime += simDt;
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].at <= this.waveTime) {
        const entry = this.spawnQueue.shift();
        this.enemies.push(new Enemy(entry.type, this.wave, this.waypoints));
      }
    }

    for (const turret of this.turrets) turret.update(simDt, this);
    for (const projectile of this.projectiles) projectile.update(simDt, this);
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    for (const enemy of this.enemies) {
      if (!enemy.dead && !enemy.reachedLantern) enemy.update(simDt, this);
    }
    for (const enemy of this.enemies) {
      if (enemy.reachedLantern && !enemy.dead) {
        enemy.dead = true;
        this.damageLantern(enemy);
        if (this.state !== 'playing') break;
      }
    }
    this.enemies = this.enemies.filter((e) => !e.dead);

    if (this.state === 'playing' && this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      if (this.wave >= FINAL_WAVE) {
        this.endRun(true);
      } else {
        const bonus = waveClearBonus(this.wave);
        this.gold += bonus;
        this.score += this.wave * 50;
        this.setMessage(`Wave ${this.wave} cleared! +${bonus} glowpetals. Build, then start wave ${this.wave + 1}.`, 4);
        this.sound.play('clear');
      }
    }
  }

  // Title-screen ambience: moths drift along the path and fade at the
  // lantern, so the title shows the living garden, not a still image.
  updateDemo(dt) {
    this.demoTimer -= dt;
    if (this.demoTimer <= 0 && this.demoEnemies.length < 5) {
      this.demoTimer = 1.6 + Math.random() * 1.4;
      const demo = new Enemy(Math.random() < 0.6 ? 'wisp' : 'moth', 1, this.waypoints);
      demo.speed *= 0.7;
      this.demoEnemies.push(demo);
    }
    for (const enemy of this.demoEnemies) enemy.update(dt, this);
    this.demoEnemies = this.demoEnemies.filter((e) => !e.reachedLantern);
  }
}
