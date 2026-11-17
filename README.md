# Lumenhold — Siege of the Last Lantern

An original night-garden tower defense, built for make.fun's "Make the best game" bounty. The moths of the Hollow follow the stone path to the Last Lantern. Raise lanterns along their path, kindle them brighter, and hold the flame through 12 waves until dawn.

## The game

- **3 lanterns, each with a job** — Ember Lantern (fast bolts), Frost Bell (slows moths 45%), Star Mortar (splash damage over crowds, with a minimum range).
- **5 enemies** — quick Wisps, tough Dusk Moths, Shades that split in two, regenerating Hollow Wraiths, and the Gloom Moth Queen boss at waves 6 and 12.
- **Real choices** — kindle lanterns to level 3, sell them back at 70%, manage glowpetals, and pick when to start each wave.
- **Complete loop** — title screen, 12 waves with a clear win (dawn) and loss (lantern falls), results screens with stats and restart, pause, help, 2× speed, mute, and a persistent best score.
- **Feel** — procedural WebAudio sound and ambient pad, particles, floating rewards, screen shake, range previews, and a living garden with fireflies and a flickering lantern flame.

Everything is original and self-contained: every sprite is drawn in code on a canvas, every sound is synthesised in the browser, and the game makes no network requests. No libraries are used.

## Run it

```sh
node serve.ts
```

Then open http://127.0.0.1:8080 in a desktop browser. No build step: `game/` is plain static files.

Controls: mouse to build and select; `1`/`2`/`3` pick a lantern; `Space` starts a wave; `P` pauses; `F` toggles 2× speed; `M` mutes; `Esc` cancels; `R` restarts after the end.

## Layout

- `game/index.html` + `game/styles.css` — page and canvas.
- `game/src/` — one job per file: `game.js` (state and rules), `render.js` (scene), `hud.js` (command panel), `screens.js` (title/help/end), `input.js`, `enemies.js`, `turrets.js`, `projectiles.js`, `waves.js`, `particles.js`, `audio.js`, `path.js`, `config.js`, `random.js`, `storage.js`, `shots.js`, `draw.js`, `main.js`.
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's dossier library.
- `screenshots/` — 4 screenshots taken from the running game (action, title, victory, defeat).
- `shots.json` — the URLs each screenshot was taken from.

## Screenshots

The screenshots were staged with the game's own `?shot=` mode (see `game/src/shots.js`), which arranges a real game state and lets the normal game loop render it — genuine renders of the game's code, unedited.

## License

MIT — see `LICENSE`.
