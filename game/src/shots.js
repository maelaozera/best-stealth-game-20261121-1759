// Nightshade Protocol — deterministic screenshot scenes.
// ?shot=start|play|level|end&seed=1 stages a fixed frame with the real
// renderer and then freezes it: the same seed always shows the same
// frame. Positions are set directly (no simulation steps), so a shot can
// never drift into a caught or cleared state.
import { loadLevel } from './main.js';
import { tileCenter } from './world.js';

function placeGuard(game, index, tx, ty, angle, meter, state) {
  const guard = game.guards[index];
  const spot = tileCenter(tx, ty);
  guard.x = spot.x;
  guard.y = spot.y;
  guard.angle = angle;
  guard.meter = meter;
  guard.state = state;
  guard.waypoint = 1;
  guard.wait = 0;
}

export function applyShot(game, params) {
  const shot = params.get('shot') || 'start';
  if (shot === 'start') {
    loadLevel(game, 0);
    game.state = 'title';
  } else if (shot === 'play') {
    // Level 1 mid-action: the player sneaks along an open lane while the
    // nearest guard, already suspicious, sweeps its cone across the lane.
    loadLevel(game, 0);
    const p = game.player;
    const spot = tileCenter(11, 8);
    p.x = spot.x;
    p.y = spot.y;
    p.sneaking = true;
    p.angle = Math.PI;
    placeGuard(game, 0, 8, 8, 0, 55, 'suspicious');
    placeGuard(game, 1, 18, 9, -Math.PI / 2, 0, 'patrol');
    game.world.intel[0].taken = true;
  } else if (shot === 'level') {
    // Level 2: three guards on patrol, cones fanning across the vault floor.
    loadLevel(game, 1);
    const p = game.player;
    const spot = tileCenter(6, 9);
    p.x = spot.x;
    p.y = spot.y;
    p.sneaking = true;
    p.angle = 0;
    placeGuard(game, 0, 5, 7, 0, 0, 'patrol');
    placeGuard(game, 1, 18, 6, Math.PI / 2, 18, 'patrol');
    placeGuard(game, 2, 10, 10, Math.PI, 0, 'patrol');
    game.world.intel[0].taken = true;
  } else if (shot === 'end') {
    loadLevel(game, 2);
    game.state = 'victory';
    game.totalTime = 274;
  }
  game.paused = true;
  return shot;
}
