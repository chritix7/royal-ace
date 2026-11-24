"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { audio, useAudioSettings } from "../lib/audio";
import { AMBIENCE_MODES, ambience, useAmbienceMode } from "../lib/ambience";
import { i18n, useLang } from "../lib/i18n";
import { ecoMode, motion, useEco, useReducedMotion } from "../lib/motion";
import { cleanName, profileStore, useProfile } from "../lib/profile";
import ShopView from "./ShopView";
import { useBalance } from "../lib/wallet";
import { cloud, useCloud } from "../lib/cloud";
import { money } from "../lib/game";

/**
 * Settings and the cosmetics shop, in one sheet opened from the header
 * gear (or from a locked theme in a game, straight on that item).
 */
export type SettingsTab = "settings" | "shop";

function Row({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="st-row">
      <div className="min-w-0 flex-1">
        <p className="st-row__title">{title}</p>
        {sub && <p className="st-row__sub">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
const Switch = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={`rl-switch ${on ? "is-on" : ""}`} />
);

function ago(at: number) {
  if (!at) return "not yet";
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

function CloudSection() {
  const c = useCloud();
  const profile = useProfile();
  const [confirmDel, setConfirmDel] = useState(false);
  const [code, setCode] = useState("");
  const [paste, setPaste] = useState(false);
  const [codeMsg, setCodeMsg] = useState("");
  const copy = async () => {
    const v = await cloud.exportCode();
    setCode(v);
    setPaste(false);
    try {
      await navigator.clipboard.writeText(v);
      setCodeMsg("Code copied ✓ Keep it somewhere safe (Notes, e-mail to yourself).");
    } catch {
      setCodeMsg("Copy the code below and keep it somewhere safe.");
    }
  };
  // Fetch the Face ID challenges now, so the tap opens Face ID at once.
  useEffect(() => {
    if (c.ready && c.configured && !c.linked) void cloud.prepare(profile.name || "Player");
  }, [c.ready, c.configured, c.linked, profile.name]);
  const restoreCode = async () => {
    const ok = await cloud.importCode(code);
    if (!ok) setCodeMsg("This code is not valid");
  };
  return (
    <section className="st-card">
      <p className="st-head">Cloud save · Face ID</p>
      {!c.ready ? (
        <p className="st-sub">Checking…</p>
      ) : !c.configured ? (
        <p className="st-sub">Cloud save is being set up — come back in a moment. You can already use a backup code below.</p>
      ) : !c.supported ? (
        <p className="st-sub">This browser has no passkeys. Use a backup code below.</p>
      ) : c.linked ? (
        <div className="st-cloud is-on">
          <p className="st-row__title">
            Saved to the cloud ✓ <span className="text-white/45">·</span> <span translate="no">{c.name}</span>
          </p>
          <p className="st-row__sub">{`Last save: ${ago(c.at)}. Saves itself while you play; on another device, open Settings and tap “I already have a save”.`}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" className="pr-btn is-sm" disabled={c.busy} onClick={() => void cloud.syncNow()}>
              Save now
            </button>
            <button type="button" className="pr-btn is-ghost is-sm" disabled={c.busy} onClick={() => void cloud.signOut()}>
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="st-cloud">
          <p className="st-row__sub">Protect your progress with a passkey: Face ID or Touch ID, kept in your iCloud Keychain. Get everything back on any device, even after deleting the app. No password, no e-mail.</p>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <button type="button" className="pr-btn is-sm" disabled={c.busy} onClick={() => cloud.create(profile.name || "Player")}>
              Save my progress
            </button>
            <button type="button" className="pr-btn is-ghost is-sm" disabled={c.busy} onClick={() => cloud.restore()}>
              I already have a save
            </button>
          </div>
        </div>
      )}
      {c.msg && <p className="mt-1.5 text-[11px] text-[#f5d778]">{c.msg}</p>}
      <div className="mt-3">
        <p className="st-row__title">Backup code</p>
        <p className="st-row__sub">A code holding all your progress, to paste on another device. Works without an account.</p>
        <div className="mt-1.5 flex gap-1.5">
          <button type="button" className="pr-btn is-ghost is-sm" onClick={() => void copy()}>
            Copy my code
          </button>
          <button
            type="button"
            className="pr-btn is-ghost is-sm"
            onClick={() => {
              setPaste(true);
              setCode("");
              setCodeMsg("");
            }}
          >
            Paste a code
          </button>
        </div>
        {(code || paste) && (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={!paste}
            rows={3}
            placeholder="RA1.…"
            aria-label="Backup code"
            className="st-input mt-1.5 w-full resize-none font-mono !text-[11px]"
            translate="no"
          />
        )}
        {paste && (
          <button type="button" className="pr-btn is-sm mt-1.5" disabled={code.trim().length < 8} onClick={() => void restoreCode()}>
            Restore from this code
          </button>
        )}
        {codeMsg && <p className="mt-1 text-[11px] text-[#f5d778]">{codeMsg}</p>}
      </div>
      {c.linked && (
        <div className="mt-3">
          {confirmDel ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-white/60">Delete the cloud account and its data?</span>
              <button type="button" className="pr-btn is-danger is-sm" onClick={() => { setConfirmDel(false); void cloud.deleteAccount(); }}>
                Delete
              </button>
              <button type="button" className="pr-btn is-ghost is-sm" onClick={() => setConfirmDel(false)}>
                Keep
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDel(true)} className="text-[10.5px] text-white/40 underline underline-offset-2 hover:text-white/70">
              Delete my cloud account and data
            </button>
          )}
        </div>
      )}
      <p className="st-sub mt-2">Privacy: the cloud keeps your nickname and your game data only. Face ID never leaves your device — the server stores a public key. Delete it all at any time.</p>
    </section>
  );
}

function SettingsPane({ onTour, onClose }: { onTour: () => void; onClose: () => void }) {
  const a = useAudioSettings();
  const amb = useAmbienceMode();
  const lang = useLang();
  const reduced = useReducedMotion();
  const eco = useEco();
  const profile = useProfile();
  const [name, setName] = useState(profile.name);
  const [nameMsg, setNameMsg] = useState("");
  const [reset, setReset] = useState("");
  useEffect(() => setName(profile.name), [profile.name]);
  const saveName = () => {
    const c = cleanName(name);
    if (!c) return setNameMsg("2 to 16 letters or digits");
    profileStore.setName(c);
    setNameMsg("Saved ✓");
  };
  const resetAll = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("royalace:"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    window.location.reload();
  };
  return (
    <div className="st-grid">
      <div className="st-col">
      <CloudSection />
      <section className="st-card">
        <p className="st-head">Language</p>
        <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Language">
          {(
            [
              ["en", "English"],
              ["fr", "Français"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={lang === id} onClick={() => i18n.set(id)} className={`st-choice ${lang === id ? "is-on" : ""}`} translate="no">
              {label}
            </button>
          ))}
        </div>
      </section>
      </div>
      <div className="st-col">
      <section className="st-card">
        <p className="st-head">Sound</p>
        <Row title="Music">
          <Switch on={a.music} onClick={() => audio.set({ music: !a.music })} label="Music" />
        </Row>
        <Row title="Sound effects">
          <Switch on={a.sfx} onClick={() => audio.set({ sfx: !a.sfx })} label="Sound effects" />
        </Row>
        <Row title="Vibration" sub="Phones only">
          <Switch on={a.haptics} onClick={() => audio.set({ haptics: !a.haptics })} label="Vibration" />
        </Row>
        <Row title="Volume">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={a.volume}
            onChange={(e) => audio.set({ volume: Number(e.target.value) })}
            aria-label="Master volume"
            className="ui-range w-32"
            style={{ "--v": `${Math.round(a.volume * 100)}%` } as CSSProperties}
          />
        </Row>
        <p className="st-sub mt-2">Ambience</p>
        <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {AMBIENCE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                ambience.setMode(m.id);
                audio.unlock();
              }}
              className={`st-choice !text-left ${amb === m.id ? "is-on" : ""}`}
              title={m.blurb}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>
      </div>
      <div className="st-col">
      <section className="st-card">
        <p className="st-head">Display</p>
        {/* Computers only: phones always run the light effects. */}
        <div className="hidden lg:block">
          <Row title="Eco mode" sub="Lighter effects in the games: a cooler, quieter computer">
            <Switch on={eco} onClick={() => ecoMode.set(!eco)} label="Eco mode" />
          </Row>
        </div>
        <Row title="Reduced animations" sub="Turns off most motion and effects">
          <Switch on={reduced} onClick={() => motion.set(!reduced)} label="Reduced animations" />
        </Row>
        <Row title="Replay the welcome tour">
          <button
            type="button"
            className="pr-btn is-ghost is-sm"
            onClick={() => {
              onClose();
              onTour();
            }}
          >
            Tour
          </button>
        </Row>
      </section>
      <section className="st-card">
        <p className="st-head">Profile & account</p>
        <div className="flex gap-1.5">
          <input value={name} onChange={(e) => setName(e.target.value)} onPointerDown={(e) => { if (e.pointerType === "touch" && document.activeElement === e.currentTarget) e.currentTarget.blur(); }} maxLength={16} aria-label="Your name" className="st-input min-w-0 flex-1" translate="no" />
          <button type="button" className="pr-btn is-sm" onClick={saveName}>
            Save
          </button>
        </div>
        {nameMsg && <p className="st-sub mt-1">{nameMsg}</p>}
        <div className="st-danger mt-3">
          <p className="st-row__title">Reset account</p>
          <p className="st-row__sub">Chips, progress, challenges, tickets, purchases and settings go back to zero. This cannot be undone. Type RESET to confirm.</p>
          <div className="mt-2 flex gap-1.5">
            <input value={reset} onChange={(e) => setReset(e.target.value.toUpperCase())} placeholder="RESET" aria-label="Type RESET" className="st-input min-w-0 flex-1" translate="no" />
            <button type="button" className="pr-btn is-danger is-sm" disabled={reset !== "RESET"} onClick={resetAll}>
              Reset
            </button>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

/** Full-screen page (settings, shop): its own header with a back key. */
function FullPage({ title, onClose, right, children }: { title: string; onClose: () => void; right?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="app-page fixed inset-0 z-[160] flex flex-col" role="dialog" aria-modal="true" aria-label={title}>
      <header className="app-page__bar pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-8 sm:py-3">
          <button type="button" onClick={onClose} className="ui-pill ui-pill--lobby shrink-0" aria-label="Back">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>
          <p className="app-page__title min-w-0 flex-1 truncate">{title}</p>
          {right}
        </div>
      </header>
      <div className="app-page__scroll lux-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-6xl px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-4 sm:px-8 sm:pt-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function SettingsPage({ onClose, onTour }: { onClose: () => void; onTour: () => void }) {
  return (
    <FullPage title="Settings" onClose={onClose}>
      <SettingsPane onTour={onTour} onClose={onClose} />
    </FullPage>
  );
}

export function ShopPage({ item, onClose }: { item?: string; onClose: () => void }) {
  const balance = useBalance();
  return (
    <FullPage
      title="Shop"
      onClose={onClose}
      right={
        <span className="shop-balance shrink-0">
          ◈ <span translate="no">{money(balance)}</span>
        </span>
      }
    >
      <ShopView focus={item} />
    </FullPage>
  );
}
