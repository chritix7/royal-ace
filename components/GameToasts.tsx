"use client";

import { useEffect, useState } from "react";
import CoinRain from "./CoinRain";
import { money } from "../lib/game";
import { wallet } from "../lib/wallet";

/**
 * Casino-wide notices from games that settle in the background (a sports
 * ticket won while you play roulette…). Any game can raise one with:
 *   window.dispatchEvent(new CustomEvent("royal-ace:toast", { detail }))
 * Big wins rain coins on PC only (phones stay light).
 */
type Toast = { id: number; kind: "win" | "loss" | "info"; title: string; text?: string; amount?: number; big?: boolean; game?: string };

let nextId = 1;

export default function GameToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [rain, setRain] = useState(0);
  useEffect(() => {
    const onToast = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<Toast, "id"> | undefined;
      if (!d || !d.title) return;
      const t: Toast = { ...d, id: nextId++ };
      setToasts((list) => [...list.slice(-2), t]);
      if (t.big && window.matchMedia("(min-width: 1024px)").matches) setRain((n) => n + 1);
      window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), t.kind === "win" ? 5200 : 3800);
    };
    window.addEventListener("royal-ace:toast", onToast);
    return () => window.removeEventListener("royal-ace:toast", onToast);
  }, []);
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
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ga-toast is-${t.kind} ${t.big ? "is-big" : ""}`}
            onClick={() => {
              setToasts((list) => list.filter((x) => x.id !== t.id));
              if (t.game && !wallet.getLocked()) window.dispatchEvent(new CustomEvent("royal-ace:goto-tab", { detail: t.game }));
            }}
          >
            <span className="ga-toast__icon" aria-hidden="true">
              {t.kind === "win" ? "◈" : t.kind === "loss" ? "✕" : "↺"}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="ga-toast__title">{t.title}</span>
              {t.text && <span className="ga-toast__text">{t.text}</span>}
            </span>
            {t.kind === "win" && t.amount ? <span className="ga-toast__amount">+◈ {money(t.amount)}</span> : null}
          </button>
        ))}
      </div>
    </>
  );
}
