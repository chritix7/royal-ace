"use client";

import RollingNumber from "./RollingNumber";
import { JACKPOTS } from "../lib/jackpot";
import { CASE_ART } from "../lib/symbolArt";
import { VAULT_PICKS, prizeValue, settleVault } from "../lib/vault";
import type { VaultState } from "../lib/useSlots";

/** Bonus « Le coffre » : 12 mallettes, tu en ouvres 3. */
export default function VaultGame({ vault, onPick, onCollect }: { vault: VaultState; onPick: (i: number) => void; onCollect: () => void }) {
  const { prizes, picks, done, bet, pools } = vault;
  const result = settleVault(prizes, picks, pools, bet);

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-black/85 px-3 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Vault bonus">
      <div className="mx-auto max-w-xl text-center">
        <h3 className="text-3xl font-black tracking-[0.2em] text-[#ffd166] [text-shadow:0_0_20px_#ff2e88] sm:text-4xl">THE VAULT</h3>
        <p className="mt-1 text-sm text-white/70" aria-live="polite">
          {done ? "Your three cases are open." : `Open ${VAULT_PICKS} cases · ${picks.length} / ${VAULT_PICKS} opened`}
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
          {prizes.map((prize, i) => {
            const opened = picks.includes(i);
            const value = prizeValue(prize, pools, bet);
            const label = prize.kind === "jackpot" ? JACKPOTS[prize.tier].label : null;
            return (
              <button
                key={i}
                onClick={() => onPick(i)}
                disabled={opened || done}
                aria-label={opened || done ? `Case ${i + 1}: ${label ? `${label} jackpot, ` : ""}${value} chips` : `Open case ${i + 1}`}
                className={`relative aspect-square rounded-xl border-2 p-1 outline-none transition focus-visible:ring-2 focus-visible:ring-white disabled:cursor-default ${
                  opened
                    ? label
                      ? "border-[#ffd166] bg-[#ffd166]/20 shadow-[0_0_24px_#ffd166aa]"
                      : "border-emerald-300/60 bg-emerald-500/15"
                    : done
                    ? "border-white/10 bg-white/5 opacity-50"
                    : "border-[#ff4fa3]/50 bg-white/5 hover:-translate-y-1 hover:border-[#ffd166]"
                }`}
              >
                {opened || done ? (
                  <span className={`animate-pop flex h-full flex-col items-center justify-center ${opened ? "" : "text-white/60"}`}>
                    {label && <span className="text-[9px] font-black tracking-widest text-[#ffd166] sm:text-xs">{label}</span>}
                    <span className="font-mono text-sm font-black text-white sm:text-lg">◈ {value.toLocaleString("en-US")}</span>
                  </span>
                ) : (
                  <img src={CASE_ART} alt="" draggable={false} className="h-full w-full select-none object-contain" />
                )}
              </button>
            );
          })}
        </div>

        {done && (
          <div className="mt-6">
            <p className="font-mono text-3xl font-black text-white sm:text-4xl">
              ◈ <RollingNumber value={result.total} fromZero ms={1200} />
            </p>
            {result.jackpots.length > 0 && <p className="mt-1 text-sm font-bold text-[#ffd166]">JACKPOT!</p>}
            <button
              onClick={onCollect}
              className="mt-4 rounded-full bg-[#ffd166] px-10 py-3 text-sm font-black tracking-widest text-[#10130e] outline-none transition hover:bg-[#ffe08f] focus-visible:ring-4 focus-visible:ring-white"
            >
              COLLECT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}