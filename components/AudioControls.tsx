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

  // Premium pill shared by Music / Sounds / Vibration. Gradient glass
  // body, inset top highlight, uppercase tracked label, warms to gold
  // when on, dark neutral when off; presses down 1px on :active.
  const btn =
    "rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_0_rgba(0,0,0,0.45)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#e5c779] active:translate-y-px";
  const on =
    "border-[#d7b45b]/60 bg-gradient-to-b from-[#d7b45b]/25 to-[#d7b45b]/8 text-[#f5d778]";
  const off =
    "border-white/12 bg-gradient-to-b from-[#1a2219] to-[#0e1310] text-white/55 hover:text-[#e5c779] hover:border-[#d7b45b]/40";

  return (
  <div
    className="flex items-center justify-end gap-1.5 sm:flex-wrap sm:gap-2"
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

    {/* Volume — framed container matching the other audio pills, with
        a label eyebrow and a gold-tinted track. */}
    <label className="flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-gradient-to-b from-[#1a2219] to-[#0e1310] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_0_rgba(0,0,0,0.45)] sm:px-3">
      <span className="hidden text-[10px] font-black uppercase tracking-wider text-[#d7b45b]/80 sm:inline">
        Volume
      </span>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={a.volume}
        onChange={(e) => audio.set({ volume: Number(e.target.value) })}
        aria-label="Master volume"
        className="h-1 w-14 min-w-0 accent-[#d7b45b] sm:w-20"
      />
    </label>
  </div>
);
}