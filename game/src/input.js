// Input for Lumenhold: mouse clicks on buttons and board plots, and the
// keyboard shortcuts. Coordinates are converted from the scaled canvas
// back into the game's 1280×720 logical space.

import { BOARD_W, CELL, TURRET_ORDER, VIEW_H, VIEW_W } from './config.js';
import { cellAt } from './path.js';

function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
}

export function attachInput(canvas, game) {
  const statusEl = document.getElementById('status');

  canvas.addEventListener('pointermove', (event) => {
    const pos = toLogical(canvas, event.clientX, event.clientY);
    game.hover = pos;
    game.hoverCell = game.state === 'playing' && pos.x < BOARD_W ? cellAt(pos.x, pos.y) : null;
  });

  canvas.addEventListener('pointerleave', () => {
    game.hover = { x: -1, y: -1 };
    game.hoverCell = null;
  });

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    cancelPlacement(game);
  });

  canvas.addEventListener('pointerdown', (event) => {
    game.sound.unlock();
    const pos = toLogical(canvas, event.clientX, event.clientY);
    game.hover = pos;
    if (event.button === 2) {
      cancelPlacement(game);
      return;
    }
    // Buttons first, topmost (last drawn) wins.
    for (let i = game.ui.length - 1; i >= 0; i -= 1) {
      const rect = game.ui[i];
      if (pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h) {
        if (!rect.disabled) doAction(game, rect.id);
        return;
      }
    }
    if (game.state === 'playing' && pos.x < BOARD_W) {
      const cell = cellAt(pos.x, pos.y);
      if (cell) boardClick(game, cell);
    }
  });

  window.addEventListener('keydown', (event) => {
    game.sound.unlock();
    const key = event.key;
    if (key === ' ') event.preventDefault();
    const lower = key.toLowerCase();

    if (game.state === 'title') {
      if (key === 'Enter' || key === ' ') game.startRun();
      else if (lower === 'h') game.openHelp('title');
      else if (lower === 'm') game.toggleMute();
      return;
    }
    if (game.state === 'help') {
      if (key === 'Escape' || key === 'Enter') game.closeHelp();
      return;
    }
    if (game.state === 'victory' || game.state === 'defeat') {
      if (lower === 'r' || key === 'Enter' || key === ' ') game.startRun();
      else if (key === 'Escape' || lower === 't') game.toTitle();
      return;
    }
    if (game.state === 'paused') {
      if (lower === 'p' || key === 'Escape' || key === 'Enter') game.togglePause();
      else if (lower === 'r') game.startRun();
      else if (lower === 'm') game.toggleMute();
      return;
    }
    // Playing.
    if (lower === 'p') { game.togglePause(); return; }
    if (lower === 'f') { game.toggleSpeed(); return; }
    if (lower === 'm') { game.toggleMute(); return; }
    if (lower === 'h') { game.openHelp('playing'); return; }
    if (key === 'Escape') { cancelPlacement(game); return; }
    if (key === ' ') { game.startWave(); return; }
    if (key === 'Enter') { game.startWave(); return; }
    const buildIndex = ['1', '2', '3'].indexOf(key);
    if (buildIndex !== -1) {
      const type = TURRET_ORDER[buildIndex];
      game.selectedBuild = game.selectedBuild === type ? null : type;
      game.selectedTurret = null;
      game.sound.play('click');
    }
  });

  // Keep the screen-reader status line fresh without spamming it.
  setInterval(() => {
    if (!statusEl) return;
    if (game.state === 'playing') {
      statusEl.textContent = `Wave ${game.wave} of 12. Lantern ${game.lives} of ${game.maxLives}. ${game.gold} glowpetals. Score ${game.score}.`;
    } else if (game.state === 'title') {
      statusEl.textContent = 'Lumenhold title screen. Press Enter to begin the vigil.';
    } else if (game.state === 'victory') {
      statusEl.textContent = `Victory. Final score ${game.score}. Press R to play again.`;
    } else if (game.state === 'defeat') {
      statusEl.textContent = `Defeat on wave ${game.wave}. Final score ${game.score}. Press R to try again.`;
    }
  }, 1500);
  void CELL;
}

function cancelPlacement(game) {
  if (game.selectedBuild) {
    game.selectedBuild = null;
  } else {
    game.selectedTurret = null;
  }
}

function boardClick(game, cell) {
  if (game.selectedBuild) {
    game.placeTurretAt(cell.col, cell.row);
    return;
  }
  const turret = game.turretAt(cell.col, cell.row);
  if (turret) {
    game.selectedTurret = turret;
    game.sound.play('click');
  } else {
    game.selectedTurret = null;
  }
}

function doAction(game, id) {
  game.sound.play('click');
  switch (id) {
    case 'begin':
      game.startRun();
      break;
    case 'help-title':
      game.openHelp('title');
      break;
    case 'mute-title':
      game.toggleMute();
      break;
    case 'close-help':
      game.closeHelp();
      break;
    case 'resume':
      game.togglePause();
      break;
    case 'restart-pause':
      game.startRun();
      break;
    case 'title-pause':
      game.toTitle();
      break;
    case 'start-wave':
      game.startWave();
      break;
    case 'speed':
      game.toggleSpeed();
      break;
    case 'pause':
      game.togglePause();
      break;
    case 'mute':
      game.toggleMute();
      break;
    case 'help':
      game.openHelp(game.state);
      break;
    case 'upgrade':
      game.upgradeSelected();
      break;
    case 'sell':
      game.sellSelected();
      break;
    case 'restart':
      game.startRun();
      break;
    case 'title-btn':
      game.toTitle();
      break;
    default:
      if (id.startsWith('build-')) {
        const type = id.slice('build-'.length);
        game.selectedBuild = game.selectedBuild === type ? null : type;
        game.selectedTurret = null;
      }
      break;
  }
}
