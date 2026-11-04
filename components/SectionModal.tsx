"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Premium centered modal used for the sidebar sections (Session, Stats,
 * Coach, Count, Records). Same visual family as InsuranceModal and the
 * Vegas picker: dark backdrop with blur, gold-framed card sliding in
 * from above with a small overshoot, inner gold hairline, uppercase
 * title eyebrow, and an × close button in the top-right. Handles Esc,
 * backdrop clicks, and body-scroll lock while open.
 */
export default function SectionModal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  maxWidth = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  /** md = 28rem content, lg = 36rem, xl = 44rem. */
  maxWidth?: "md" | "lg" | "xl";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Freeze the body behind the modal so the page doesn't scroll under it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const widthClass =
    maxWidth === "xl"
      ? "max-w-2xl"
      : maxWidth === "lg"
        ? "max-w-xl"
        : "max-w-md";

  return createPortal(
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-vegas-fade sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* backdrop — click = close */}
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      {/* dialog card */}
      <div
        className={`relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-3xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-insurance-slide-in ${widthClass}`}
        style={{
          backgroundImage:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.15) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 60%, #070504 100%)",
        }}
      >
        {/* gold hairline frame */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[#d7b45b]/15"
        />

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 border-b border-[#d7b45b]/15 px-5 py-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7b45b]/70">
                {eyebrow}
              </p>
            )}
            <h3 className="text-base font-black tracking-wide text-white sm:text-lg">
              {title}
            </h3>
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

        {/* Scrollable body */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-color:#d7b45b40_transparent] [scrollbar-width:thin]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
