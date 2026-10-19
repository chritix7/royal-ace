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
      className="absolute inset-0 z-40 overflow-y-auto bg-black/90 px-3 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-title"
    >
      <div
  ref={panelRef}
  className="relative mx-auto max-w-xl rounded-2xl border border-white/20 p-3 text-center sm:p-5"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 25%), linear-gradient(135deg, #292b35 0%, #171923 45%, #10121a 100%)",
          boxShadow:
            "0 18px 45px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.50)",
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

        <p className="text-[9px] uppercase tracking-[0.25em] text-white/40">
          Private collection
        </p>

        <h3
          id="vault-title"
          className="mt-2 text-2xl font-black tracking-[0.16em] text-[#ead5a3] sm:text-3xl"
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
          className="mt-4 grid grid-cols-4 gap-2 rounded-xl border border-white/10 p-2 sm:mt-5 sm:gap-3 sm:p-3"
          style={{
            background:
              "linear-gradient(180deg, #090c13 0%, #11141d 100%)",
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
                className={`relative flex aspect-square min-w-0 items-center justify-center rounded-lg border p-1 outline-none transition-[transform,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-default motion-reduce:transition-none ${
                  opened
                    ? label
                      ? "border-[#d7b45b]/80"
                      : "border-emerald-300/50"
                    : done
                      ? "border-white/10"
                      : "border-white/20 enabled:hover:border-[#d7b45b]/70 enabled:active:translate-y-px"
                }`}
                style={{
                  background: opened
                    ? label
                      ? "linear-gradient(180deg, #373021 0%, #191712 100%)"
                      : "linear-gradient(180deg, #1b2c29 0%, #101a19 100%)"
                    : "linear-gradient(180deg, #30323c 0%, #20222c 40%, #151720 100%)",
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
          <div className="mt-5">
            <div
              className="rounded-xl border border-white/10 px-3 py-3"
              style={{
                background:
                  "linear-gradient(180deg, #10131c 0%, #080b12 100%)",
                boxShadow:
                  "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">
                Total vault win
              </p>

              <p className="mt-1 break-words font-mono text-2xl font-black tabular-nums text-[#f0dfb7] sm:text-3xl">
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
              className={`${machineSmall} mt-4 w-full py-3 !border-[#d7b45b]/70 !text-[#f0dfb7]`}
              style={{
                background:
                  "linear-gradient(180deg, #49402d 0%, #302a20 50%, #211e19 100%)",
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