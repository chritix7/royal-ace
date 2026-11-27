/**
 * A premium image of a ticket (black, carbon and gold), drawn on demand in
 * a canvas — nothing is loaded until the player taps "Share". Uses the
 * phone's share sheet when it accepts files, otherwise downloads the PNG.
 */
import type { Ticket } from "../useSportsbook";

const W = 1080;
const H = 1350;
const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
const odds = (o: number) => (o >= 100 ? o.toFixed(0) : o.toFixed(2));

function gold(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#fff3c4");
  g.addColorStop(0.45, "#e5c779");
  g.addColorStop(1, "#8f6a26");
  return g;
}
function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawTicket(t: Ticket): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  // Background: deep black with a carbon weave and a warm glow.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#141416");
  bg.addColorStop(1, "#050506");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#ffffff";
  for (let i = -H; i < W; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const glow = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 620);
  glow.addColorStop(0, "rgba(240,211,139,0.22)");
  glow.addColorStop(1, "rgba(240,211,139,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // Gold frame
  ctx.lineWidth = 6;
  ctx.strokeStyle = gold(ctx, 0, 0, W, H);
  rounded(ctx, 36, 36, W - 72, H - 72, 44);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = gold(ctx, 0, 90, 0, 170);
  ctx.font = "700 64px Georgia, 'Times New Roman', serif";
  ctx.fillText("CHRYSONYX", W / 2, 160);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "800 24px system-ui, sans-serif";
  ctx.fillText("S P O R T S B O O K", W / 2, 205);

  const label = t.status === "won" ? "WINNING TICKET" : t.status === "cashed" ? "CASHED OUT" : t.legs.length > 1 ? `COMBO · ${t.legs.length} PICKS` : "MY BET";
  ctx.fillStyle = "#f5d778";
  ctx.font = "700 46px Georgia, serif";
  ctx.fillText(label, W / 2, 300);

  // Picks
  const top = 360;
  const rowH = Math.min(96, Math.floor(560 / Math.max(1, t.legs.length)));
  t.legs.slice(0, 10).forEach((l, i) => {
    const y = top + i * rowH;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    rounded(ctx, 90, y, W - 180, rowH - 12, 18);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = "#f6e7bd";
    ctx.font = `800 ${Math.min(32, rowH * 0.36)}px system-ui, sans-serif`;
    ctx.fillText(fit(ctx, l.label, 640), 120, y + rowH * 0.42);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `500 ${Math.min(22, rowH * 0.25)}px system-ui, sans-serif`;
    ctx.fillText(fit(ctx, l.matchLabel, 640), 120, y + rowH * 0.74);
    ctx.textAlign = "right";
    ctx.fillStyle = l.result === "won" ? "#f5d778" : l.result === "lost" ? "#e98a8a" : "#efe2bd";
    ctx.font = `800 ${Math.min(34, rowH * 0.38)}px system-ui, sans-serif`;
    ctx.fillText(l.final ? `${l.final}  ${odds(l.odds)}` : odds(l.odds), W - 120, y + rowH * 0.56);
  });

  // Totals
  const y0 = H - 360;
  ctx.strokeStyle = "rgba(229,199,121,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, y0);
  ctx.lineTo(W - 90, y0);
  ctx.stroke();
  const cells: [string, string][] = [
    ["STAKE", `◈ ${fmt(t.stake)}`],
    ["ODDS", `×${odds(t.odds)}`],
    [t.status === "open" ? "TO WIN" : "PAID", `◈ ${fmt(t.status === "open" ? Math.min(1e9, t.stake * t.odds) : t.payout)}`],
  ];
  cells.forEach(([k, v], i) => {
    const x = 90 + ((W - 180) / 3) * (i + 0.5);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(229,199,121,0.75)";
    ctx.font = "900 22px system-ui, sans-serif";
    ctx.fillText(k, x, y0 + 70);
    ctx.fillStyle = i === 2 ? "#f5d778" : "#f6e7bd";
    ctx.font = `700 ${i === 2 ? 52 : 44}px Georgia, serif`;
    ctx.fillText(fit(ctx, v, (W - 180) / 3 - 10), x, y0 + 140);
  });
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "500 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Virtual chips only — no real money", W / 2, H - 90);
  return c;
}

export async function shareTicket(t: Ticket) {
  const c = drawTicket(t);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) return;
  const file = new File([blob], `chrysonyx-ticket-${t.id}.png`, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  try {
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: "Chrysonyx ticket" });
      return;
    }
  } catch {
    return; // cancelled
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
