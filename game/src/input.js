// Nightshade Protocol — keyboard and mouse input.
// WASD or arrows move, Shift sneaks, mouse click throws a decoy,
// Enter starts, R restarts, M mutes. Scripted tests drive this same state.
export const keys = new Set();
export const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

export function attachInput(canvas, hooks) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    if (hooks.onKey) hooks.onKey(event.key);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  });
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.clickX = event.clientX - rect.left;
    mouse.clickY = event.clientY - rect.top;
    mouse.clicked = true;
    if (hooks.onClick) hooks.onClick(mouse.clickX, mouse.clickY);
  });
  window.addEventListener('blur', () => keys.clear());
}

export function moveVector() {
  let x = 0;
  let y = 0;
  if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('d') || keys.has('ArrowRight')) x += 1;
  if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('s') || keys.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    const len = Math.hypot(x, y);
    x /= len;
    y /= len;
  }
  return { x, y };
}

export function isSneaking() {
  return keys.has('Shift');
}

export function consumeClick() {
  if (!mouse.clicked) return null;
  mouse.clicked = false;
  return { x: mouse.clickX, y: mouse.clickY };
}
