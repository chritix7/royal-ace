"use client";

import type { GlobalStats } from "./statsStore";

/**
 * Render a shareable 1080x1080 session-summary card to a <canvas> and
 * trigger a PNG download. Works offline — the card is drawn from
 * primitives (paths, gradients, text) with no external fonts or images
 * so the player can share it even on a bad connection.
 *
 * All colors mirror the table's gold-on-charcoal palette so the snapshot
 * reads as the same product as the app.
 */

export type SessionShareInput = {
  stats: GlobalStats;
  bigWin?: { amount: number; kind: string } | null;
  streakBest?: number;
};

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function pct(num: number, den: number): string {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

export async function renderSessionShare({
  stats,
  bigWin,
  streakBest,
}: SessionShareInput): Promise<Blob> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  // Background — radial gold-tinted charcoal
  const bg = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, "#1b1612");
  bg.addColorStop(0.55, "#0f0c09");
  bg.addColorStop(1, "#050404");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Gold hairline frame
  ctx.strokeStyle = "rgba(215,180,91,0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = "rgba(215,180,91,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(54, 54, W - 108, H - 108);

  // Eyebrow
  ctx.fillStyle = "rgba(215,180,91,0.7)";
  ctx.font = "900 20px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ROYAL  ACE  ·  SESSION  SUMMARY", W / 2, 130);

  // Title
  const grad = ctx.createLinearGradient(0, 160, 0, 240);
  grad.addColorStop(0, "#f5d778");
  grad.addColorStop(1, "#c89a3f");
  ctx.fillStyle = grad;
  ctx.font = "900 90px 'Georgia', serif";
  ctx.fillText("My night at the table", W / 2, 240);

  // Date / sub
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "400 22px system-ui, -apple-system, sans-serif";
  const date = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.fillText(date, W / 2, 290);

  // Stats grid: 2x3
  const cells: Array<{ label: string; value: string }> = [
    { label: "Hands played", value: fmt(stats.bjHands) },
    { label: "Win rate", value: pct(stats.bjWins, stats.bjHands) },
    { label: "Blackjacks", value: fmt(stats.blackjacks) },
    { label: "Best streak", value: fmt(streakBest ?? 0) },
    { label: "Decision rate", value: pct(stats.correctDecisions, stats.bjHands) },
    { label: "Big wins", value: fmt(bigWin ? 1 : 0) },
  ];

  const cardW = 288;
  const cardH = 150;
  const colGap = 24;
  const rowGap = 24;
  const gridW = cardW * 3 + colGap * 2;
  const gridX = (W - gridW) / 2;
  const gridY = 360;

  cells.forEach((cell, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = gridX + col * (cardW + colGap);
    const y = gridY + row * (cardH + rowGap);

    // Card bg
    const cg = ctx.createLinearGradient(0, y, 0, y + cardH);
    cg.addColorStop(0, "rgba(255,255,255,0.03)");
    cg.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    roundRect(ctx, x, y, cardW, cardH, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(215,180,91,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(215,180,91,0.7)";
    ctx.font = "900 16px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(cell.label.toUpperCase(), x + 20, y + 42);

    // Value
    ctx.fillStyle = "#f0d38b";
    ctx.font = "900 54px 'Georgia', serif";
    ctx.fillText(cell.value, x + 20, y + 110);
  });

  // Big win feature strip
  if (bigWin) {
    const stripY = 760;
    const stripX = 90;
    const stripW = W - 180;
    const stripH = 140;
    const sg = ctx.createLinearGradient(0, stripY, 0, stripY + stripH);
    sg.addColorStop(0, "rgba(215,180,91,0.18)");
    sg.addColorStop(1, "rgba(215,180,91,0.04)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    roundRect(ctx, stripX, stripY, stripW, stripH, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(215,180,91,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(215,180,91,0.7)";
    ctx.font = "900 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("BIGGEST WIN", stripX + 28, stripY + 42);
    ctx.fillStyle = "#f5d778";
    ctx.font = "900 44px 'Georgia', serif";
    ctx.fillText(`◈ ${fmt(bigWin.amount)}`, stripX + 28, stripY + 96);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "400 22px system-ui, -apple-system, sans-serif";
    ctx.fillText(bigWin.kind, stripX + stripW - 28, stripY + 96);
  }

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(215,180,91,0.55)";
  ctx.font = "900 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("ROYAL  ACE  ·  PLAY  THE  NIGHT", W / 2, H - 80);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("canvas.toBlob returned null"));
    }, "image/png");
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Trigger a browser download of the rendered card. */
export async function downloadSessionShare(input: SessionShareInput) {
  const blob = await renderSessionShare(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `royal-ace-session-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the download doesn't race the GC.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
