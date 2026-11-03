"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * PWA install banner.
 *
 * Listens for the browser's `beforeinstallprompt` event (Chrome,
 * Edge, Samsung Internet, etc.) and surfaces a premium bottom banner
 * offering a one-tap "Add to Home Screen" install. Fires the saved
 * prompt on tap, remembers the dismissal in localStorage, and hides
 * on desktop (install UX there is already in the URL bar).
 *
 * iOS Safari doesn't fire beforeinstallprompt — handled separately
 * with a one-liner instruction when the UA matches.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "royalace:pwa-dismissed";
const SHOW_DELAY_MS = 2000;

export default function PwaInstallBanner() {
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already dismissed? never show again.
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* storage disabled — treat as fresh */
    }

    // Already running as an installed app? nothing to install.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS legacy flag
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return;

    // iOS Safari: no beforeinstallprompt — show a hint banner instead.
    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS) {
      const t = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, SHOW_DELAY_MS);
      return () => window.clearTimeout(t);
    }

    // Other mobile browsers: wait for beforeinstallprompt.
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      // Small delay so the banner doesn't slap the user right at load.
      window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const persistDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* silent */
    }
  };

  const close = () => {
    setLeaving(true);
    window.setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      setPrompt(null);
      setIosHint(false);
      persistDismiss();
    }, 260);
  };

  const install = async () => {
    if (!prompt) return;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      /* user cancelled or error — treat as dismiss */
    }
    close();
  };

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[150] flex justify-center p-3 sm:hidden"
      role="dialog"
      aria-label="Install Royal Ace"
    >
      <style>{`
        @keyframes pwa-slide-up {
          0% { transform: translateY(140%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pwa-slide-down {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(140%); opacity: 0; }
        }
      `}</style>

      <div
        className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-[#d7b45b]/55 p-3"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.18) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 100%)",
          boxShadow:
            "0 20px 44px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,199,121,0.15)",
          animation: leaving
            ? "pwa-slide-down 260ms ease-in both"
            : "pwa-slide-up 380ms cubic-bezier(0.22,0.9,0.3,1) both",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Gold medallion */}
          <div
            aria-hidden
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #f6e4a9 0%, #d7b45b 55%, #8a6c2b 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.6)",
            }}
          >
            <span
              className="font-serif text-base font-black leading-none"
              style={{ color: "#1a1612" }}
            >
              ♠
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-[9px] font-black uppercase tracking-[0.2em]"
              style={{
                color: "#e5c779",
                textShadow: "0 1px 0 rgba(0,0,0,0.9)",
              }}
            >
              Install Royal Ace
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-white/70">
              {iosHint
                ? "Tap Share → Add to Home Screen for the full-screen app."
                : "Add it to your home screen for a full-screen play experience."}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={close}
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75 outline-none transition hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e5c779]"
          >
            Not now
          </button>
          {!iosHint && (
            <button
              type="button"
              onClick={install}
              className="flex-1 rounded-full border border-[#d7b45b]/60 bg-gradient-to-b from-[#e5c779]/30 to-[#d7b45b]/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-[#f0d38b] shadow-[0_0_12px_rgba(215,180,91,0.25)] outline-none transition hover:border-[#e5c779] hover:from-[#e5c779]/40 hover:text-[#f7dd9b] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
