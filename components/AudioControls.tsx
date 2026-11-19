"use client";

import { useEffect, type CSSProperties } from "react";
import { audio, useAudioSettings } from "../lib/audio";
import { music } from "../lib/music";
import { IconMusic, IconSound, IconVibrate } from "./UiIcons";

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

  return (
    <div className="flex items-center justify-end gap-1.5 sm:gap-2" role="group" aria-label="Sound settings">
      <button
        onClick={() => audio.set({ music: !a.music })}
        aria-pressed={a.music}
        aria-label="Toggle music"
        title="Music"
        className={`ui-pill ${a.music ? "is-on" : ""}`}
      >
        <span className="ui-led" aria-hidden="true" />
        <IconMusic />
        <span className="hidden lg:inline">Music</span>
      </button>

      <button
        onClick={() => audio.set({ sfx: !a.sfx })}
        aria-pressed={a.sfx}
        aria-label="Toggle sound effects"
        title="Sound effects"
        className={`ui-pill ${a.sfx ? "is-on" : ""}`}
      >
        <span className="ui-led" aria-hidden="true" />
        <IconSound muted={!a.sfx} />
        <span className="hidden lg:inline">Sounds</span>
      </button>

      <button
        onClick={() => audio.set({ haptics: !a.haptics })}
        aria-pressed={a.haptics}
        aria-label="Toggle vibration"
        title="Vibration"
        className={`ui-pill hidden sm:inline-flex ${a.haptics ? "is-on" : ""}`}
      >
        <span className="ui-led" aria-hidden="true" />
        <IconVibrate />
        <span className="hidden lg:inline">Vibration</span>
      </button>

      <label className="ui-pill ui-pill--volume shrink-0">
        <span className="hidden lg:inline">Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={a.volume}
          onChange={(e) => audio.set({ volume: Number(e.target.value) })}
          aria-label="Master volume"
          className="ui-range w-8 min-[400px]:w-10 sm:w-20"
          style={{ "--v": `${Math.round(a.volume * 100)}%` } as CSSProperties}
        />
      </label>
    </div>
  );
}
