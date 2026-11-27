"use client";

import { DOMAIN } from "./domain";

/**
 * Big-win sharing. Games call brag() on a big win; BragPrompt offers to
 * share it, with a picture card and a link back to Royal Ace. Each share
 * is a free invitation to the site.
 */
export type Brag = { game: string; amount: number; mult: number; jackpot?: string };

const GAP_MS = 90_000; // at most one prompt every 90 s, so it never nags
let last = 0;

export function brag(b: Brag) {
  if (b.amount <= 0 || typeof window === "undefined") return;
  const now = Date.now();
  if (now - last < GAP_MS) return;
  last = now;
  window.dispatchEvent(new CustomEvent("royal-ace:brag", { detail: b }));
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function bragText(b: Brag, fr: boolean) {
  const what = b.jackpot ? `${b.jackpot} jackpot` : b.mult >= 2 ? `×${Math.round(b.mult)}` : "";
  return fr
    ? `Je viens de gagner ◈ ${fmt(b.amount)}${what ? ` (${what})` : ""} au ${b.game} sur Royal Ace 🎰 Casino gratuit, jetons virtuels. Viens me battre :`
    : `I just won ◈ ${fmt(b.amount)}${what ? ` (${what})` : ""} on ${b.game} at Royal Ace 🎰 Free casino, virtual chips. Come beat me:`;
}
export const BRAG_URL = `https://${DOMAIN}/?ref=share`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A 1080×1080 card: game, BIG WIN, the amount, the address. Drawn locally, no network. */
export async function bragCard(b: Brag, name: string): Promise<Blob> {
  const W = 1080;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = W;
  const ctx = c.getContext("2d")!;
  const display = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "Georgia, serif";
  const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";
  try {
    await document.fonts?.load(`700 80px ${display}`);
  } catch {}

  const bg = ctx.createRadialGradient(W / 2, W * 0.45, 60, W / 2, W / 2, W * 0.75);
  bg.addColorStop(0, "#3a1a08");
  bg.addColorStop(0.45, "#140c08");
  bg.addColorStop(1, "#050404");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, W);
  // rays
  ctx.save();
  ctx.translate(W / 2, W * 0.47);
  for (let i = 0; i < 24; i++) {
    ctx.rotate((Math.PI * 2) / 24);
    ctx.fillStyle = i % 2 ? "rgba(240,211,139,0.035)" : "rgba(240,211,139,0.06)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-60, -W);
    ctx.lineTo(60, -W);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(215,180,91,0.55)";
  ctx.lineWidth = 3;
  roundRect(ctx, 40, 40, W - 80, W - 80, 36);
  ctx.stroke();

  const gold = (y0: number, y1: number) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "#fff3c6");
    g.addColorStop(0.5, "#e5c779");
    g.addColorStop(1, "#b8862f");
    return g;
  };
  ctx.textAlign = "center";
  ctx.fillStyle = gold(100, 170);
  ctx.font = `700 64px ${display}`;
  ctx.fillText("ROYAL  ACE", W / 2, 165);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `700 30px ${sans}`;
  ctx.fillText(b.game.toUpperCase(), W / 2, 240);

  ctx.fillStyle = gold(330, 450);
  ctx.font = `700 132px ${display}`;
  ctx.fillText(b.jackpot ? "JACKPOT" : "BIG WIN", W / 2, 440);

  const amt = `◈ ${fmt(b.amount)}`;
  let size = 150;
  ctx.font = `800 ${size}px ${sans}`;
  while (ctx.measureText(amt).width > W - 200 && size > 60) ctx.font = `800 ${(size -= 6)}px ${sans}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(255,170,40,0.55)";
  ctx.shadowBlur = 40;
  ctx.fillText(amt, W / 2, 620);
  ctx.shadowBlur = 0;

  const tag = b.jackpot ? b.jackpot.toUpperCase() : b.mult >= 2 ? `×${Math.round(b.mult)} THE BET` : "";
  if (tag) {
    ctx.font = `800 40px ${sans}`;
    const tw = ctx.measureText(tag).width + 60;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, (W - tw) / 2, 670, tw, 70, 35);
    ctx.fill();
    ctx.strokeStyle = "rgba(215,180,91,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f0d99a";
    ctx.fillText(tag, W / 2, 718);
  }
  if (name) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `600 34px ${sans}`;
    ctx.fillText(`— ${name} —`, W / 2, 810);
  }
  ctx.fillStyle = gold(880, 930);
  ctx.font = `700 46px ${display}`;
  ctx.fillText(DOMAIN, W / 2, 925);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `500 24px ${sans}`;
  ctx.fillText("Free casino · Virtual chips, no real money · 18+", W / 2, 975);

  return new Promise((res, rej) => c.toBlob((x) => (x ? res(x) : rej(new Error("no blob"))), "image/png"));
}
