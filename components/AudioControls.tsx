"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AMBIENCE_MODES, ambience, useAmbienceMode } from "../lib/ambience";
import { audio, useAudioSettings } from "../lib/audio";
import { music } from "../lib/music";
import { IconMusic, IconSound, IconVibrate } from "./UiIcons";

/** Réglages du son pour toute la page : musique, effets, vibrations et volume. */
const IconAmbience = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className} aria-hidden="true">
    <path d="M3 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0" />
    <path d="M3 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" opacity="0.5" />
    <path d="M3 7c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" opacity="0.5" />
  </svg>
);

/** Ambience: on/off and the room, in a small menu under its key. */
function AmbienceKey() {
  const mode = useAmbienceMode();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);
  const on = mode !== "off";
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Ambience sounds"
        title="Ambience"
        className={`ui-pill ${on ? "is-on" : ""}`}
      >
        <span className="ui-led" aria-hidden="true" />
        <IconAmbience />
        <span className="hidden xl:inline">Ambience</span>
      </button>
      {open && (
        <div role="menu" aria-label="Ambience" className="ui-amb-menu">
          <p className="ui-amb-menu__title">Ambience</p>
          {AMBIENCE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="menuitemradio"
              aria-checked={mode === m.id}
              onClick={() => {
                ambience.setMode(m.id);
                audio.unlock();
              }}
              className={`ui-amb-item ${mode === m.id ? "is-on" : ""}`}
            >
              <span className="ui-amb-item__label">{m.label}</span>
              <span className="ui-amb-item__blurb">{m.blurb}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

      <AmbienceKey />

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
          className="ui-range w-8 min-[400px]:w-10 sm:w-20 lg:w-16"
          style={{ "--v": `${Math.round(a.volume * 100)}%` } as CSSProperties}
        />
      </label>
    </div>
  );
}
