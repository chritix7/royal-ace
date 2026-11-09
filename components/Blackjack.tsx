"use client";

import { useEffect } from "react";
import { useBlackjack } from "../lib/useBlackjack";
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
        <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:h-[calc(100dvh-10rem)] lg:items-stretch lg:overflow-hidden">
          <Table g={g} />
          <Sidebar g={g} />
        </div>
      )}
    </>
  );
}