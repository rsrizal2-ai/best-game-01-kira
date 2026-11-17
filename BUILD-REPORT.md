# BUILD-REPORT — best-game-01: Lumenhold

- **Game:** Lumenhold — Siege of the Last Lantern. An original night-garden tower defense: raise 3 kinds of lanterns along a winding path, kindle them to level 3, and hold the Last Lantern through 12 waves of shadow moths (5 enemy types, boss at waves 6 and 12) until dawn.
- **Game-code commit:** `29c23d83c756b4cafd96350fe5d2a06653547913` (this report was committed on top; the submittable HEAD is the commit adding this file — see `git log -1` / the coordinator's handoff for its SHA; game files are identical in both).
- **Built:** 2026-11-18 ~03:03–03:35 WITA, in this session only, in `~/workspace/makefun/entries/best-game-01/`. All game code was written fresh in this session by this agent (2,911 lines across game + entrypoint). Nothing was copied from existing open-source entries. The only file brought in from the kit is `vendor/makefun-game.ts`, copied byte-identical (sha256 `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`, matches the kit) because the rules require the kit's dossier library unchanged.
- **Deadline:** entries close 19 Nov 2026 02:00 WITA (2026-11-18T18:00:00Z).

## What was built

- `main.ts` — entrypoint: copies `game/` + `screenshots/` to `$MAKEFUN_OUTPUT_DIR` (or `/output`) and writes `dossier.json` via the kit's `buildDossier`, with the gate's caps.
- `game/index.html`, `game/styles.css` — page + centred 1280×720 canvas.
- `game/src/` (18 files, one job each): `main.js` (boot/loop), `game.js` (state, economy, waves, combat, win/lose), `config.js` (balance/path/palette), `render.js` (garden scene, path, lantern), `hud.js` (command panel), `screens.js` (title/help/pause/victory/defeat), `input.js` (mouse + keyboard), `enemies.js`, `turrets.js`, `projectiles.js`, `waves.js` (12 hand-tuned waves), `particles.js`, `audio.js` (procedural WebAudio SFX + ambient pad, no audio files), `path.js` (grid, waypoints, seeded decorations), `random.js` (seeded RNG), `storage.js` (best score, guarded localStorage), `draw.js` (panel/button helpers), `shots.js` (`?shot=` staging through the game's own classes).
- No libraries, no assets, no network requests: all art is canvas-drawn, all sound synthesised, system fonts only. No `fetch`, no dynamic imports, no workers; every import is a relative `./*.js`.
- `screenshots/` — 4 JPEGs, 1280×720, each ≤ 256 KiB, taken headless from the running game in fresh browser contexts: `1-action.jpg` (wave 7 mid-battle, HUD, selected lantern + range ring — the cover), `2-title.jpg`, `3-victory.jpg`, `4-defeat.jpg`. Staged with the game's own `?shot=` mode (see `shots.json`); unedited renders.
- `serve.ts`, `shots.json`, `README.md`, `LICENSE` (MIT), `.gitignore`.

## Local grade / test evidence

There is **no local grade** for this competition (kit RULES: "There is no local grade of this competition: the server grades every entry"). The entry was instead verified the way the gate checks it, by direct execution:

1. **Syntax:** `node --check` on all 18 `game/src/*.js` — all pass.
2. **Headless play-through (Playwright + Chromium, local only):** title → Begin → build via hotkeys + clicks → start wave → enemies spawn → pause/resume → select/upgrade → forced victory → restart with `R`. Zero page errors, zero console errors.
3. **Balance probe (real play, 2× speed):** a 1-turret build leaked once on wave 1; a 3-turret build cleared wave 2 with no further leaks.
4. **Scripted autoplay (full 12-wave run, near-optimal fixed policy):** victory with 9/20 lives, 393 kills, score 54,000. Earlier tuning runs bracketed this (too easy: 20/20; too hard: defeat on wave 12) — current tuning is the middle setting.
5. **Determinism:** `MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts` and `/tmp/out2` → `diff -r` identical. Both runs OK on Node v24.22.1 (kit needs ≥ 22.18; no Node 22 install needed).
6. **Gate self-checks on `/tmp/out1`:**
   - game/: 22 entries (≤ 993), 96,742 bytes (≤ 48 MiB), no symlinks, `index.html` 824 bytes (≤ 1 MiB).
   - References: grep found no `http:`/`https:`, `fetch`, `XMLHttpRequest`, `WebSocket`, dynamic `import()`, workers, or import maps; all imports relative.
   - Screenshots: 4 files, 1280×720, 75,581–96,212 bytes each (≤ 256 KiB), names valid.
   - `dossier.json`: 567,866 bytes (≤ 1.5 MiB); text 98,048 bytes (< 163,840 cap) with all 20 source files included whole (no left-out marker); 4 images, cover index 0. Total output ~1.0 MB (< 64 MiB / 1,000-entry cap).
   - Screenshots visually inspected: action, title, victory, defeat all readable, HUD/restart visible.

## Known gaps / risks

- **Not server-graded.** The sealed scorer + judge heat run only on submission; validity above is a faithful local simulation of the published gate rules, not the scorer itself.
- **Balance** was tuned against scripted play, not human play-testing. Early waves are gentle; the final wave is tense for a strong build. Casual players may find waves 10–12 hard; defeat is a fair, complete outcome with restart.
- **README badges / About / claim file intentionally left to phase 2:** the README has no make.fun badges (they need the real `{owner}/{repo}`), no `.makefun/owner.json` exists, and the repo has never been pushed. Phase 2 must: create a NEW public repo (never push into any other agent's repo), add badges + GitHub About per the requirements template, add the claim file if needed, bundle this session's transcripts, and submit before the deadline.
- **Audio** needs a user gesture (browser policy) and is fully guarded when unavailable; headless screenshots are silent by design.
- The `?shot=` staging mode ships in the game (same pattern as the kit starter). It only activates with a `?shot=` query; normal loads start at the title screen.

## Phase 2 needs

- Screenshots: already in `screenshots/` (4 files, final). No separate recordings needed.
- Submit the HEAD commit of this repo (game files identical to `29c23d83c756b4cafd96350fe5d2a06653547913` plus this report).
- Transcript bundle must cover THIS session (the build session). Do not bundle other bounties' sessions.
