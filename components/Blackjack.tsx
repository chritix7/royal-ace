"use client";

import { useEffect, useState } from "react";
import { useBlackjack } from "../lib/useBlackjack";
import { ambience } from "../lib/ambience";
import Sidebar from "./Sidebar";
import Table from "./Table";
import BlackjackImmersive from "./BlackjackImmersive";
import AchievementToast from "./AchievementToast";
import InsuranceModal from "./InsuranceModal";

/**
 * `focusMode` / `onFocusChange` are lifted up to the parent page so the
 * Focus toggle can live in the top toolbar alongside the game tabs and
 * audio controls. Blackjack only reads the flag and asks the parent to
 * close it when the immersive view's exit button is pressed.
 */
export default function Blackjack({
  active = true,
  focusMode = false,
  onFocusChange,
}: {
  active?: boolean;
  focusMode?: boolean;
  onFocusChange?: (next: boolean) => void;
}) {
  const g = useBlackjack(active);
  // Phones and tablets: what sits beside the table on PC (music, rules,
  // explore…) opens from the ☰ key on the felt.
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  // Room ambience only while the blackjack table is on screen.
  useEffect(() => {
    ambience.setWanted(active);
    return () => ambience.setWanted(false);
  }, [active]);

  // If we leave the tab while in focus mode, ask the parent to drop it
  // so coming back later shows the normal view.
  useEffect(() => {
    if (!active && focusMode && onFocusChange) onFocusChange(false);
  }, [active, focusMode, onFocusChange]);

  return (
    <>
      {active && <AchievementToast toast={g.s.toast} onDismiss={g.clearToast} />}
      {active && (
        <InsuranceModal
          open={g.s.phase === "insurance"}
          cost={g.s.hands.reduce((sum, h) => sum + h.bet, 0) / 2}
          busy={g.s.busy}
          onDecide={g.takeInsurance}
        />
      )}
      {focusMode && active ? (
        <BlackjackImmersive
          g={g}
          onClose={() => onFocusChange?.(false)}
        />
      ) : (
        /* Table + Sidebar as two aligned blocks. On lg: both reach the
           SAME bottom edge: the grid has a fixed height tied to the
           viewport and both children stretch to fill it (items-stretch).
           Sidebar scrolls internally when its content (Configure
           expanded, etc.) exceeds the grid height; Table lives inside
           a flex column that distributes the felt + actions up to the
           same line. */
        <div className="slots-view-in grid gap-4 lg:grid-cols-[1fr_300px] lg:h-[calc(100dvh-10rem)] lg:items-stretch lg:overflow-hidden">
          <Table g={g} onMenu={() => setMenu(true)} />
          <div className="contents max-lg:hidden">
            <Sidebar g={g} />
          </div>
        </div>
      )}
      {menu && !focusMode && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button aria-label="Close" className="backdrop-in absolute inset-0 cursor-default bg-black/55" onClick={() => setMenu(false)} />
          <div role="dialog" aria-modal="true" aria-label="Table menu" className="rl-sheet absolute inset-x-0 bottom-0 flex max-h-[82dvh] flex-col">
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#e5c779]">Table menu</p>
              <button type="button" onClick={() => setMenu(false)} className="rl-icon-key" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 [scrollbar-width:thin]" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.9rem)" }}>
              <Sidebar g={g} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}