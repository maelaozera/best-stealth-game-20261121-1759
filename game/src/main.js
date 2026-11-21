// Nightshade Protocol — game state, loop and rules.
// One object holds the whole run: level, player, guards, timers and the
// win/lose state machine. Pure stepping (stepGame) is kept separate from
// the animation loop so scripted tests and screenshot shots can drive it.
import { TILE, LEVELS, PLAYER_SPEED, SNEAK_SPEED, NOISE_RADIUS, DECOY_RADIUS, CATCH_DISTANCE } from './config.js';
import { parseLevel, moveWithCollision, isCover, tileAt } from './world.js';
import { makeGuard, updateGuard, lureGuards } from './guards.js';
import { attachInput, moveVector, isSneaking, consumeClick } from './input.js';
import { render, toWorldX, toWorldY } from './render.js';
import { playFootstep, playPickup, playDecoy, playCaught, playLevelClear, playWin, toggleMute } from './audio.js';

export function newGame() {
  return {
    state: 'title', // title | playing | levelclear | caught | victory
    levelIndex: 0,
    levels: LEVELS,
    world: null,
    guards: [],
    player: null,
    elapsed: 0,
    totalTime: 0,
    decoysLeft: 0,
    time: 0,
    paused: false,
    stepCount: 0,
  };
}

export function loadLevel(game, index) {
  const def = LEVELS[index];
  game.levelIndex = index;
  game.world = parseLevel(def);
  game.guards = def.guards.map((g, i) => makeGuard(g, i));
  game.player = {
    x: game.world.playerStart.x,
    y: game.world.playerStart.y,
    angle: 0,
    sneaking: false,
    hidden: false,
    pings: [],
    stepTimer: 0,
    noiseTimer: 0,
  };
  game.elapsed = 0;
  game.decoysLeft = def.decoys;
  game.state = 'playing';
}

export function startRun(game) {
  game.totalTime = 0;
  loadLevel(game, 0);
}

// One fixed step of the simulation. Returns events the caller may react to.
export function stepGame(game, dt, input) {
  game.time += dt;
  game.stepCount += 1;
  if (game.state !== 'playing') return [];
  game.elapsed += dt;
  const player = game.player;
  const events = [];

  // Movement.
  player.sneaking = input.sneak;
  const speed = player.sneaking ? SNEAK_SPEED : PLAYER_SPEED;
  if (input.mx !== 0 || input.my !== 0) {
    player.angle = Math.atan2(input.my, input.mx);
    moveWithCollision(game.world, player, input.mx * speed * dt, input.my * speed * dt, 13);
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      playFootstep(player.sneaking);
      player.stepTimer = player.sneaking ? 0.55 : 0.34;
    }
    // Running is loud: nearby guards come to look.
    if (!player.sneaking) {
      player.noiseTimer -= dt;
      if (player.noiseTimer <= 0) {
        lureGuards(game.guards, player.x, player.y, NOISE_RADIUS);
        player.noiseTimer = 0.4;
      }
    }
  }
  player.hidden = isCover(game.world, player.x, player.y);

  // Decoy throws.
  if (input.decoy && game.decoysLeft > 0) {
    game.decoysLeft -= 1;
    player.pings.push({ x: input.decoy.x, y: input.decoy.y, t: game.time });
    lureGuards(game.guards, input.decoy.x, input.decoy.y, DECOY_RADIUS);
    playDecoy();
    events.push({ type: 'decoy', x: input.decoy.x, y: input.decoy.y });
  }
  player.pings = player.pings.filter((p) => game.time - p.t < 1.2);

  // Guards see, suspect, chase.
  for (const guard of game.guards) {
    updateGuard(guard, player, game.world, dt, events);
  }
  if (events.some((e) => e.type === 'caught')) {
    game.state = 'caught';
    playCaught();
    return events;
  }

  // Intel pickup.
  for (const item of game.world.intel) {
    if (!item.taken && Math.hypot(player.x - item.x, player.y - item.y) < 26) {
      item.taken = true;
      playPickup();
      events.push({ type: 'intel', taken: game.world.intel.filter((i) => i.taken).length });
    }
  }

  // Exit opens only once every cache is lifted.
  const allIntel = game.world.intel.every((i) => i.taken);
  const exit = game.world.exit;
  if (allIntel && Math.hypot(player.x - exit.x, player.y - exit.y) < 28) {
    game.totalTime += game.elapsed;
    if (game.levelIndex + 1 < LEVELS.length) {
      game.state = 'levelclear';
      playLevelClear();
      events.push({ type: 'levelclear', level: game.levelIndex });
    } else {
      game.state = 'victory';
      playWin();
      events.push({ type: 'victory' });
    }
  }
  return events;
}

function liveInput() {
  const v = moveVector();
  return { mx: v.x, my: v.y, sneak: isSneaking(), decoy: null };
}

// Translate a canvas click into a world-space decoy throw.
function clickToWorld(game, click) {
  if (!click) return null;
  const wx = toWorldX(click.x);
  const wy = toWorldY(click.y);
  if (wx < 0 || wy < 0 || wx > game.world.def.map[0].length * TILE || wy > game.world.def.map.length * TILE) {
    return null;
  }
  return { x: wx, y: wy };
}

export function start(canvas) {
  const ctx = canvas.getContext('2d');
  const game = newGame();
  loadLevel(game, 0);
  game.state = 'title';

  attachInput(canvas, {
    onKey(key) {
      if (key === 'Enter') {
        if (game.state === 'title') startRun(game);
        else if (game.state === 'levelclear') loadLevel(game, game.levelIndex + 1);
      } else if (key === 'r' || key === 'R') {
        if (game.state === 'caught' || game.state === 'victory') startRun(game);
        else if (game.state === 'playing') loadLevel(game, game.levelIndex);
      } else if (key === 'm' || key === 'M') {
        toggleMute();
      } else if (key === 'p' || key === 'P') {
        game.paused = !game.paused;
      }
    },
    onClick() {
      // Clicks during play throw decoys; clicks on overlays start the game.
      if (game.state === 'title') startRun(game);
    },
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!game.paused) {
      const input = liveInput();
      const click = consumeClick();
      if (game.state === 'playing' && click) input.decoy = clickToWorld(game, click);
      stepGame(game, dt, input);
    }
    render(ctx, game, game.time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return game;
}
