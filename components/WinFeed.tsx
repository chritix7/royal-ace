"use client";

import { useEffect, useState } from "react";

type Win = {
  id: number;
  player: string;
  game: string;
  amount: number;
  kind: "win" | "jackpot";
};

const PLAYERS = [
  "LuckyDragon", "AceHunter", "VIP_King", "NeonShark", "GoldRush",
  "MidnightAce", "ChipMaster", "RoyalFox", "SpinLord", "DiamondAce",
  "WildTiger", "CrownJewel", "HighRoller88", "BlackjackPro", "LuckyClover",
];

const GAMES = ["Royal Slots", "Blackjack", "Royal Slots", "Blackjack"];

let nextId = 1;

function randomWin(): Win {
  const roll = Math.random();
  const kind: Win["kind"] = roll > 0.93 ? "jackpot" : "win";

  const amount =
    kind === "jackpot"
      ? Math.round((4000 + Math.random() * 25000) / 50) * 50
      : Math.round((50 + Math.random() * 2500) / 10) * 10;

  return {
    id: nextId++,
    player: PLAYERS[Math.floor(Math.random() * PLAYERS.length)],
    game: GAMES[Math.floor(Math.random() * GAMES.length)],
    amount,
    kind,
  };
}

export default function WinFeed() {
  const [wins, setWins] = useState<Win[]>([]);

  useEffect(() => {
    setWins([randomWin()]);

    const interval = setInterval(() => {
      setWins((prev) => [randomWin(), ...prev].slice(0, 2));
    }, 2200 + Math.random() * 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      aria-live="polite"
      className="mx-auto mb-3 max-w-7xl overflow-hidden px-4 sm:px-8"
    >
      <div className="flex flex-col gap-1">
        {wins.map((w, i) => (
          <div
            key={w.id}
            className={`flex items-center gap-2 truncate rounded-full border px-3 py-1 text-[10px] transition-opacity sm:text-xs ${
              w.kind === "jackpot"
                ? "border-[#e5c779]/60 bg-[#e5c779]/10 text-[#e5c779]"
                : "border-white/10 bg-white/[0.03] text-white/55"
            } ${i === 0 ? "opacity-100" : "opacity-60"}`}
          >
            <span aria-hidden="true">
              {w.kind === "jackpot" ? "💎" : w.game === "Blackjack" ? "♠️" : "🎰"}
            </span>

            <span className="truncate">
              <span className="font-bold text-white/80">{w.player}</span>
              {w.kind === "jackpot"
                ? " hit a JACKPOT — "
                : ` won ◈ ${w.amount.toLocaleString("en-US")} on `}
              {w.kind === "jackpot" && (
                <span className="font-bold">◈ {w.amount.toLocaleString("en-US")}</span>
              )}
              {w.kind === "win" && <span className="text-white/70">{w.game}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}