// Nightshade Protocol — all canvas drawing: the level, vision cones,
// HUD, minimap and the title / win / caught screens.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, VISION_RANGE, VISION_HALF_ANGLE } from './config.js';
import { tileAt } from './world.js';

export const ORIGIN_X = (VIEW_W - COLS * TILE) / 2;
export const ORIGIN_Y = 64;

export function toWorldX(screenX) {
  return screenX - ORIGIN_X;
}

export function toWorldY(screenY) {
  return screenY - ORIGIN_Y;
}

function coneColor(guard) {
  if (guard.state === 'chase') return 'rgba(255, 64, 64, 0.34)';
  if (guard.state === 'suspicious') return 'rgba(255, 170, 40, 0.30)';
  return 'rgba(255, 230, 110, 0.24)';
}

// Vision cone: a clean wedge in the guard's facing direction, coloured by
// alert state. What the guard can actually see is decided separately by
// line of sight; the wedge shows the direction and reach at a glance.
function drawCone(ctx, guard) {
  const range = guard.state === 'chase' ? VISION_RANGE + 30 : VISION_RANGE;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.angle - VISION_HALF_ANGLE, guard.angle + VISION_HALF_ANGLE);
  ctx.closePath();
  ctx.fillStyle = coneColor(guard);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 240, 160, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFloor(ctx, world, time) {
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const x = tx * TILE;
      const y = ty * TILE;
      const key = `${tx},${ty}`;
      if (world.walls.has(key)) {
        ctx.fillStyle = '#232833';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#313947';
        ctx.fillRect(x, y, TILE, 5);
        ctx.strokeStyle = '#171b24';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      } else {
        const shade = (tx + ty) % 2 === 0 ? '#2b3040' : '#292e3d';
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, TILE, TILE);
        if (world.bushes.has(key)) {
          ctx.fillStyle = '#1d3a24';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#2c5a35';
          for (const [ox, oy, r] of [[10, 12, 9], [26, 10, 10], [18, 26, 9], [30, 28, 7]]) {
            ctx.beginPath();
            ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#3f7a4a';
          ctx.beginPath();
          ctx.arc(x + 18, y + 16, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (world.crates.has(key)) {
          ctx.fillStyle = '#6b4a26';
          ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
          ctx.strokeStyle = '#4a3016';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + TILE - 4, y + TILE - 4);
          ctx.moveTo(x + TILE - 4, y + 4);
          ctx.lineTo(x + 4, y + TILE - 4);
          ctx.stroke();
        }
      }
    }
  }
  // Exit door: a green glowing doorway with an arrow.
  const e = world.exit;
  const pulse = 0.55 + 0.25 * Math.sin(time * 3);
  ctx.save();
  ctx.shadowColor = '#39d98a';
  ctx.shadowBlur = 18 * pulse;
  ctx.fillStyle = '#1f7a4d';
  ctx.fillRect(e.x - 17, e.y - 17, 34, 34);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#39d98a';
  ctx.fillRect(e.x - 12, e.y - 12, 24, 24);
  ctx.fillStyle = '#06281a';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('➜', e.x, e.y + 1);
  ctx.restore();
  ctx.fillStyle = '#39d98a';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('EXIT', e.x, e.y + 20);
}

function drawIntel(ctx, world, time) {
  for (const item of world.intel) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.4 + item.tx) * 3;
    const glow = 0.6 + 0.4 * Math.sin(time * 4 + item.tx * 2);
    ctx.save();
    ctx.shadowColor = '#4dd8ff';
    ctx.shadowBlur = 14 * glow;
    ctx.fillStyle = '#4dd8ff';
    ctx.translate(item.x, item.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-8, -8, 16, 16);
    ctx.restore();
    ctx.fillStyle = '#0a2a3a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('i', item.x, item.y + bob);
  }
}

function drawGuard(ctx, guard) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = guard.state === 'chase' ? '#ff3b30' : guard.state === 'suspicious' ? '#ff9500' : '#c22e2e';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd9d9';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Facing tick and helmet brim.
  ctx.rotate(guard.angle);
  ctx.fillStyle = '#ffd9d9';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(6, -6);
  ctx.lineTo(6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Detection meter above the guard.
  if (guard.meter > 4) {
    const w = 34;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(guard.x - w / 2, guard.y - 30, w, 6);
    ctx.fillStyle = guard.meter >= 100 ? '#ff3b30' : guard.meter >= 40 ? '#ff9500' : '#ffe06e';
    ctx.fillRect(guard.x - w / 2, guard.y - 30, (w * guard.meter) / 100, 6);
  }
  // "!" when chasing, "?" when suspicious.
  if (guard.state === 'chase' || guard.state === 'suspicious') {
    ctx.fillStyle = guard.state === 'chase' ? '#ff3b30' : '#ff9500';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(guard.state === 'chase' ? '!' : '?', guard.x, guard.y - 32);
  }
}

function drawPlayer(ctx, player, time) {
  const hidden = player.hidden;
  ctx.save();
  ctx.globalAlpha = hidden ? 0.65 : 1;
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#35c4ff';
  ctx.beginPath();
  ctx.arc(0, 0, player.sneaking ? 11 : 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dff6ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.rotate(player.angle);
  ctx.fillStyle = '#dff6ff';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(5, -5);
  ctx.lineTo(5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (player.sneaking) {
    ctx.fillStyle = '#9fd8ef';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y + 26);
  }
  // Decoy pings ripple outward.
  for (const ping of player.pings) {
    const age = time - ping.t;
    if (age < 0 || age > 1.2) continue;
    ctx.strokeStyle = `rgba(255, 214, 90, ${1 - age / 1.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ping.x, ping.y, 10 + age * 90, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, game) {
  const level = game.levels[game.levelIndex];
  ctx.fillStyle = '#12151d';
  ctx.fillRect(0, 0, VIEW_W, 52);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`NIGHTSHADE PROTOCOL — ${level.name}`, 16, 27);
  // Intel pips.
  const total = game.world.intel.length;
  const got = game.world.intel.filter((i) => i.taken).length;
  for (let i = 0; i < total; i += 1) {
    ctx.fillStyle = i < got ? '#4dd8ff' : '#3a4152';
    ctx.save();
    ctx.translate(560 + i * 26, 26);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
  ctx.fillStyle = '#9aa3b5';
  ctx.font = '14px sans-serif';
  ctx.fillText(`INTEL ${got}/${total}`, 640, 27);
  // Timer and decoys.
  ctx.fillStyle = '#e8ecf4';
  ctx.fillText(`⏱ ${formatTime(game.elapsed)}`, 800, 27);
  ctx.fillStyle = '#ffd65a';
  ctx.fillText(`◉ decoys ${game.decoysLeft}`, 920, 27);
  // Worst detection meter.
  const worst = Math.max(0, ...game.guards.map((g) => g.meter));
  ctx.fillStyle = '#3a4152';
  ctx.fillRect(1060, 18, 150, 16);
  ctx.fillStyle = worst >= 100 ? '#ff3b30' : worst >= 40 ? '#ff9500' : '#39d98a';
  ctx.fillRect(1060, 18, (150 * worst) / 100, 16);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(worst >= 100 ? 'SPOTTED' : worst >= 40 ? 'SUSPICIOUS' : 'UNSEEN', 1135, 26);
  ctx.textAlign = 'left';
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawMinimap(ctx, game) {
  const scale = 0.13;
  const w = COLS * TILE * scale;
  const h = ROWS * TILE * scale;
  const mx = VIEW_W - w - 14;
  const my = 64;
  ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
  ctx.fillRect(mx - 5, my - 5, w + 10, h + 10);
  ctx.strokeStyle = '#4a5265';
  ctx.strokeRect(mx - 5.5, my - 5.5, w + 11, h + 11);
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      if (game.world.walls.has(`${tx},${ty}`)) {
        ctx.fillStyle = '#5a6376';
        ctx.fillRect(mx + tx * TILE * scale, my + ty * TILE * scale, TILE * scale, TILE * scale);
      }
    }
  }
  ctx.fillStyle = '#39d98a';
  ctx.fillRect(mx + game.world.exit.tx * TILE * scale, my + game.world.exit.ty * TILE * scale, TILE * scale, TILE * scale);
  for (const item of game.world.intel) {
    if (item.taken) continue;
    ctx.fillStyle = '#4dd8ff';
    ctx.fillRect(mx + item.tx * TILE * scale + 1, my + item.ty * TILE * scale + 1, 3, 3);
  }
  for (const guard of game.guards) {
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(mx + guard.x * scale, my + guard.y * scale, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#35c4ff';
  ctx.beginPath();
  ctx.arc(mx + game.player.x * scale, my + game.player.y * scale, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9aa3b5';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MAP', mx, my - 9);
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 10, 16, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 90);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '18px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 30 + i * 30);
  });
}

export function render(ctx, game, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#12151d';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(ORIGIN_X, ORIGIN_Y);
  drawFloor(ctx, game.world, time);
  for (const guard of game.guards) drawCone(ctx, guard);
  drawIntel(ctx, game.world, time);
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, game.player, time);
  ctx.restore();
  drawHud(ctx, game);
  drawMinimap(ctx, game);

  if (game.state === 'title') {
    drawOverlay(ctx, 'NIGHTSHADE PROTOCOL', [
      'You are Shade, a courier lifting intel from a guarded compound.',
      'Collect 3 intel caches, then reach the green EXIT unseen.',
      'WASD / arrows — move    SHIFT — sneak (slower, harder to spot)',
      'Click — throw a decoy noisemaker    Hide in bushes and behind crates',
      'Guards patrol, grow suspicious, then chase. Break line of sight to recover.',
      '',
      'Press ENTER to begin — Level 1: The Archive Wing',
    ], '#35c4ff');
  } else if (game.state === 'levelclear') {
    drawOverlay(ctx, 'LEVEL CLEAR', [
      `${game.levels[game.levelIndex].name} — unseen, intel secured.`,
      `Time ${formatTime(game.elapsed)} — decoys left: ${game.decoysLeft}`,
      '',
      'Press ENTER for the next level',
    ], '#39d98a');
  } else if (game.state === 'caught') {
    drawOverlay(ctx, 'SPOTTED!', [
      'A guard caught you in the open. The run ends here.',
      `You had ${game.world.intel.filter((i) => i.taken).length} of ${game.world.intel.length} intel on ${game.levels[game.levelIndex].name}.`,
      '',
      'Press R to try the level again',
    ], '#ff3b30');
  } else if (game.state === 'victory') {
    drawOverlay(ctx, 'GHOST RUN COMPLETE', [
      'All three floors cleared. Not a single guard raised the alarm.',
      `Total time ${formatTime(game.totalTime)} — the compound never knew you were there.`,
      '',
      'Press R to run it again',
    ], '#39d98a');
  }
}
