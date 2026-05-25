// Web Audio API sound effects - no external files needed
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playDiceRoll() {
  // Rapid clicking sounds
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      playTone(800 + Math.random() * 1200, 0.05, 'square', 0.08);
    }, i * 40);
  }
  // Final settle
  setTimeout(() => playTone(200, 0.15, 'triangle', 0.12), 350);
}

export function playLadder() {
  // Ascending happy tones
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.15), i * 100);
  });
}

export function playSnake() {
  // Descending slide
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

export function playWin() {
  // Victory fanfare
  const melody = [
    { freq: 523, time: 0 },
    { freq: 659, time: 0.12 },
    { freq: 784, time: 0.24 },
    { freq: 1047, time: 0.36 },
    { freq: 784, time: 0.55 },
    { freq: 1047, time: 0.7 }
  ];
  melody.forEach(({ freq, time }) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.18), time * 1000);
  });
}

export function playTokenMove() {
  playTone(440, 0.08, 'sine', 0.1);
}

export function playTurnNotification() {
  playTone(880, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 120);
}

export function playButtonClick() {
  playTone(600, 0.05, 'square', 0.06);
}
