// Nightshade Protocol — level parsing, collision and line of sight.
// The grid is the single source of truth: walls block movement and vision,
// bushes and crates are cover the player can hide in.
import { TILE, COLS, ROWS } from './config.js';

// Parse one level definition into a playable world.
export function parseLevel(def) {
  const walls = new Set();
  const bushes = new Set();
  const crates = new Set();
  let playerStart = null;
  let exit = null;
  const intel = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const ch = def.map[y][x];
      const key = `${x},${y}`;
      if (ch === '#') walls.add(key);
      else if (ch === 'B') bushes.add(key);
      else if (ch === 'C') crates.add(key);
      else if (ch === 'P') playerStart = tileCenter(x, y);
      else if (ch === 'E') exit = { tx: x, ty: y, x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
      else if (ch === 'I') intel.push({ tx: x, ty: y, x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, taken: false });
    }
  }
  return { def, walls, bushes, crates, playerStart, exit, intel };
}

export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export function tileAt(world, px, py) {
  return { tx: Math.floor(px / TILE), ty: Math.floor(py / TILE) };
}

export function isWall(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return world.walls.has(`${tx},${ty}`);
}

export function isCover(world, px, py) {
  const { tx, ty } = tileAt(world, px, py);
  return world.bushes.has(`${tx},${ty}`) || world.crates.has(`${tx},${ty}`);
}

// Circle-versus-wall collision: slide along walls instead of sticking.
export function moveWithCollision(world, pos, dx, dy, radius) {
  const next = { x: pos.x + dx, y: pos.y + dy };
  if (!hitsWall(world, next.x, pos.y, radius)) pos.x = next.x;
  if (!hitsWall(world, pos.x, next.y, radius)) pos.y = next.y;
  pos.x = Math.max(radius, Math.min(COLS * TILE - radius, pos.x));
  pos.y = Math.max(radius, Math.min(ROWS * TILE - radius, pos.y));
  return pos;
}

export function hitsWall(world, px, py, radius) {
  const corners = [
    [px - radius, py - radius],
    [px + radius, py - radius],
    [px - radius, py + radius],
    [px + radius, py + radius],
  ];
  return corners.some(([cx, cy]) => {
    const { tx, ty } = tileAt(world, cx, cy);
    return isWall(world, tx, ty);
  });
}

// Straight-line sight between two points, sampled finely enough to catch
// a single wall tile. Crates block sight; bushes do not (you can see
// through leaves, but a guard cannot spot you hiding inside one).
export function hasLineOfSight(world, ax, ay, bx, by) {
  const dist = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    const { tx, ty } = tileAt(world, x, y);
    if (isWall(world, tx, ty)) return false;
    if (world.crates.has(`${tx},${ty}`)) return false;
  }
  return true;
}
