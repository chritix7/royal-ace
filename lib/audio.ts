import { useSyncExternalStore } from "react";

/**
 * Réglages et moteur audio communs à toute la page (blackjack + machine à sous).
 * Les sons et la musique sont générés par le navigateur (WebAudio) : aucun fichier audio.
 */
export type AudioSettings = { sfx: boolean; music: boolean; haptics: boolean; volume: number };

const KEY = "royalace:audio";
export const DEFAULT_AUDIO: AudioSettings = { sfx: true, music: true, haptics: true, volume: 0.7 };
const MUSIC_LEVEL = 0.32; // la musique reste plus discrète que les effets

let settings: AudioSettings = { ...DEFAULT_AUDIO };
let hydrated = false;
let unlocked = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const clampVolume = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULT_AUDIO.volume);

type Bus = { ctx: AudioContext; sfx: GainNode; music: GainNode; duck: GainNode };
let bus: Bus | null = null;

function applyGains() {
  if (!bus) return;
  const t = bus.ctx.currentTime;
  bus.sfx.gain.setTargetAtTime(settings.sfx ? 1 : 0, t, 0.02);
  bus.music.gain.setTargetAtTime(settings.music ? MUSIC_LEVEL : 0, t, 0.05);
  (bus as Bus & { master?: GainNode }).master?.gain.setTargetAtTime(settings.volume, t, 0.02);
}

/** Le contexte audio, créé au premier besoin (après un clic de l'utilisateur). */
export function getAudio(): Bus | null {
  if (typeof window === "undefined") return null;
  if (!bus) {
    const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    const sfx = ctx.createGain();
    const music = ctx.createGain();
    const duck = ctx.createGain();
    sfx.connect(master);
    music.connect(duck).connect(master);
    master.connect(ctx.destination);
    bus = Object.assign({ ctx, sfx, music, duck }, { master });
    applyGains();
  }
  if (bus.ctx.state === "suspended") void bus.ctx.resume();
  return bus;
}

export const audio = {
  get: () => settings,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(patch: Partial<AudioSettings>) {
    settings = { ...settings, ...patch, volume: clampVolume(patch.volume ?? settings.volume) };
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {}
    applyGains();
    emit();
  },
  /** À appeler une fois, dans le navigateur. */
  hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        settings = {
          sfx: d.sfx !== false,
          music: d.music !== false,
          haptics: d.haptics !== false,
          volume: clampVolume(d.volume ?? DEFAULT_AUDIO.volume),
        };
      }
    } catch {}
    // On coupe tout quand l'onglet est caché
    document.addEventListener("visibilitychange", () => {
      if (!bus) return;
      if (document.hidden) void bus.ctx.suspend();
      else void bus.ctx.resume();
    });
    emit();
  },
  /** Les navigateurs n'autorisent le son qu'après un clic ou une touche. */
  unlock() {
    unlocked = true;
    getAudio();
  },
  isUnlocked: () => unlocked,
};

export const useAudioSettings = () => useSyncExternalStore(audio.subscribe, audio.get, () => DEFAULT_AUDIO);