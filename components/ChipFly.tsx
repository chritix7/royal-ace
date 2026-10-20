"use client";

import { useEffect, useState } from "react";

type Chip = { id: number; x: number; y: number; delay: number };

let chipId = 0;

export default function ChipFly() {
  const [chips, setChips] = useState<Chip[]>([]);

  useEffect(() => {
    function fly(e: Event) {
      const detail = (e as CustomEvent).detail ?? {};
      const count = Math.min(Math.max(detail.count ?? 6, 3), 12);

      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>("[data-chips-counter]"),
      );

      let target: HTMLElement | null = null;

      for (const el of candidates) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          target = el;
          break;
        }

        const child = el.querySelector<HTMLElement>("*");
        if (child) {
          const cr = child.getBoundingClientRect();
          if (cr.width > 0 && cr.height > 0) {
            target = child;
            break;
          }
        }
      }

      if (!target) return;

      const t = target.getBoundingClientRect();
      const tx = t.left + t.width / 2;
      const ty = t.top + t.height / 2;

      const startX = window.innerWidth / 2;
      const startY = window.innerHeight * 0.62;

      const batch: Chip[] = Array.from({ length: count }, () => ({
        id: chipId++,
        x: startX + (Math.random() - 0.5) * 140,
        y: startY + (Math.random() - 0.5) * 80,
        delay: Math.random() * 220,
      }));

      setChips((prev) => [...prev, ...batch]);

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setChips((prev) =>
            prev.map((c) =>
              batch.some((b) => b.id === c.id) ? { ...c, x: tx, y: ty } : c,
            ),
          );
        }),
      );

      window.setTimeout(() => {
        setChips((prev) =>
          prev.filter((c) => !batch.some((b) => b.id === c.id)),
        );
      }, 1500);
    }

    window.addEventListener("royalace:chip-fly", fly);
    return () => window.removeEventListener("royalace:chip-fly", fly);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {chips.map((c) => (
        <span
          key={c.id}
          className="absolute h-4 w-4 rounded-full bg-gradient-to-b from-[#efcf83] to-[#b9913f] shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
          style={{
            left: c.x,
            top: c.y,
            transform: "translate(-50%, -50%)",
            transition:
              "left 950ms cubic-bezier(0.2, 0.7, 0.3, 1), top 950ms cubic-bezier(0.2, 0.7, 0.3, 1)",
            transitionDelay: `${c.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}