"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { audio, useAudioSettings } from "../lib/audio";
import { AMBIENCE_MODES, ambience, useAmbienceMode } from "../lib/ambience";
import { i18n, useLang } from "../lib/i18n";
import { ecoMode, motion, useEco, useReducedMotion } from "../lib/motion";
import { useProfile } from "../lib/profile";
import { nick, useNickCheck } from "../lib/nick";
import ShopView from "./ShopView";
import { useBalance } from "../lib/wallet";
import { cloud, useCloud } from "../lib/cloud";
import { money } from "../lib/game";
import { useStats } from "../lib/statsStore";

/**
 * Settings and the cosmetics shop, in one sheet opened from the header
 * gear (or from a locked theme in a game, straight on that item).
 */
import { FEEDBACK_HREF, HELP_LINE, LEGAL_LINKS } from "./LegalDoc";
import { NO_STATS_KEY } from "./SiteStats";
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

function ago(at: number, fr = false) {
  if (!at) return fr ? "pas encore" : "not yet";
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return fr ? "à l'instant" : "just now";
  if (m < 60) return fr ? `il y a ${m} min` : `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return fr ? `il y a ${h} h` : `${h} h ago`;
  return fr ? `il y a ${Math.round(h / 24)} jours` : `${Math.round(h / 24)} days ago`;
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
  const fr = useLang() === "fr";
  const [email, setEmail] = useState("");
  const [mailOpen, setMailOpen] = useState(false);
  const ways = [c.google && "Google", c.email && c.email, c.passkey && "Face ID"].filter(Boolean).join(" · ");
  return (
    <section className="st-card" id="account">
      <p className="st-head">{fr ? "Compte · sauvegarde" : "Account · cloud save"}</p>
      {!c.ready ? (
        <p className="st-sub">Checking…</p>
      ) : !c.configured ? (
        <p className="st-sub">Cloud save is being set up — come back in a moment. You can already use a backup code below.</p>
      ) : c.linked ? (
        <div className="st-cloud is-on" translate="no">
          <p className="st-row__title">
            {fr ? "Connecté ✓" : "Signed in ✓"} <span className="text-white/45">·</span> {c.name}
          </p>
          {ways && <p className="st-row__sub">{ways}</p>}
          <p className="st-row__sub">{fr ? `Dernière sauvegarde : ${ago(c.at, true)}. Tout s'enregistre pendant que tu joues ; sur un autre appareil, connecte-toi de la même façon.` : `Last save: ${ago(c.at)}. Everything saves while you play; on another device, sign in the same way.`}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" className="pr-btn is-sm" disabled={c.busy} onClick={() => void cloud.syncNow()}>
              {fr ? "Sauvegarder" : "Save now"}
            </button>
            <button type="button" className="pr-btn is-ghost is-sm" disabled={c.busy} onClick={() => void cloud.signOut()}>
              {fr ? "Se déconnecter" : "Sign out"}
            </button>
          </div>
        </div>
      ) : (
        <div className="st-cloud" translate="no">
          <p className="st-row__sub">{fr ? "Connecte-toi pour garder tes jetons et ta progression sur tous tes appareils. Gratuit, sans mot de passe." : "Sign in to keep your chips and progress on all your devices. Free, no password."}</p>
          <div className="mt-2 grid grid-cols-1 gap-1.5">
            {c.providers.google && (
              <button type="button" className="st-google" disabled={c.busy} onClick={() => cloud.google()}>
                <svg viewBox="0 0 48 48" aria-hidden="true" className="h-4 w-4">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                </svg>
                {fr ? "Continuer avec Google" : "Continue with Google"}
              </button>
            )}
            {c.providers.email &&
              (mailOpen ? (
                <form
                  className="flex gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void cloud.emailLink(email, fr);
                  }}
                >
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={fr ? "ton@email.com" : "you@email.com"} aria-label="E-mail" className="st-input min-w-0 flex-1" />
                  <button type="submit" className="pr-btn is-sm" disabled={c.busy || !email}>
                    {fr ? "Envoyer" : "Send"}
                  </button>
                </form>
              ) : (
                <button type="button" className="pr-btn is-ghost is-sm" onClick={() => setMailOpen(true)}>
                  ✉ {fr ? "Recevoir un lien par e-mail" : "Get a sign-in link by e-mail"}
                </button>
              ))}
            {c.supported && (
              <p className="st-row__sub mt-1 text-center">
                {fr ? "Ou avec Face ID / Touch ID : " : "Or with Face ID / Touch ID: "}
                <button type="button" className="st-link" disabled={c.busy} onClick={() => cloud.create(profile.name || "Player")}>
                  {fr ? "créer" : "create"}
                </button>
                {" · "}
                <button type="button" className="st-link" disabled={c.busy} onClick={() => cloud.restore()}>
                  {fr ? "me connecter" : "sign in"}
                </button>
              </p>
            )}
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
              {fr ? "Supprimer mon compte et mes données" : "Delete my account and data"}
            </button>
          )}
        </div>
      )}
      <p className="st-sub mt-2" translate="no">{fr ? "Confidentialité : le compte garde ton pseudo, ton e-mail (si tu l'utilises) et ta partie, rien d'autre. Pas de pub, pas de newsletter. Tu peux tout supprimer à tout moment." : "Privacy: the account keeps your nickname, your e-mail (if you use it) and your game, nothing else. No ads, no newsletter. Delete it all at any time."}</p>
    </section>
  );
}

const SHORTCUTS: [string, [string, string][]][] = [
  ["Everywhere", [["Space", "play"], ["F", "focus"], ["Esc", "close"], ["1–0", "chips"]]],
  ["Blackjack", [["H", "hit"], ["S", "stand"], ["D", "double"], ["P", "split"]]],
  ["Slots", [["T", "turbo"], ["← →", "bet"]]],
  ["Roulette", [["T", "quick"], ["L", "Lightning"], ["X", "×2"], ["R", "rebet"]]],
  ["Craps", [["O", "max odds"], ["R", "rebet"], ["H", "hints"]]],
  ["Hold'em", [["C", "call"], ["D", "fold"], ["H", "hints"]]],
  ["Penalty", [["1–5", "corner"], ["X", "×2"], ["H", "½"]]],
];

const FAV_GAMES: [string, string][] = [
  ["bjHands", "Blackjack"],
  ["spins", "Slot machines"],
  ["rouletteSpins", "Roulette"],
  ["pokerHands", "Casino Hold'em"],
  ["crapsRolls", "Craps"],
  ["penaltyRounds", "Penalty"],
  ["betsPlaced", "Sports betting"],
];
function playTime(ms: number) {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, "0")}`;
}
/** Account at a glance: when it started, time played, the game played most. */
function AccountStats() {
  const profile = useProfile();
  const stats = useStats() as unknown as Record<string, number>;
  const [lang] = [useLang()];
  const top = FAV_GAMES.map(([k, name]) => [name, stats[k] ?? 0] as const).sort((a, b) => b[1] - a[1])[0];
  const since = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const items: [string, string][] = [
    ["Playing since", since],
    ["Play time", playTime(profile.playMs ?? 0)],
    ["Favourite game", top && top[1] > 0 ? top[0] : "—"],
  ];
  return (
    <div className="st-acct">
      {items.map(([k, v]) => (
        <div key={k}>
          <p className="st-acct__k">{k}</p>
          <p className="st-acct__v">{v}</p>
        </div>
      ))}
    </div>
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
  const [stats, setStats] = useState(true);
  useEffect(() => {
    try {
      setStats(localStorage.getItem(NO_STATS_KEY) !== "1");
    } catch {}
  }, []);
  const toggleStats = () => {
    const on = !stats;
    setStats(on);
    try {
      if (on) localStorage.removeItem(NO_STATS_KEY);
      else localStorage.setItem(NO_STATS_KEY, "1");
    } catch {}
  };
  useEffect(() => setName(profile.name), [profile.name]);
  const linkedNow = useCloud().linked;
  const live = useNickCheck(name, profile.name, linkedNow, lang === "fr");
  const saveName = async () => {
    const err = await nick.save(name, lang === "fr");
    setNameMsg(err ?? (lang === "fr" ? "Enregistré ✓" : "Saved ✓"));
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
      <section className="st-card st-tall hidden lg:block">
        <p className="st-head">Keyboard shortcuts</p>
        <dl className="st-keys">
          {SHORTCUTS.map(([game, keys]) => (
            <div key={game}>
              <dt>{game}</dt>
              <dd>
                {keys.map(([k, what]) => (
                  <span key={k + what} className="st-key">
                    <kbd>{k}</kbd>
                    {what}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
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
      <section className="st-card st-tall">
        <p className="st-head">About Chrysonyx</p>
        <ul className="st-about">
          <li>
            <b>Virtual chips only.</b> No real money, nothing to buy and nothing to cash out: everything is free.
          </li>
          <li>
            <b>Fair games.</b> Every game shows its return to player (RTP); the odds are the real casino odds.
          </li>
          <li>
            <b>Sports.</b> Real matches and scores (football-data.org, API-Sports); odds computed by Chrysonyx.
          </li>
          <li>
            <b>Play well.</b> Take breaks: the tables wait for you.
          </li>
          <li translate="no">
            <b>{lang === "fr" ? "18 ans et plus." : "18+ only."}</b>{" "}
            {lang === "fr"
              ? `Si le jeu te pose problème, ${HELP_LINE.name} répond au ${HELP_LINE.phone} (appel non surtaxé).`
              : `If gaming is a problem for you, ${HELP_LINE.name} can help: ${HELP_LINE.phone} (France).`}
          </li>
        </ul>
        <div translate="no">
          <Row
            title={lang === "fr" ? "Statistiques de visite anonymes" : "Anonymous visit stats"}
            sub={lang === "fr" ? "Sans cookie : nous aident à savoir combien de joueurs viennent" : "No cookies: they tell us how many players come by"}
          >
            <Switch on={stats} onClick={toggleStats} label={lang === "fr" ? "Statistiques de visite" : "Visit stats"} />
          </Row>
        </div>
        <a href={FEEDBACK_HREF} className="pr-btn is-sm mt-3 w-full" translate="no">
          {lang === "fr" ? "✉ Donner mon avis · signaler un bug" : "✉ Send feedback · report a bug"}
        </a>
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]" translate="no">
          {LEGAL_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[#e5c779] hover:underline">
              {lang === "fr" ? l.fr : l.en}
            </a>
          ))}
        </nav>
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
          <button type="button" className="pr-btn is-sm" onClick={() => void saveName()}>
            Save
          </button>
        </div>
        {(live?.msg || nameMsg) && (
          <p className={`st-sub mt-1 ${live ? (live.ok ? "!text-emerald-300" : "!text-red-300") : ""}`} translate="no">
            {live?.msg ?? nameMsg}
          </p>
        )}
        <AccountStats />
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
