// Nightshade Protocol — guards: patrols, vision cones, suspicion.
// A guard cycles patrol -> suspicious -> chase. Its detection meter fills
// while it can see the player and drains when it cannot, so a near miss
// gives the player a chance to break line of sight and recover.
import { TILE, GUARD_CHASE_SPEED, VISION_RANGE, VISION_HALF_ANGLE, SNEAK_VISION_RANGE, CATCH_DISTANCE, HIDE_DISTANCE } from './config.js';
import { tileCenter, hasLineOfSight, isCover, moveWithCollision } from './world.js';
import { playAlert, playSuspicious } from './audio.js';

export function makeGuard(def, index) {
  const first = tileCenter(def.path[0][0], def.path[0][1]);
  const second = tileCenter(def.path[1][0], def.path[1][1]);
  return {
    index,
    x: first.x,
    y: first.y,
    angle: Math.atan2(second.y - first.y, second.x - first.x),
    path: def.path.map(([tx, ty]) => tileCenter(tx, ty)),
    waypoint: 1,
    wait: 0,
    speed: def.speed,
    state: 'patrol', // patrol | suspicious | chase
    meter: 0,
    lastSeen: null,
    lostSight: 0,
    lookTimer: 0,
  };
}

// Can this guard see the player right now? Range, cone angle, line of
// sight, and cover all matter; sneaking halves the range.
export function guardSeesPlayer(guard, player, world) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = player.sneaking ? SNEAK_VISION_RANGE : VISION_RANGE;
  if (dist > range) return { seen: false, dist };
  if (dist > HIDE_DISTANCE && isCover(world, player.x, player.y)) {
    return { seen: false, dist, hidden: true };
  }
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > VISION_HALF_ANGLE && dist > 46) return { seen: false, dist };
  if (!hasLineOfSight(world, guard.x, guard.y, player.x, player.y)) return { seen: false, dist };
  return { seen: true, dist };
}

function walkToward(guard, tx, ty, dt, speed) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const step = Math.min(dist, speed * dt);
  guard.angle = Math.atan2(dy, dx);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  return dist - step < 4;
}

export function updateGuard(guard, player, world, dt, events) {
  const sight = guardSeesPlayer(guard, player, world);
  const prevState = guard.state;

  if (sight.seen) {
    // Closer and standing still in the open fills the meter faster.
    const closeness = 1 + Math.max(0, (VISION_RANGE - sight.dist) / VISION_RANGE);
    guard.meter = Math.min(100, guard.meter + 62 * closeness * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.lostSight = 0;
    if (guard.meter >= 100 && guard.state !== 'chase') {
      guard.state = 'chase';
      events.push({ type: 'alert', guard: guard.index });
      playAlert();
    } else if (guard.meter >= 40 && guard.state === 'patrol') {
      guard.state = 'suspicious';
      events.push({ type: 'suspicious', guard: guard.index });
      playSuspicious();
    }
  } else {
    guard.meter = Math.max(0, guard.meter - 26 * dt);
    if (guard.state === 'chase') {
      guard.lostSight += dt;
      if (guard.lostSight > 3) {
        guard.state = 'suspicious';
        guard.lookTimer = 2.2;
      }
    } else if (guard.state === 'suspicious' && guard.meter < 8) {
      guard.state = 'patrol';
    }
  }

  if (guard.state === 'patrol') {
    if (guard.wait > 0) {
      guard.wait -= dt;
      guard.angle += dt * 0.9; // glance around while waiting
    } else {
      const target = guard.path[guard.waypoint];
      if (walkToward(guard, target.x, target.y, dt, guard.speed)) {
        guard.waypoint = (guard.waypoint + 1) % guard.path.length;
        guard.wait = 1.0;
      }
    }
  } else if (guard.state === 'suspicious') {
    if (guard.lastSeen) {
      const arrived = walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, dt, guard.speed * 1.25);
      if (arrived) {
        guard.lookTimer -= dt;
        guard.angle += dt * 1.6;
        if (guard.lookTimer <= 0) {
          guard.lastSeen = null;
          guard.state = 'patrol';
        }
      }
    } else {
      guard.state = 'patrol';
    }
  } else if (guard.state === 'chase') {
    walkToward(guard, player.x, player.y, dt, GUARD_CHASE_SPEED);
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < CATCH_DISTANCE) {
      events.push({ type: 'caught', guard: guard.index });
    }
  }

  if (prevState !== guard.state) {
    guard.stateChanged = true;
  }
  return sight;
}

// A noise ping (footsteps while running, or a thrown decoy) pulls every
// guard in range toward the sound to investigate.
export function lureGuards(guards, x, y, radius) {
  for (const guard of guards) {
    if (Math.hypot(guard.x - x, guard.y - y) > radius) continue;
    if (guard.state === 'chase') continue;
    guard.state = 'suspicious';
    guard.lastSeen = { x, y };
    guard.lookTimer = 2.5;
    guard.meter = Math.max(guard.meter, 30);
  }
}

// Deterministic pseudo-random helper for cosmetic flicker (fixed seed).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
