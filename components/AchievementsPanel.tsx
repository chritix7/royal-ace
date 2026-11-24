"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { achievementsStore, challengeView, extrasView, milestoneView, useAchievements } from "../lib/achievementsStore";
import { GAMES } from "../lib/achievements";
import { useLocked } from "../lib/wallet";
import { useStats } from "../lib/statsStore";
import { useProgression } from "../lib/progression";

/** One challenge / milestone row. */
function Row({ title, progress, goal, reward, done, claimed, locked, onClaim, accent }: { title: string; progress: number; goal: number; reward: number; done: boolean; claimed: boolean; locked: boolean; onClaim: () => void; accent?: string }) {
  return (
    <li
      className={`relative overflow-hidden rounded-xl border px-3 py-2 transition sm:p-2.5 ${done ? "border-[#d7b45b]/60 bg-[#d7b45b]/[0.08]" : "border-white/[0.07] bg-black/30"}`}
      style={done ? { boxShadow: "0 0 14px rgba(229,199,121,0.18), inset 0 1px 0 rgba(229,199,121,0.15)" } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`min-w-0 text-xs font-bold leading-snug tracking-wide ${done ? "text-[#f5d778]" : "text-white/80"}`}>
          {accent && <span className="mr-1.5 rounded bg-white/[0.06] px-1.5 py-px text-[8.5px] font-black uppercase tracking-[0.15em] text-[#d7b45b]/80">{accent}</span>}
          {title}
        </p>
        <span className="shrink-0 text-xs font-black tabular-nums text-[#e5c779]">◈ {reward.toLocaleString("en-US")}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/45">
            <div className="h-full rounded-full bg-gradient-to-r from-[#8a6c2b] via-[#d7b45b] to-[#f0d38b] transition-all duration-500" style={{ width: `${Math.round((progress / goal) * 100)}%` }} />
          </div>
          <p className="mt-0.5 text-[10px] tabular-nums text-white/45">
            {progress.toLocaleString("en-US")} / {goal.toLocaleString("en-US")}
          </p>
        </div>
        {claimed ? (
          <span className="shrink-0 rounded-full border border-[#d7b45b]/40 bg-[#d7b45b]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#e5c779]/80">Claimed ✓</span>
        ) : (
          <button
            type="button"
            disabled={!done || locked}
            onClick={onClaim}
            title={done && locked ? "Finish the round in progress to claim" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:translate-y-px disabled:cursor-not-allowed ${
              done
                ? "border-[#d7b45b]/70 bg-gradient-to-b from-[#f0d38b] to-[#c89a3f] text-[#10130e] shadow-[0_2px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] enabled:hover:brightness-110 disabled:opacity-50"
                : "border-white/10 bg-white/[0.04] text-white/35"
            }`}
          >
            {done ? "Claim" : "In progress"}
          </button>
        )}
      </div>
    </li>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AchievementsPanel({ open, onClose }: Props) {
  const state = useAchievements();
  const locked = useLocked();
  // Career milestones read the lifetime stats and the level.
  useStats();
  useProgression();
  const [tab, setTab] = useState<"today" | "career">("today");

  // A new day may have started since the page was opened.
  useEffect(() => {
    if (open) achievementsStore.refresh();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const views = challengeView(state);
  const extras = extrasView(state);
  const career = milestoneView();
  const doneCount = views.filter((v) => v.done).length;
  const pct = views.length ? Math.round((doneCount / views.length) * 100) : 0;
  const toClaim =
    views.filter((v) => v.done && !v.claimed).reduce((sum, v) => sum + v.def.reward, 0) +
    extras.filter((x) => x.done && !x.claimed).reduce((sum, x) => sum + x.reward, 0);
  const careerToClaim = career.filter((m) => m.done && !m.claimed).length;

  return createPortal(
    <div
      className="safe-y fixed inset-0 z-[180] flex items-center justify-center p-4 animate-vegas-fade sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Daily challenges"
    >
      <button
        type="button"
        aria-label="Close daily challenges"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        className="relative flex max-h-[min(90vh,calc(100dvh_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom)_-_2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl lg:max-w-6xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-insurance-slide-in"
        style={{
          backgroundImage:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.15) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 60%, #070504 100%)",
        }}
      >
        {/* Inner gold hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[#d7b45b]/15"
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-3 border-b border-[#d7b45b]/15 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7b45b]/80">
              2 per game · new every day
            </p>
            <h2 className="font-display mt-0.5 text-lg font-black tracking-wide text-white sm:text-xl">
              Daily challenges
            </h2>
            <p className="mt-1 text-[11px] text-white/50">
              <span className="font-bold text-[#e5c779]">{doneCount}</span>{" "}
              {`of ${views.length} completed today`}
              {toClaim > 0 && (
                <>
                  {" · "}
                  <span className="font-bold text-[#f5d778]">
                    {`◈ ${toClaim.toLocaleString("en-US")} to claim`}
                  </span>
                </>
              )}
              {" · resets at midnight"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 outline-none transition hover:border-[#d7b45b]/60 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
          >
            ×
          </button>
        </div>

        {/* Progress gauge */}
        <div className="relative px-5 pt-3 sm:px-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/45">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8a6c2b] via-[#d7b45b] to-[#f0d38b] shadow-[0_0_10px_rgba(229,199,121,0.4)] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="relative px-5 pt-3 sm:px-6">
          <div className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-black/40 p-1">
            {(
              [
                ["today", "Today"],
                ["career", `Career${careerToClaim ? ` · ${careerToClaim} to claim` : ""}`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                className={`rounded-full py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition ${tab === id ? "bg-gradient-to-b from-[#f0d38b] to-[#c89a3f] text-[#10130e]" : "text-white/55 hover:text-[#e5c779]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-color:#d7b45b40_transparent] [scrollbar-width:thin] sm:px-6">
          {tab === "today" ? (
            <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-x-3 lg:gap-y-3 lg:space-y-0">
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-1 lg:self-end">
                {extras.map((x) => (
                  <Row key={x.id} title={x.title} progress={x.progress} goal={x.goal} reward={x.reward} done={x.done} claimed={x.claimed} locked={locked} onClaim={() => achievementsStore.claim(x.id)} accent={x.id === "chest" ? "Bonus" : "All games"} />
                ))}
              </ul>
              {GAMES.map((g) => {
                const list = views.filter((v) => v.def.game === g.id);
                if (!list.length) return null;
                return (
                  <section key={g.id}>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#d7b45b]/75">{g.label}</p>
                    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-1">
                      {list.map(({ def, progress, done, claimed }) => (
                        <Row key={def.id} title={def.title} progress={progress} goal={def.goal} reward={def.reward} done={done} claimed={claimed} locked={locked} onClaim={() => achievementsStore.claim(def.id)} />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-3 lg:space-y-0">
              <p className="text-[11px] text-white/50 lg:col-span-4">Milestones earned once for good, from everything you have played so far.</p>
              {[...GAMES, { id: "all" as const, label: "Royal Ace" }].map((g) => {
                const list = career.filter((m) => m.def.game === g.id);
                if (!list.length) return null;
                return (
                  <section key={g.id}>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#d7b45b]/75">{g.label}</p>
                    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-1">
                      {list.map(({ def, progress, done, claimed }) => (
                        <Row key={def.id} title={def.title} progress={progress} goal={def.goal} reward={def.reward} done={done} claimed={claimed} locked={locked} onClaim={() => achievementsStore.claimMilestone(def.id)} />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
