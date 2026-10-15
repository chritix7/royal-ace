import { getAudio } from "./audio";

/**
 * Musique synthwave années 80 générée en direct : basse, arpège, accords, batterie.
 * Trois ambiances : "calm" (blackjack), "normal" (machine à sous), "bonus" (free spins).
 */
export type MusicMode = "calm" | "normal" | "bonus";

export const BPM: Record<MusicMode, number> = { calm: 82, normal: 104, bonus: 130 };
// La mineur - Fa - Do - Sol (notes MIDI)
export const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [60, 64, 67],
  [55, 59, 62],
];
export const ROOTS = [33, 29, 36, 31];
export const mtof = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

type Bus = NonNullable<ReturnType<typeof getAudio>>;
let timer: number | null = null;
let nextTime = 0;
let step = 0;
let mode: MusicMode = "normal";
let noiseBuf: AudioBuffer | null = null;

function note(a: Bus, type: OscillatorType, freq: number, t: number, dur: number, vol: number, cutoff = 0, detune = 0) {
  const o = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out: AudioNode = o;
  if (cutoff) {
    const f = a.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = cutoff;
    o.connect(f);
    out = f;
  }
  out.connect(g);
  g.connect(a.music);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noiseHit(a: Bus, t: number, dur: number, vol: number, freq: number, type: BiquadFilterType = "highpass") {
  if (!noiseBuf || noiseBuf.sampleRate !== a.ctx.sampleRate) {
    noiseBuf = a.ctx.createBuffer(1, a.ctx.sampleRate, a.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = a.ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = a.ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(a.music);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.02);
}

function kick(a: Bus, t: number) {
  const o = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
  o.connect(g).connect(a.music);
  o.start(t);
  o.stop(t + 0.26);
}

/** Joue le pas `i` (une double-croche) de la mesure en cours. */
export function playStep(a: Bus, t: number, i: number, m: MusicMode) {
  const stepDur = 60 / BPM[m] / 4;
  const bar = Math.floor(i / 16) % 4;
  const s = i % 16;
  const chord = CHORDS[bar];
  const calm = m === "calm";

  if (s === 0) chord.forEach((n, j) => note(a, "sawtooth", mtof(n), t, stepDur * 15.5, calm ? 0.05 : 0.032, 900, (j - 1) * 7));
  if (calm ? s % 8 === 0 : s % 2 === 0) {
    note(a, "sawtooth", mtof(ROOTS[bar]) * (!calm && s % 4 === 2 ? 2 : 1), t, stepDur * (calm ? 7 : 1.7), 0.15, 420);
  }
  if (!calm) {
    const idx = [0, 1, 2, 1][s % 4];
    note(a, "square", mtof(chord[idx] + (s % 8 >= 4 ? 24 : 12)), t, stepDur * 0.9, 0.03, 2600);
    if (m === "bonus" && s % 2 === 1) note(a, "triangle", mtof(chord[(s + 1) % 3] + 24), t, stepDur * 0.8, 0.04);
    if (s % 4 === 0 || (m === "bonus" && s === 10)) kick(a, t);
    if (s === 4 || s === 12) {
      noiseHit(a, t, 0.16, 0.35, 1800, "bandpass");
      note(a, "triangle", 190, t, 0.1, 0.12);
    }
    if (m === "bonus" || s % 2 === 0) noiseHit(a, t, s % 4 === 2 ? 0.1 : 0.04, 0.12, 7000);
  }
}

function tick() {
  const a = getAudio();
  if (!a) return;
  const stepDur = 60 / BPM[mode] / 4;
  while (nextTime < a.ctx.currentTime + 0.16) {
    playStep(a, nextTime, step, mode);
    nextTime += stepDur;
    step++;
  }
}

export const music = {
  start() {
    if (timer !== null) return;
    const a = getAudio();
    if (!a) return;
    nextTime = a.ctx.currentTime + 0.06;
    step = 0;
    timer = window.setInterval(tick, 30);
  },
  stop() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  },
  setMode(m: MusicMode) {
    mode = m;
  },
  isRunning: () => timer !== null,
  /** Baisse la musique un instant (pour laisser la place à un gros gain). */
  duck(ms: number) {
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime;
    a.duck.gain.cancelScheduledValues(t);
    a.duck.gain.setTargetAtTime(0.3, t, 0.05);
    a.duck.gain.setTargetAtTime(1, t + ms / 1000, 0.4);
  },
};