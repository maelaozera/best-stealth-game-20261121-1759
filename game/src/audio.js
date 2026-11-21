// Nightshade Protocol — tiny synthesized sounds, no audio files.
// Every sound is a short WebAudio oscillator envelope, created lazily on
// the first user gesture so headless and muted runs stay silent.
let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audioContext() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    const t0 = ac.currentTime + when;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Audio is decoration; a failure must never break the game.
  }
}

export function playFootstep(sneaking) {
  tone(sneaking ? 140 : 190, 0.06, 'sine', sneaking ? 0.02 : 0.045);
}

export function playPickup() {
  tone(660, 0.12, 'sine', 0.09);
  tone(990, 0.18, 'sine', 0.09, 0.09);
}

export function playAlert() {
  tone(220, 0.28, 'sawtooth', 0.07, 0, 440);
}

export function playSuspicious() {
  tone(330, 0.16, 'triangle', 0.06, 0, 260);
}

export function playDecoy() {
  tone(520, 0.1, 'square', 0.04);
  tone(780, 0.14, 'square', 0.04, 0.1);
}

export function playCaught() {
  tone(180, 0.5, 'sawtooth', 0.09, 0, 60);
  tone(90, 0.6, 'square', 0.06, 0.12, 45);
}

export function playLevelClear() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.08, i * 0.11));
}

export function playWin() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, i * 0.13));
}
