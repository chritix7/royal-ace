"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { audio, useAudioSettings } from "../lib/audio";
import { AMBIENCE_MODES, ambience, useAmbienceMode } from "../lib/ambience";
import { i18n, useLang } from "../lib/i18n";
import { motion, useReducedMotion } from "../lib/motion";
import { cleanName, profileStore, useProfile } from "../lib/profile";
import { SHOP, SHOP_CATS, priceLabel, shop, useShop } from "../lib/shop";
import { useBalance, useLocked } from "../lib/wallet";
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
            <button type="button" className="rl-key is-on" disabled={c.busy} onClick={() => void cloud.syncNow()}>
              Save now
            </button>
            <button type="button" className="rl-key" disabled={c.busy} onClick={() => void cloud.signOut()}>
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="st-cloud">
          <p className="st-row__sub">Protect your progress with a passkey: Face ID or Touch ID, kept in your iCloud Keychain. Get everything back on any device, even after deleting the app. No password, no e-mail.</p>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <button type="button" className="rl-key is-on" disabled={c.busy} onClick={() => cloud.create(profile.name || "Player")}>
              Save my progress
            </button>
            <button type="button" className="rl-key" disabled={c.busy} onClick={() => cloud.restore()}>
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
          <button type="button" className="rl-key" onClick={() => void copy()}>
            Copy my code
          </button>
          <button
            type="button"
            className="rl-key"
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
          <button type="button" className="rl-key is-on mt-1.5" disabled={code.trim().length < 8} onClick={() => void restoreCode()}>
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
              <button type="button" className="rl-key" onClick={() => { setConfirmDel(false); void cloud.deleteAccount(); }}>
                Delete
              </button>
              <button type="button" className="rl-key" onClick={() => setConfirmDel(false)}>
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
      <section className="st-card">
        <p className="st-head">Display</p>
        <Row title="Reduced animations" sub="Turns off most motion and effects">
          <Switch on={reduced} onClick={() => motion.set(!reduced)} label="Reduced animations" />
        </Row>
        <Row title="Replay the welcome tour">
          <button
            type="button"
            className="rl-key"
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
          <button type="button" className="rl-key is-on" onClick={saveName}>
            Save
          </button>
        </div>
        {nameMsg && <p className="st-sub mt-1">{nameMsg}</p>}
        <div className="st-danger mt-3">
          <p className="st-row__title">Reset account</p>
          <p className="st-row__sub">Chips, progress, challenges, tickets, purchases and settings go back to zero. This cannot be undone. Type RESET to confirm.</p>
          <div className="mt-2 flex gap-1.5">
            <input value={reset} onChange={(e) => setReset(e.target.value.toUpperCase())} placeholder="RESET" aria-label="Type RESET" className="st-input min-w-0 flex-1" translate="no" />
            <button type="button" className="rl-key" disabled={reset !== "RESET"} onClick={resetAll}>
              Reset
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Preview({ it }: { it: (typeof SHOP)[number] }) {
  const [a, b, c] = it.swatch;
  if (it.cat === "card") {
    const fin = it.id === "card:gold" ? "" : `is-${it.id.slice(5)}`;
    return (
      <div className="shop-prev shop-prev--card">
        <div className={`vip-card shop-vip ${fin}`}>
          <div className="flex items-start justify-between">
            <span className="vip-card__brand">ROYAL ACE</span>
            <span className="vip-card__tier">VIP</span>
          </div>
          <span className="vip-card__chip" aria-hidden="true" />
        </div>
      </div>
    );
  }
  if (it.cat === "roulette") {
    return (
      <div className="shop-prev" style={{ background: `radial-gradient(120% 90% at 50% 20%, ${b}, ${a})` }}>
        <span className="shop-wheel" style={{ borderColor: c, background: `radial-gradient(circle, ${c} 0 12%, ${a} 13% 30%, transparent 31%), repeating-conic-gradient(#b3121f 0 10deg, #0b0b0d 10deg 20deg)` }} />
      </div>
    );
  }
  return (
    <div className="shop-prev" style={{ background: `radial-gradient(120% 100% at 50% 0%, ${b}, ${a})` }}>
      <span className="shop-arc" style={{ borderColor: c }} />
      <span className="shop-card shop-card--face" style={{ transform: "rotate(-8deg) translateX(-30%)" }}>
        A<span className="text-[#111]">♠</span>
      </span>
      <span className="shop-card shop-card--back" style={{ background: `repeating-linear-gradient(45deg, ${b} 0 3px, ${a} 3px 6px)`, borderColor: c, transform: "rotate(7deg) translateX(30%)" }} />
    </div>
  );
}

function ShopPane({ focus }: { focus?: string }) {
  const st = useShop();
  const locked = useLocked();
  const [cat, setCat] = useState<"all" | (typeof SHOP_CATS)[number]["id"]>("all");
  const [msg, setMsg] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => {
    if (!focus) return;
    const t = window.setTimeout(() => document.getElementById(`shop-${focus}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 120);
    return () => window.clearTimeout(t);
  }, [focus]);
  const owned = st.owned.length;
  return (
    <div className="space-y-5">
      <div className="shop-hero">
        <p className="shop-hero__kicker">Collection</p>
        <p className="shop-hero__title">Felts, rooms and finishes</p>
        <p className="shop-hero__sub">Buy once with chips, keep for good. {`${owned} of ${SHOP.length} owned`}</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Categories">
        {([["all", "All"], ...SHOP_CATS.map((c) => [c.id, c.label])] as [typeof cat, string][]).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={cat === id} onClick={() => setCat(id)} className={`st-chip ${cat === id ? "is-on" : ""}`}>
            {label}
          </button>
        ))}
      </div>
      {SHOP_CATS.filter((c) => cat === "all" || c.id === cat).map((c) => (
        <section key={c.id}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="st-head !mb-0">{c.label}</p>
            <p className="st-sub">{c.where}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {SHOP.filter((i) => i.cat === c.id).map((it) => {
              const has = st.owned.includes(it.id);
              const equipped = c.id === "card" && st.card === it.id;
              return (
                <div key={it.id} id={`shop-${it.id}`} className={`shop-item ${focus === it.id ? "is-focus" : ""} ${has ? "is-owned" : ""}`}>
                  <Preview it={it} />
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="shop-item__name">{it.name}</p>
                    {!has && <span className="shop-item__price">◈ {priceLabel(it.price)}</span>}
                  </div>
                  <p className="shop-item__note">{it.note}</p>
                  {has ? (
                    c.id === "card" ? (
                      <button type="button" className={`rl-key w-full ${equipped ? "is-on" : ""}`} disabled={equipped} onClick={() => shop.equipCard(it.id)}>
                        {equipped ? "Equipped" : "Equip"}
                      </button>
                    ) : (
                      <span className="shop-item__owned">Owned</span>
                    )
                  ) : (
                    <button
                      type="button"
                      className="rl-key is-on w-full"
                      disabled={locked}
                      onClick={() => {
                        const ok = shop.buy(it.id);
                        setMsg({ id: it.id, text: ok ? "Unlocked ✓" : "Not enough chips" });
                        if (ok && c.id === "card") shop.equipCard(it.id);
                      }}
                    >
                      Buy
                    </button>
                  )}
                  {msg?.id === it.id && <p className="text-center text-[10px] text-[#f5d778]">{msg.text}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {locked && <p className="st-sub text-center">Finish the round in progress to buy.</p>}
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
      <div className="app-page__scroll min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
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
      <ShopPane focus={item} />
    </FullPage>
  );
}
