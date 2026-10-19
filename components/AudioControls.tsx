"use client";

import { useEffect } from "react";
import { audio, useAudioSettings } from "../lib/audio";
import { music } from "../lib/music";

/** Réglages du son pour toute la page : musique, effets, vibrations et volume. */
export default function AudioControls() {
  const a = useAudioSettings();

  useEffect(() => {
    audio.hydrate();
    // Le navigateur n'autorise le son qu'après un premier clic ou une touche
    const unlock = () => {
      audio.unlock();
      if (audio.get().music) music.start();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!a.music) music.stop();
    else if (audio.isUnlocked()) music.start();
  }, [a.music]);

  const btn =
    "rounded-full border px-3 py-1.5 text-[11px] outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779]";
  const on = "border-[#d7b45b] bg-[#d7b45b]/10 text-[#e5c779]";
  const off = "border-white/10 text-white/45";

  return (
  <div
    className="flex items-center justify-end gap-1 sm:flex-wrap sm:gap-2"
    role="group"
    aria-label="Sound settings"
  >
    <button
      onClick={() => audio.set({ music: !a.music })}
      aria-pressed={a.music}
      aria-label="Toggle music"
      title="Music"
      className={`${btn} !px-2 sm:!px-3 ${a.music ? on : off}`}
    >
      <span aria-hidden="true">♪</span>
      <span className="hidden sm:inline"> Music</span>
    </button>

    <button
      onClick={() => audio.set({ sfx: !a.sfx })}
      aria-pressed={a.sfx}
      aria-label="Toggle sound effects"
      title="Sound effects"
      className={`${btn} !px-2 sm:!px-3 ${a.sfx ? on : off}`}
    >
      <span aria-hidden="true">🔊</span>
      <span className="hidden sm:inline"> Sounds</span>
    </button>

    <button
      onClick={() => audio.set({ haptics: !a.haptics })}
      aria-pressed={a.haptics}
      className={`${btn} hidden sm:inline-block ${
        a.haptics ? on : off
      }`}
    >
      📳 Vibration
    </button>

    <label className="flex shrink-0 items-center gap-2 text-[11px] text-white/45">
      <span className="hidden sm:inline">Volume</span>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={a.volume}
        onChange={(e) => audio.set({ volume: Number(e.target.value) })}
        aria-label="Master volume"
        className="h-1 w-12 min-w-0 accent-[#d7b45b] sm:w-20"
      />
    </label>
  </div>
);
}