import { audio, getAudio } from "./audio";

/**
 * Casino-room ambience for the blackjack table: a soft crowd murmur
 * (filtered noise loop) with chips clicking somewhere across the room
 * and the odd faint chime. Generated live like the rest of the audio —
 * no sound files. Plays on the music bus, so the Music switch and the
 * master volume apply; its own on/off is remembered per browser.
 */

const KEY = "royalace:ambience";

let enabled = true;
let wanted = false; // the blackjack table is on screen
let murmur: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
let timer: number | null = null;
let waitingForGesture = false;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    if (window.localStorage.getItem(KEY) === "off") enabled = false;
  } catch {}
}

function distantChip() {
  const a = getAudio();
  if (!a) return;
  const t = a.ctx.currentTime + Math.random() * 0.3;
  const clicks = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < clicks; i++) {
    const o = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 1500 + Math.random() * 1100;
    const at = t + i * (0.05 + Math.random() * 0.04);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.02 + Math.random() * 0.015, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    o.connect(g).connect(a.music);
    o.start(at);
    o.stop(at + 0.08);
  }
}

function distantChime() {
  const a = getAudio();
  if (!a) return;
  const t = a.ctx.currentTime;
  [1319, 1568, 2093].forEach((f, i) => {
    const o = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const at = t + i * 0.09;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.012, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    o.connect(g).connect(a.music);
    o.start(at);
    o.stop(at + 0.55);
  });
}

function start() {
  if (murmur) return;
  const a = getAudio();
  if (!a) return;
  const c = a.ctx;

  // Four seconds of brown-ish noise, looped: reads as a room full of
  // low voices once it is band-limited.
  const buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 420;
  band.Q.value = 0.5;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.16, c.currentTime + 1.5);
  src.connect(band).connect(gain).connect(a.music);
  src.start();
  murmur = { src, gain };

  timer = window.setInterval(() => {
    const r = Math.random();
    if (r < 0.3) distantChip();
    else if (r < 0.33) distantChime();
  }, 1100);
}

function stop() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  if (!murmur) return;
  const { src, gain } = murmur;
  murmur = null;
  const a = getAudio();
  const t = a ? a.ctx.currentTime : 0;
  try {
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0.0001, t, 0.15);
    src.stop(t + 0.8);
  } catch {}
}

function sync() {
  if (typeof window === "undefined") return;
  if (!(enabled && wanted)) {
    stop();
    return;
  }
  // Browsers only allow audio after a first click or key press.
  if (!audio.isUnlocked()) {
    if (waitingForGesture) return;
    waitingForGesture = true;
    const retry = () => {
      waitingForGesture = false;
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      // Let the app's own unlock handler run first.
      window.setTimeout(sync, 150);
    };
    window.addEventListener("pointerdown", retry);
    window.addEventListener("keydown", retry);
    return;
  }
  start();
}

export const ambience = {
  isEnabled: () => enabled,
  setEnabled(value: boolean) {
    if (value === enabled) return;
    enabled = value;
    try {
      window.localStorage.setItem(KEY, value ? "on" : "off");
    } catch {}
    listeners.forEach((l) => l());
    sync();
  },
  /** Called by the blackjack view: true while the table is on screen. */
  setWanted(value: boolean) {
    wanted = value;
    sync();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
