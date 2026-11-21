// Nightshade Protocol — headless self-test.
// ?selftest=1 drives the real simulation through scripted moves and
// writes PASS/FAIL into document.title and the console, so a headless
// browser run can prove the win path and the lose path both work.
import { newGame, loadLevel, stepGame } from './main.js';
import { tileCenter } from './world.js';

function idle() {
  return { mx: 0, my: 0, sneak: false, decoy: null };
}

function teleportTo(game, tx, ty) {
  const spot = tileCenter(tx, ty);
  game.player.x = spot.x;
  game.player.y = spot.y;
}

export function runSelfTest() {
  const results = {};
  const log = (name, ok, detail) => {
    results[name] = ok ? 'PASS' : `FAIL (${detail})`;
    console.log(`[selftest] ${name}: ${results[name]}`);
  };

  try {
    // Win path: lift every cache, then step onto the exit.
    const winGame = newGame();
    loadLevel(winGame, 0);
    for (const item of winGame.world.intel) {
      teleportTo(winGame, item.tx, item.ty);
      stepGame(winGame, 1 / 60, idle());
    }
    const gotAll = winGame.world.intel.every((i) => i.taken);
    teleportTo(winGame, winGame.world.exit.tx, winGame.world.exit.ty);
    stepGame(winGame, 1 / 60, idle());
    log('win-path', gotAll && winGame.state === 'levelclear', `intel=${gotAll} state=${winGame.state}`);

    // Exit stays shut while caches remain.
    const lockedGame = newGame();
    loadLevel(lockedGame, 0);
    teleportTo(lockedGame, lockedGame.world.exit.tx, lockedGame.world.exit.ty);
    stepGame(lockedGame, 1 / 60, idle());
    log('exit-locked', lockedGame.state === 'playing', `state=${lockedGame.state}`);

    // Lose path: stand in the open inside a guard's cone until spotted.
    // Close enough that nearby cover cannot hide the player.
    const loseGame = newGame();
    loadLevel(loseGame, 0);
    const guard = loseGame.guards[0];
    const ahead = {
      x: guard.x + Math.cos(guard.angle) * 50,
      y: guard.y + Math.sin(guard.angle) * 50,
    };
    loseGame.player.x = ahead.x;
    loseGame.player.y = ahead.y;
    let caught = false;
    for (let i = 0; i < 60 * 6 && !caught; i += 1) {
      const events = stepGame(loseGame, 1 / 60, idle());
      if (events.some((e) => e.type === 'caught')) caught = true;
      // While the guard only suspects, keep the player in view; once it
      // gives chase, stand still so it can close in and catch the player.
      if (!caught && loseGame.guards[0].state !== 'chase') {
        loseGame.player.x = loseGame.guards[0].x + Math.cos(loseGame.guards[0].angle) * 50;
        loseGame.player.y = loseGame.guards[0].y + Math.sin(loseGame.guards[0].angle) * 50;
      }
    }
    log('lose-path', caught && loseGame.state === 'caught', `caught=${caught} state=${loseGame.state}`);

    // Cover hides: a player in a bush, far from the guard, stays unseen.
    const hideGame = newGame();
    loadLevel(hideGame, 0);
    const bush = [...hideGame.world.bushes][0].split(',').map(Number);
    teleportTo(hideGame, bush[0], bush[1]);
    let maxMeter = 0;
    for (let i = 0; i < 60 * 4; i += 1) {
      stepGame(hideGame, 1 / 60, idle());
      maxMeter = Math.max(maxMeter, ...hideGame.guards.map((g) => g.meter));
    }
    log('cover-hides', maxMeter < 40, `maxMeter=${maxMeter.toFixed(1)}`);

    // Movement is blocked by walls.
    const wallGame = newGame();
    loadLevel(wallGame, 0);
    const startX = wallGame.player.x;
    for (let i = 0; i < 60; i += 1) {
      stepGame(wallGame, 1 / 60, { mx: -1, my: 0, sneak: false, decoy: null });
    }
    log('wall-blocks', wallGame.player.x > startX - 60, `moved=${(wallGame.player.x - startX).toFixed(1)}`);
  } catch (err) {
    log('exception', false, String(err && err.message ? err.message : err));
  }

  const allPass = Object.values(results).every((v) => v === 'PASS');
  const summary = `SELFTEST ${allPass ? 'PASS' : 'FAIL'} ${JSON.stringify(results)}`;
  document.title = summary;
  console.log(`[selftest] ${summary}`);
  return { allPass, results };
}
