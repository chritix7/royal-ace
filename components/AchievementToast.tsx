"use client";

import { useEffect } from "react";
import { toast as showToast } from "./GameToasts";

/** Career badge earned at the table ("id|title|desc"), shown by the shared toast stack. */
export default function AchievementToast({ toast, onDismiss }: { toast: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const parts = toast.split("|");
    showToast({ kind: "badge", eyebrow: "Career badge earned", title: parts[1] ?? toast, text: parts[2] || undefined });
    onDismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);
  return null;
}
