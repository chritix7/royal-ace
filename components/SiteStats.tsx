"use client";

import { useEffect } from "react";

/** Key set when the player turns visit statistics off (Settings > About). */
export const NO_STATS_KEY = "royalace:no-stats";

/**
 * Anonymous visit statistics (Vercel Web Analytics): no cookie, nothing
 * stored on the device, aggregate counts only. Not loaded once the player
 * opts out, and never on previews or localhost.
 */
export default function SiteStats() {
  useEffect(() => {
    try {
      if (localStorage.getItem(NO_STATS_KEY) === "1") return;
    } catch {}
    if (location.hostname !== "royal-ace.club") return;
    const w = window as unknown as { va?: (...a: unknown[]) => void; vaq?: unknown[][] };
    w.va = w.va || ((...a: unknown[]) => (w.vaq = w.vaq || []).push(a));
    const s = document.createElement("script");
    s.src = "/_vercel/insights/script.js";
    s.defer = true;
    document.head.appendChild(s);
  }, []);
  return null;
}
