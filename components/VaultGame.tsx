"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import RollingNumber from "./RollingNumber";
import { JACKPOTS } from "../lib/jackpot";
import { CASE_ART } from "../lib/symbolArt";
import { VAULT_PICKS, prizeValue, settleVault } from "../lib/vault";
import type { VaultState } from "../lib/useSlots";
import { useModalFocus } from "./useModalFocus";

/**
 * Vault bonus: a full-screen strongroom above everything (the machine's
 * frame was too tight), cases sized to fit any screen, a running total
 * and the Collect key always in view. Static gold, no blur, transform-only
 * motion: premium and light.
 */
export default function VaultGame({ vault, onPick, onCollect }: { vault: VaultState; onPick: (i: number) => void; onCollect: () => void }) {
  const { prizes, picks, done, bet, pools } = vault;
  const panelRef = useRef<HTMLDivElement>(null);
  useModalFocus(panelRef);
  const result = settleVault(prizes, picks, pools, bet);
  const secured = picks.reduce((t, i) => t + prizeValue(prizes[i], pools, bet), 0);
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="vault-screen" role="dialog" aria-modal="true" aria-labelledby="vault-title">
      <div ref={panelRef} className="vault-door blur-in">
        <span className="vault-door__bolt is-tl" aria-hidden="true" />
        <span className="vault-door__bolt is-tr" aria-hidden="true" />
        <span className="vault-door__bolt is-bl" aria-hidden="true" />
        <span className="vault-door__bolt is-br" aria-hidden="true" />

        <header className="vault-head">
          <p className="vault-head__kicker">Vault bonus</p>
          <h3 id="vault-title" className="vault-head__title">
            THE VAULT
          </h3>
          <div className="vault-pips" aria-live="polite" aria-label={`${picks.length} of ${VAULT_PICKS} cases opened`}>
            {Array.from({ length: VAULT_PICKS }, (_, k) => (
              <i key={k} className={k < picks.length ? "is-on" : ""} />
            ))}
            <span>{done ? "All cases open" : `Pick ${VAULT_PICKS - picks.length} more`}</span>
          </div>
        </header>

        <div className="vault-grid">
          {prizes.map((prize, i) => {
            const opened = picks.includes(i);
            const revealed = opened || done;
            const value = prizeValue(prize, pools, bet);
            const label = prize.kind === "jackpot" ? JACKPOTS[prize.tier].label : null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPick(i)}
                disabled={opened || done}
                aria-label={revealed ? `Case ${i + 1}: ${label ? `${label} jackpot, ` : ""}${value} chips${opened ? ", selected" : ", not selected"}` : `Open case ${i + 1}`}
                className={`vault-case ${opened ? (label ? "is-jackpot" : "is-open") : done ? "is-missed" : ""}`}
              >
                {revealed ? (
                  <span className="vault-case__prize">
                    {label && <span className="vault-case__label">{label}</span>}
                    <span className="vault-case__value">◈ {value.toLocaleString("en-US")}</span>
                  </span>
                ) : (
                  <>
                    <span aria-hidden="true" className="vault-case__num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <img src={CASE_ART} alt="" draggable={false} className="vault-case__art" />
                  </>
                )}
              </button>
            );
          })}
        </div>

        <footer className="vault-foot">
          <div className="vault-total">
            <span className="vault-total__label">{done ? "Total vault win" : "Secured so far"}</span>
            <span className="vault-total__value">
              <span className="text-[#bfa76e]">◈</span> <RollingNumber value={done ? result.total : secured} ms={700} />
            </span>
            {done && result.jackpots.length > 0 && <span className="vault-total__jp">JACKPOT!</span>}
          </div>
          <button type="button" onClick={onCollect} disabled={!done} className="lux-btn lux-btn--gold vault-collect">
            {done ? "COLLECT" : `${picks.length} / ${VAULT_PICKS}`}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
