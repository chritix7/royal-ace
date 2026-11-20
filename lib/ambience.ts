import { useSyncExternalStore } from "react";
import { audio, getAudio } from "./audio";

/**
 * Background ambience, generated live (no sound files), on its own switch
 * — independent from the music — and following the master volume.
 *
 * Modes: "auto" picks the room for the game on screen (casino floor at the
 * tables and slots, a stadium crowd for penalty and sports), or the player
 * forces one room ("casino", "stadium", "rain"), or "off".
 * Phones get the same rooms with fewer little events (lighter).
 */

export type AmbienceMode = "auto" | "casino" | "stadium" | "rain" | "off";
type Room = "casino" | "stadium" | "rain";
export const AMBIENCE_MODES: { id: AmbienceMode; label: string; blurb: string }[] = [
  { id: "auto", label: "Auto", blurb: "Follows the game: casino floor or stadium" },
  { id: "casino", label: "Casino floor", blurb: "Low voices, chips, the odd chime" },
  { id: "stadium", label: "Stadium", blurb: "Crowd, swells and roars" },
  { id: "rain", label: "Night rain", blurb: "Soft rain on the windows" },
  { id: "off", label: "Off", blurb: "No ambience" },
];

const KEY = "royalace:ambience";
const LEVEL: Record<Room, number> = { casino: 0.16, stadium: 0.13, rain: 0.09 };

let mode: AmbienceMode = "auto";
let scene: string | null = null; // the game on screen (or "lobby")
let playing: { room: Room; src: AudioBufferSourceNode; gain: GainNode; out: GainNode } | null = null;
let timer: number | null = null;
let waitingForGesture = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const lite = () => typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches;

if (typeof window !== "undefined") {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "off") mode = "off";
    else if (v === "casino" || v === "stadium" || v === "rain" || v === "auto") mode = v;
  } catch {}
}

function roomFor(): Room | null {
  if (mode === "off" || !scene) return null;
  if (mode !== "auto") return mode;
  return scene === "penalty" || scene === "sports" ? "stadium" : "casino";
}

/** The bus straight to the master volume (not through the music switch). */
function out() {
  const a = getAudio();
  if (!a) return null;
  const master = (a as unknown as { master?: GainNode }).master;
  return { a, dest: master ?? a.ctx.destination };
}

function noiseBuffer(ctx: AudioContext, seconds: number, color: "brown" | "pink" | "white") {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (color === "brown") {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else if (color === "pink") {
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
    } else d[i] = w * 0.4;
  }
  return buf;
}

function blip(freq: number, at: number, level: number, dur: number, type: OscillatorType = "triangle") {
  const o = out();
  if (!o || !playing) return;
  const osc = o.a.ctx.createOscillator();
  const g = o.a.ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(level, at + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(playing.out);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/* Little events in each room */
function casinoTick() {
  const o = out();
  if (!o) return;
  const t = o.a.ctx.currentTime + Math.random() * 0.3;
  const r = Math.random();
  if (r < 0.3) {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) blip(1500 + Math.random() * 1100, t + i * (0.05 + Math.random() * 0.04), 0.02 + Math.random() * 0.015, 0.06);
  } else if (r < 0.34) [1319, 1568, 2093].forEach((f, i) => blip(f, t + i * 0.09, 0.012, 0.5, "sine"));
}
function stadiumTick() {
  if (!playing) return;
  const o = out();
  if (!o) return;
  const t = o.a.ctx.currentTime;
  // The crowd breathes: slow swells.
  const base = LEVEL.stadium;
  playing.gain.gain.cancelScheduledValues(t);
  playing.gain.gain.setTargetAtTime(base * (0.75 + Math.random() * 0.6), t, 0.9);
  if (Math.random() < 0.025) {
    // A far whistle.
    const osc = o.a.ctx.createOscillator();
    const g = o.a.ctx.createGain();
    const lfo = o.a.ctx.createOscillator();
    const lg = o.a.ctx.createGain();
    osc.frequency.value = 2900;
    lfo.frequency.value = 28;
    lg.gain.value = 120;
    lfo.connect(lg).connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(g).connect(playing.out);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.5);
    lfo.stop(t + 0.5);
  }
}
function rainTick() {
  const o = out();
  if (!o) return;
  const t = o.a.ctx.currentTime;
  const n = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) blip(2200 + Math.random() * 2600, t + Math.random() * 0.8, 0.004 + Math.random() * 0.004, 0.05, "sine");
}

function start(room: Room) {
  if (playing?.room === room) return;
  stop();
  const o = out();
  if (!o) return;
  const c = o.a.ctx;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 4, room === "casino" ? "brown" : room === "stadium" ? "pink" : "white");
  src.loop = true;
  const f1 = c.createBiquadFilter();
  const f2 = c.createBiquadFilter();
  if (room === "casino") {
    f1.type = "bandpass";
    f1.frequency.value = 420;
    f1.Q.value = 0.5;
    f2.type = "lowpass";
    f2.frequency.value = 4000;
  } else if (room === "stadium") {
    f1.type = "bandpass";
    f1.frequency.value = 800;
    f1.Q.value = 0.35;
    f2.type = "lowpass";
    f2.frequency.value = 2600;
  } else {
    f1.type = "highpass";
    f1.frequency.value = 900;
    f2.type = "lowpass";
    f2.frequency.value = 5200;
  }
  const gain = c.createGain();
  const outGain = c.createGain();
  outGain.gain.value = 1;
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(LEVEL[room], c.currentTime + 1.5);
  src.connect(f1).connect(f2).connect(gain).connect(outGain).connect(o.dest);
  src.start();
  playing = { room, src, gain, out: outGain };
  const tick = room === "casino" ? casinoTick : room === "stadium" ? stadiumTick : rainTick;
  timer = window.setInterval(tick, lite() ? 2200 : room === "stadium" ? 2400 : 1100);
}

function stop() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  if (!playing) return;
  const { src, out: g } = playing;
  playing = null;
  const a = getAudio();
  const t = a ? a.ctx.currentTime : 0;
  try {
    g.gain.cancelScheduledValues(t);
    g.gain.setTargetAtTime(0.0001, t, 0.15);
    src.stop(t + 0.8);
  } catch {}
}

function sync() {
  if (typeof window === "undefined") return;
  const room = roomFor();
  if (!room) {
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
      window.setTimeout(sync, 150);
    };
    window.addEventListener("pointerdown", retry);
    window.addEventListener("keydown", retry);
    return;
  }
  start(room);
}

export const ambience = {
  getMode: () => mode,
  setMode(value: AmbienceMode) {
    if (value === mode) return;
    mode = value;
    try {
      window.localStorage.setItem(KEY, value);
    } catch {}
    emit();
    sync();
  },
  /** Older switch (table settings): on = auto. */
  isEnabled: () => mode !== "off",
  setEnabled(value: boolean) {
    ambience.setMode(value ? (mode === "off" ? "auto" : mode) : "off");
  },
  /** The page tells which game is on screen ("lobby" in the lobby). */
  setScene(value: string | null) {
    scene = value;
    sync();
  },
  /** Kept for older callers; the page drives the scene now. */
  setWanted(_value: boolean) {},
  /** A goal: the stadium crowd roars for a moment. */
  cheer() {
    if (!playing || playing.room !== "stadium") return;
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const g = playing.gain.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(LEVEL.stadium * 3.2, t, 0.08);
    g.setTargetAtTime(LEVEL.stadium, t + 1.6, 0.6);
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export const useAmbienceMode = () => useSyncExternalStore(ambience.subscribe, ambience.getMode, () => "auto" as AmbienceMode);
