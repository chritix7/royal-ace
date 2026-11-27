"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { careerStore, useCareer } from "../lib/career";
import { useBoard } from "../lib/leaderboard";
import { vipTierForLevel } from "../lib/daily";
import { useProfile } from "../lib/profile";
import { useProgression } from "../lib/progression";
import { useStats } from "../lib/statsStore";
import { useShop } from "../lib/shop";
import { AvatarBadge, useTitle } from "./Avatar";
import RankingPanel from "./RankingPanel";

const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
const signed = (n: number) => `${n >= 0 ? "+" : "−"}◈ ${fmt(Math.abs(n))}`;
const GAME_NAME: Record<string, string> = { bj: "Blackjack", slots: "Slot machine", roulette: "Roulette", poker: "Hold'em", craps: "Craps", penalty: "Penalty", sports: "Sportsbook" };

/** VIP card and weekly ranking, opened from the lobby. */
export default function ProfileSheet({ tab: first, onClose }: { tab: "card" | "rank"; onClose: () => void }) {
  const [tab, setTab] = useState(first);
  const profile = useProfile();
  const prog = useProgression();
  const career = useCareer();
  const stats = useStats() as unknown as Record<string, number>;
  const me = useBoard().me;
  const myRank = me?.status === "ok" ? me.rank : 0;
  useEffect(() => {
    careerStore.hydrate();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const vip = vipTierForLevel(prog.level);
  const cardId = useShop().card;
  const title = useTitle();
  const cardFinish = cardId === "card:gold" ? "" : `is-${cardId.slice(5)}`;
  const name = profile.name || "Player";
  const rounds: [string, number][] = [
    ["bj", stats.bjHands ?? 0],
    ["slots", stats.spins ?? 0],
    ["roulette", stats.rouletteSpins ?? 0],
    ["poker", stats.pokerHands ?? 0],
    ["craps", stats.crapsRolls ?? 0],
    ["penalty", stats.penaltyRounds ?? 0],
    ["sports", stats.betsPlaced ?? 0],
  ];
  const fav = [...rounds].sort((a, b) => b[1] - a[1])[0];
  const total = rounds.reduce((s, [, n]) => s + n, 0);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="safe-y fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Profile">
      <button type="button" aria-label="Close" onClick={onClose} className="backdrop-in absolute inset-0 cursor-default bg-black/70" />
      <div className="lb-detail relative flex max-h-[min(92dvh,44rem)] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4">
          <div className="rl-tabs !grid-cols-2 flex-1" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "card"} onClick={() => setTab("card")} className={`rl-tab ${tab === "card" ? "is-on" : ""}`}>
              VIP card
            </button>
            <button type="button" role="tab" aria-selected={tab === "rank"} onClick={() => setTab("rank")} className={`rl-tab ${tab === "rank" ? "is-on" : ""}`}>
              Weekly ranking
            </button>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rl-icon-key">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
          {tab === "card" ? (
            <>
              <div className={`vip-card ${cardFinish}`}>
                <div className="flex items-start justify-between">
                  <span className="vip-card__brand">CHRYSONYX</span>
                  <span className="vip-card__tier">VIP · {vip.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="vip-card__chip" aria-hidden="true" />
                  <AvatarBadge size="md" />
                </div>
                <div>
                  <p className="vip-card__name" translate="no">{name}</p>
                  {title && <p className="pl-title -mt-0.5 text-[11px] uppercase !tracking-[0.22em]">{title}</p>}
                </div>
                <div className="flex items-end justify-between">
                  <span className="vip-card__meta">Level {prog.level} · member since {career.since || "today"}</span>
                  <span className="vip-card__rank">#{myRank || "—"} this week</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(
                  [
                    ["Net result", signed(career.allNet)],
                    ["Total staked", `◈ ${fmt(career.allWagered)}`],
                    ["Biggest win", career.biggest ? `◈ ${fmt(career.biggest.amount)}` : "—"],
                    ["Won at", career.biggest ? GAME_NAME[career.biggest.game] ?? career.biggest.game : "—"],
                    ["Favourite game", fav && fav[1] > 0 ? GAME_NAME[fav[0]] : "—"],
                    ["Rounds played", fmt(total)],
                    ["This week", signed(career.weekNet)],
                    ["Weekly rank", myRank ? `#${myRank}` : "—"],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="lb-fact">
                    <span className="lb-fact__k">{k}</span>
                    <span className="lb-fact__v">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[10px] text-white/35">Money figures count from {career.since || "today"}. Virtual chips only.</p>
            </>
          ) : (
            <RankingPanel onJoin={onClose} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
