"use client";

import { useEffect, useRef, useState } from "react";
import CoinRain from "./CoinRain";
import { money } from "../lib/game";
import { wallet } from "../lib/wallet";

/**
 * Every notice of Chrysonyx goes through here (sports tickets, level up,
 * challenges, career badges, slot ranks…), so they all look the same:
 * a slim gold card at the top, two at most, gone in a few seconds.
 * Tap to act or dismiss, swipe up to dismiss.
 *   window.dispatchEvent(new CustomEvent("royal-ace:toast", { detail }))
 * Big wins rain coins on PC only (phones stay light).
 */
export type ToastKind = "win" | "loss" | "info" | "level" | "challenge" | "badge" | "rank";
type Toast = {
  id: number;
  kind: ToastKind;
  /** Small caps line (optional). */
  eyebrow?: string;
  title: string;
  text?: string;
  amount?: number;
  big?: boolean;
  /** Sports tab to open on tap. */
  game?: string;
  /** "challenges": opens the challenges panel on tap. */
  action?: "challenges" | "settings";
  ms?: number;
};

const ICON: Record<ToastKind, string> = { win: "◈", loss: "✕", info: "↺", level: "★", challenge: "✓", badge: "♛", rank: "♛" };
const LIFE: Record<ToastKind, number> = { win: 4200, loss: 3200, info: 3200, level: 3600, challenge: 3600, badge: 3600, rank: 3400 };
const EXIT = 260;

let nextId = 1;

export function toast(detail: Omit<Toast, "id">) {
  window.dispatchEvent(new CustomEvent("royal-ace:toast", { detail }));
}

export default function GameToasts() {
  const [toasts, setToasts] = useState<(Toast & { leaving?: boolean })[]>([]);
  const [rain, setRain] = useState(0);
  const timers = useRef(new Map<number, number>());
  const drag = useRef<{ id: number; y: number } | null>(null);

  const dismiss = (id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), EXIT);
  };

  useEffect(() => {
    const onToast = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<Toast, "id"> | undefined;
      if (!d || !d.title) return;
      const t: Toast = { ...d, kind: d.kind ?? "info", id: nextId++ };
      const life = t.ms ?? (t.big ? 5200 : LIFE[t.kind] ?? 3400);
      setToasts((list) => {
        // Two on screen at most: the oldest goes first.
        const live = list.filter((x) => !x.leaving);
        if (live.length >= 2) window.setTimeout(() => dismissRef.current(live[0].id), 0);
        return [...list, t];
      });
      if (t.big && window.matchMedia("(min-width: 1024px)").matches) setRain((n) => n + 1);
      timers.current.set(t.id, window.setTimeout(() => dismissRef.current(t.id), life));
    };
    window.addEventListener("royal-ace:toast", onToast);
    return () => window.removeEventListener("royal-ace:toast", onToast);
  }, []);
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  useEffect(() => {
    if (!rain) return;
    const t = window.setTimeout(() => setRain(0), 3200);
    return () => window.clearTimeout(t);
  }, [rain]);

  return (
    <>
      {rain > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[90]" key={rain}>
          <CoinRain count={46} />
        </div>
      )}
      <div className="ga-toasts" aria-live="polite">
        {toasts.map((t) => {
          const life = t.ms ?? (t.big ? 5200 : LIFE[t.kind] ?? 3400);
          return (
            <button
              key={t.id}
              type="button"
              className={`ga-toast is-${t.kind} ${t.big ? "is-big" : ""} ${t.leaving ? "is-leaving" : ""}`}
              onPointerDown={(e) => (drag.current = { id: t.id, y: e.clientY })}
              onPointerUp={(e) => {
                const d = drag.current;
                drag.current = null;
                if (d && d.id === t.id && d.y - e.clientY > 24) dismiss(t.id);
              }}
              onClick={() => {
                dismiss(t.id);
                if (t.action === "challenges") window.dispatchEvent(new CustomEvent("royal-ace:open-challenges"));
                if (t.action === "settings") window.dispatchEvent(new CustomEvent("royal-ace:settings"));
                else if (t.game && !wallet.getLocked()) window.dispatchEvent(new CustomEvent("royal-ace:goto-tab", { detail: t.game }));
              }}
            >
              <span className="ga-toast__icon" aria-hidden="true">
                {ICON[t.kind] ?? "◈"}
              </span>
              <span className="min-w-0 flex-1 text-left">
                {t.eyebrow && <span className="ga-toast__eyebrow">{t.eyebrow}</span>}
                <span className="ga-toast__title">{t.title}</span>
                {t.text && <span className="ga-toast__text">{t.text}</span>}
              </span>
              {t.amount && t.kind !== "loss" ? <span className="ga-toast__amount">{`+◈ ${money(t.amount)}`}</span> : null}
              <i className="ga-toast__life" style={{ animationDuration: `${life}ms` }} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </>
  );
}
