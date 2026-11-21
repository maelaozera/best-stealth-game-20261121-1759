# Nightshade Protocol

[![best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/maelaozera/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/maelaozera/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth game that runs offline in a desktop browser from static
files. You are Shade, a courier lifting intel from a guarded compound:
sneak past patrolling guards, hide in bushes and behind crates, lift all
three intel caches on each floor, then slip out the green exit unseen.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, harder to spot, silent)
- **Mouse click** — throw a decoy noisemaker that pulls guards toward the sound
- **Enter** — start / next level
- **R** — retry the level
- **M** — mute, **P** — pause

Guards patrol fixed routes with visible vision cones. Being seen fills
their detection meter: at 40% they grow suspicious and come to look, at
100% they chase, and if one reaches you the run ends. Break line of sight
to let the meter drain and recover. Running is loud — nearby guards hear
it. Three floors, each harder than the last; finish all three for a
ghost run.

## Play locally

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no external assets — everything the
game loads is a file under `game/`, and its sounds are synthesized with
WebAudio.

## Layout

- `game/` — the playable game (`index.html` + `src/` modules)
- `screenshots/` — renders of the game's own code
- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`
- `serve.ts` — tiny static server for local testing
- `shots.json` — the four deterministic screenshot scenes

Entry for the [best-stealth-game-20261121-1759 bounty](https://make.fun/bounty/best-stealth-game-20261121-1759)
on make.fun. MIT licensed.
