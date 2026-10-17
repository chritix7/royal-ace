// Sons synthétisés avec l'API WebAudio : aucun fichier audio à ajouter au projet.

import { audio, getAudio } from "./audio";

/** Compatibilité : les réglages du son sont maintenant globaux (voir audio.ts). */
export function setMuted(value: boolean) {
  audio.set({ sfx: !value });
}
export const isMuted = () => !audio.get().sfx;

function ac() {
  if (!audio.get().sfx) return null;
  return getAudio();
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12, delay = 0, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const t = a.ctx.currentTime + delay;
  const osc = a.ctx.createOscillator();
  const gain = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.sfx);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, vol: number, highpass: number, delay = 0) {
  const a = ac();
  if (!a) return;
  const c = a.ctx;
  const t = c.currentTime + delay;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = highpass;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(a.sfx);
  src.start(t);
}

export const sfx = {
  deal: () => noise(0.09, 0.18, 3000),
  flip: () => noise(0.14, 0.16, 1500),
  chip: () => {
    tone(1800, 0.06, "triangle", 0.1);
    tone(2500, 0.05, "triangle", 0.07, 0.035);
  },
  win: () => [523, 659, 784].forEach((f, i) => tone(f, 0.25, "triangle", 0.12, i * 0.09)),
  blackjack: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, "triangle", 0.13, i * 0.08)),
  push: () => tone(440, 0.18, "sine", 0.1),
  lose: () => tone(240, 0.4, "sawtooth", 0.07, 0, 120),
  bust: () => tone(200, 0.5, "square", 0.06, 0, 70),
  // Machine à sous
  spin: () => {
    for (let i = 0; i < 7; i++) noise(0.05, 0.09, 2500, i * 0.075);
  },
  reelStop: () => {
    tone(150, 0.14, "sine", 0.18, 0, 70);
    noise(0.05, 0.08, 1200);
  },
  bigWin: () => [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.32, "triangle", 0.13, i * 0.07)),
  // Un symbole spécial tombe : son propre petit son
  wildLand: () => {
    tone(880, 0.12, "sawtooth", 0.06);
    tone(1320, 0.2, "triangle", 0.1, 0.06);
    tone(1760, 0.2, "sine", 0.06, 0.12);
  },
  scatterLand: (count: number) => {
    const f = [523, 659, 784, 988, 1175][Math.min(Math.max(count, 1), 5) - 1];
    tone(f, 0.32, "triangle", 0.13);
    tone(f * 2, 0.26, "sine", 0.07, 0.05);
    noise(0.08, 0.05, 6000, 0.02);
  },
  tension: () => tone(260, 1.1, "sine", 0.05, 0, 700),
  // Wild qui s'étend, re-spin, levier, pièces
  wildExpand: () => {
    tone(260, 0.55, "sawtooth", 0.07, 0, 1300);
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.3, "triangle", 0.1, 0.35 + i * 0.07));
  },
  respin: () => {
    tone(660, 0.12, "square", 0.05);
    tone(990, 0.2, "square", 0.05, 0.1);
  },
  lever: () => {
    noise(0.22, 0.12, 900);
    tone(110, 0.16, "sine", 0.2, 0.18, 55);
  },
  vault: () => {
    [262, 330, 392, 523].forEach((f, i) => tone(f, 0.22, "square", 0.06, i * 0.12));
    tone(1046, 0.5, "triangle", 0.1, 0.5);
  },
  caseOpen: () => {
    noise(0.1, 0.1, 1500);
    tone(520, 0.12, "triangle", 0.1, 0.05);
    tone(780, 0.16, "triangle", 0.09, 0.12);
  },
  jackpot: () => {
    [523, 659, 784, 1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, 0.4, "triangle", 0.14, i * 0.09));
    [262, 330, 392].forEach((f) => tone(f, 1.4, "sawtooth", 0.05, 0.4));
  },
  card: () => {
    noise(0.12, 0.14, 2500);
    tone(330, 0.1, "triangle", 0.06, 0.08);
  },
  coin: (n = 6) => {
    for (let i = 0; i < n; i++) {
      tone(1568 + (i % 3) * 260, 0.07, "triangle", 0.06, i * 0.06);
      tone(2093, 0.09, "sine", 0.04, i * 0.06 + 0.02);
    }
  },
  freeSpins: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "square", 0.06, i * 0.1)),
  bonus: () => [330, 415, 494, 622, 740].forEach((f, i) => tone(f, 0.25, "sawtooth", 0.05, i * 0.12)),
};