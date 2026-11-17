"use client";

import RollingNumber from "./RollingNumber";
import { JACKPOTS } from "../lib/jackpot";
import { CASE_ART } from "../lib/symbolArt";
import { VAULT_PICKS, prizeValue, settleVault } from "../lib/vault";
import type { VaultState } from "../lib/useSlots";
import { machineSmall } from "./ui";
import { useRef } from "react";
import { useModalFocus } from "./useModalFocus";

/** Bonus « Le coffre » : sélection et révélation des mallettes. */
export default function VaultGame({
  vault,
  onPick,
  onCollect,
}: {
  vault: VaultState;
  onPick: (i: number) => void;
  onCollect: () => void;
}) {
  const { prizes, picks, done, bet, pools } = vault;
  const panelRef = useRef<HTMLDivElement>(null);

  useModalFocus(panelRef);
  const result = settleVault(prizes, picks, pools, bet);

  return (
    <div
      className="absolute inset-0 z-40 overflow-y-auto bg-black/90 px-3 py-6 backdrop-blur-sm lg:flex lg:items-center lg:justify-center lg:py-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-title"
    >
      <div
  ref={panelRef}
  className="animate-pop relative mx-auto max-w-xl rounded-2xl border border-[#d7b45b]/45 p-3 text-center sm:p-5 lg:max-w-2xl"
        style={{
          background: "linear-gradient(180deg, rgba(255,236,170,0.06), transparent 30%), linear-gradient(135deg, #221b14 0%, #120e0b 50%, #0b0908 100%)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.7), 0 0 60px rgba(240,211,139,0.12), inset 0 1px 0 rgba(255,236,170,0.2)",
        }}
      >
        {/* Reflet sur le bord du coffre */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.30), transparent)",
          }}
        />

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">
          Vault bonus
        </p>

        <h3
          id="vault-title"
          className="font-display mt-2 text-2xl font-bold tracking-[0.16em] text-[#f0d38b] sm:text-4xl"
        >
          THE VAULT
        </h3>

        <p
          className="mt-2 text-xs text-white/60 sm:text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          {done
            ? `Your ${VAULT_PICKS} cases are open.`
            : `Open ${VAULT_PICKS} cases · ${picks.length} / ${VAULT_PICKS} opened`}
        </p>

        {/* Compartiments du coffre */}
        <div
          className="mt-4 grid grid-cols-4 gap-2 rounded-xl border border-[#d7b45b]/20 p-2 sm:mt-5 sm:gap-3 sm:p-3"
          style={{
            background:
              "linear-gradient(180deg, #0d0b09 0%, #060504 100%)",
            boxShadow:
              "inset 0 2px 7px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {prizes.map((prize, i) => {
            const opened = picks.includes(i);
            const revealed = opened || done;
            const value = prizeValue(prize, pools, bet);
            const label =
              prize.kind === "jackpot"
                ? JACKPOTS[prize.tier].label
                : null;

            return (
              <button
                key={i}
                type="button"
                onClick={() => onPick(i)}
                disabled={opened || done}
                aria-label={
                  revealed
                    ? `Case ${i + 1}: ${
                        label ? `${label} jackpot, ` : ""
                      }${value} chips${opened ? ", selected" : ", not selected"}`
                    : `Open case ${i + 1}`
                }
                className={`relative flex aspect-square min-w-0 lg:aspect-[5/4] items-center justify-center rounded-lg border p-1 outline-none transition-[transform,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-default motion-reduce:transition-none ${
                  opened
                    ? label
                      ? "border-[#d7b45b]/80"
                      : "border-emerald-300/50"
                    : done
                      ? "border-white/10"
                      : "border-[#d7b45b]/25 enabled:hover:-translate-y-0.5 enabled:hover:border-[#f0d38b] enabled:hover:shadow-[0_0_18px_rgba(240,211,139,0.3)] enabled:active:translate-y-px"
                }`}
                style={{
                  background: opened
                    ? label
                      ? "linear-gradient(180deg, #373021 0%, #191712 100%)"
                      : "linear-gradient(180deg, #1b2c29 0%, #101a19 100%)"
                    : "linear-gradient(180deg, #2a2420 0%, #17130f 55%, #0d0b09 100%)",
                  boxShadow: opened
                    ? "inset 0 2px 5px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.05)"
                    : "0 2px 0 #06080d, inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 4px rgba(0,0,0,0.30)",
                }}
              >
                {revealed ? (
                  <span
                    className={`flex h-full w-full min-w-0 flex-col items-center justify-center gap-0.5 ${
                      opened ? "" : "opacity-40"
                    }`}
                  >
                    {label && (
                      <span className="max-w-full text-[7px] font-black tracking-wide text-[#e7cc8d] sm:text-[10px]">
                        {label}
                      </span>
                    )}

                    <span className="max-w-full break-words font-mono text-[10px] font-black leading-tight tabular-nums text-white/90 sm:text-sm">
                      ◈ {value.toLocaleString("en-US")}
                    </span>
                  </span>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute left-1.5 top-1 text-[7px] font-bold tabular-nums text-white/35 sm:text-[9px]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <img
                      src={CASE_ART}
                      alt=""
                      draggable={false}
                      className="h-[82%] w-[82%] select-none object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.45)]"
                    />
                  </>
                )}
              </button>
            );
          })}
        </div>

        {done && (
          <div className="mt-5 lg:mt-4 lg:grid lg:grid-cols-[1fr_200px] lg:items-stretch lg:gap-3">
            <div
              className="rounded-xl border border-[#d7b45b]/25 px-3 py-3"
              style={{
                background:
                  "linear-gradient(180deg, #0d0b09 0%, #060504 100%)",
                boxShadow:
                  "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">
                Total vault win
              </p>

              <p className="mt-1 break-words font-mono text-2xl font-black tabular-nums text-[#fff1bf] [text-shadow:0_0_18px_rgba(240,211,139,0.45)] sm:text-3xl">
                <span className="text-[#bfa76e]">◈</span>{" "}
                <RollingNumber
                  value={result.total}
                  fromZero
                  ms={1200}
                />
              </p>

              {result.jackpots.length > 0 && (
                <p className="mt-1 text-[10px] font-black tracking-[0.15em] text-[#e7cc8d]">
                  JACKPOT!
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onCollect}
              className={`${machineSmall} mt-4 w-full !rounded-xl py-3 text-sm font-black tracking-widest !border-[#f0d38b] !text-[#1b1305] lg:mt-0`}
              style={{
                background: "linear-gradient(180deg, #fff1bf 0%, #e9c56e 45%, #b8873a 100%)",
              }}
            >
              COLLECT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}