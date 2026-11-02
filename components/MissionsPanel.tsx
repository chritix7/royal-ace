"use client";

import type { Mission } from "../lib/missions";
import { money } from "../lib/game";

/**
 * Daily missions widget. Three stacked rows, each with the label, a
 * compact progress bar and a counter ("N / target"). Completed missions
 * render a gold star + strikethrough label.
 *
 * Rendered on both the classic sidebar and the immersive InfoPanel so
 * the player can check progress wherever they are.
 */
export default function MissionsPanel({ missions }: { missions: Mission[] }) {
  if (!missions.length) return null;
  const completed = missions.filter((m) => m.completed).length;

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Daily missions</h3>
        <span className="text-[11px] font-black uppercase tracking-wider text-[#e5c779]">
          {completed} / {missions.length}
        </span>
      </div>

      <p className="mt-1 text-[11px] text-white/40">
        Three goals that refresh at midnight. Keep an eye on your progress.
      </p>

      <ul className="mt-4 space-y-3">
        {missions.map((m) => (
          <li key={m.id}>
            <MissionRow mission={m} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MissionRow({ mission: m }: { mission: Mission }) {
  const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
  const isProfit = m.type === "profit";
  const progressLabel = isProfit
    ? `◈ ${money(m.progress)} / ◈ ${money(m.target)}`
    : `${m.progress} / ${m.target}`;

  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        m.completed
          ? "border-[#e5c779]/50 bg-[#e5c779]/8"
          : "border-white/8 bg-white/[0.02]"
      }`}
      style={{ borderColor: m.completed ? "rgba(229,199,121,0.5)" : undefined }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold ${
              m.completed ? "text-[#e5c779]" : "text-white/85"
            }`}
          >
            <span className="mr-1.5 text-[#e5c779]">
              {m.completed ? "★" : "✦"}
            </span>
            {m.label}
          </p>
          <p
            className={`mt-0.5 text-[10px] tabular-nums ${
              m.completed ? "text-[#e5c779]/70" : "text-white/40"
            }`}
          >
            {m.completed ? "Complete" : progressLabel}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: m.completed
              ? "linear-gradient(90deg, #d7b45b, #f6e4a9)"
              : "linear-gradient(90deg, rgba(215,180,91,0.6), rgba(229,199,121,0.9))",
            boxShadow: m.completed
              ? "0 0 8px rgba(229,199,121,0.45)"
              : "0 0 4px rgba(215,180,91,0.25)",
          }}
        />
      </div>
    </div>
  );
}
