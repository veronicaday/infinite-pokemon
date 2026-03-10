/**
 * Synthesized sound effects using Web Audio API.
 * No audio files needed — all sounds are generated programmatically.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

// --- Low-level helpers ---

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.15,
  startTime?: number,
) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startTime ?? c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, (startTime ?? c.currentTime) + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(startTime);
  osc.stop((startTime ?? c.currentTime) + duration);
}

function playNoise(duration: number, volume = 0.1, startTime?: number) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const gain = c.createGain();
  const t = startTime ?? c.currentTime;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.connect(gain);
  gain.connect(c.destination);
  source.start(t);
}

// --- Sound effects ---

/** Short UI click / blip */
export function sfxClick() {
  playTone(800, 0.06, 'square', 0.08);
}

/** Button hover — very subtle */
export function sfxHover() {
  playTone(600, 0.03, 'sine', 0.04);
}

/** Move selected — confirmation beep */
export function sfxSelect() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(440, 0.08, 'square', 0.1, t);
  playTone(660, 0.1, 'square', 0.1, t + 0.07);
}

/** Physical hit — noise burst + low thud */
export function sfxHit() {
  const c = getCtx();
  const t = c.currentTime;
  playNoise(0.12, 0.15, t);
  playTone(120, 0.15, 'sine', 0.2, t);
}

/** Special/ranged hit — higher, more tonal */
export function sfxSpecialHit() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(600, 0.08, 'sawtooth', 0.1, t);
  playTone(900, 0.1, 'sine', 0.08, t + 0.05);
  playNoise(0.08, 0.06, t + 0.02);
}

/** Super effective — rising triumphant tone */
export function sfxSuperEffective() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(523, 0.12, 'square', 0.1, t);
  playTone(659, 0.12, 'square', 0.1, t + 0.1);
  playTone(784, 0.18, 'square', 0.12, t + 0.2);
}

/** Not very effective — descending dull tone */
export function sfxNotEffective() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(400, 0.15, 'triangle', 0.08, t);
  playTone(300, 0.2, 'triangle', 0.06, t + 0.12);
}

/** Miss — whiff sound */
export function sfxMiss() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(500, 0.1, 'sine', 0.06, t);
  playTone(350, 0.15, 'sine', 0.04, t + 0.08);
}

/** Creature faint — falling tone */
export function sfxFaint() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(600, 0.15, 'square', 0.1, t);
  playTone(450, 0.15, 'square', 0.08, t + 0.12);
  playTone(300, 0.2, 'square', 0.06, t + 0.24);
  playTone(150, 0.3, 'square', 0.05, t + 0.36);
}

/** Victory fanfare */
export function sfxVictory() {
  const c = getCtx();
  const t = c.currentTime;
  // Short triumphant melody
  const notes = [523, 523, 523, 659, 784, 659, 784, 1047];
  const durations = [0.1, 0.1, 0.1, 0.15, 0.1, 0.1, 0.15, 0.35];
  let offset = 0;
  for (let i = 0; i < notes.length; i++) {
    playTone(notes[i], durations[i] + 0.05, 'square', 0.1, t + offset);
    offset += durations[i];
  }
}

/** VS screen clash — dramatic impact */
export function sfxVsClash() {
  const c = getCtx();
  const t = c.currentTime;
  playNoise(0.3, 0.2, t);
  playTone(80, 0.4, 'sawtooth', 0.15, t);
  playTone(200, 0.2, 'square', 0.1, t + 0.1);
}

/** Turn gate ready — chime */
export function sfxReady() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(880, 0.1, 'sine', 0.1, t);
  playTone(1100, 0.15, 'sine', 0.1, t + 0.1);
}

/** Generation complete — sparkle */
export function sfxGenComplete() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(1200, 0.08, 'sine', 0.06, t);
  playTone(1500, 0.08, 'sine', 0.06, t + 0.08);
  playTone(1800, 0.08, 'sine', 0.06, t + 0.16);
  playTone(2400, 0.15, 'sine', 0.08, t + 0.24);
}

/** Evolution — ascending magical scale */
export function sfxEvolve() {
  const c = getCtx();
  const t = c.currentTime;
  const notes = [440, 494, 554, 622, 698, 784, 880, 988, 1109, 1245];
  for (let i = 0; i < notes.length; i++) {
    playTone(notes[i], 0.2, 'sine', 0.06 + i * 0.005, t + i * 0.12);
  }
}

/** Status effect applied (burn, poison, etc.) — eerie warble */
export function sfxStatus() {
  const c = getCtx();
  const t = c.currentTime;
  playTone(300, 0.15, 'sawtooth', 0.06, t);
  playTone(350, 0.15, 'sawtooth', 0.06, t + 0.1);
  playTone(280, 0.2, 'sawtooth', 0.05, t + 0.2);
}
