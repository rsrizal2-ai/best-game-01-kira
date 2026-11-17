// Lumenhold boot: canvas setup, the frame loop, and screen routing.
// The game runs at a fixed 1280×720 logical resolution, scaled by CSS
// to fit the window while keeping its aspect ratio.

import { VIEW_H, VIEW_W } from './config.js';
import { Game } from './game.js';
import { drawScene } from './render.js';
import { drawPanel } from './hud.js';
import { drawDefeat, drawHelp, drawPaused, drawTitle, drawVictory } from './screens.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const game = new Game();
attachInput(canvas, game);
stageShot(game, new URLSearchParams(window.location.search));

// Exposed for local play-testing in devtools; the game never needs it.
window.__lumenhold = game;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.ui = [];
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawScene(ctx, game);
  const showPanel = game.state === 'playing' || game.state === 'paused'
    || game.state === 'victory' || game.state === 'defeat'
    || (game.state === 'help' && game.helpReturn !== 'title');
  if (showPanel) drawPanel(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  else if (game.state === 'help') drawHelp(ctx, game);
  else if (game.state === 'paused') drawPaused(ctx, game);
  else if (game.state === 'victory') drawVictory(ctx, game);
  else if (game.state === 'defeat') drawDefeat(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
