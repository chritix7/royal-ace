"use client";

import { useEffect, useRef, useState } from "react";

type Chip = { id: number; sx: number; sy: number; tx: number; ty: number; delay: number; size: number; spin: number };

let chipId = 0;

export default function ChipFly() {
  const [chips, setChips] = useState<Chip[]>([]);
  const refs = useRef(new Map<number, HTMLElement>());

  useEffect(() => {
    function fly(e: Event) {
      const detail = (e as CustomEvent).detail ?? {};
      const count = Math.min(Math.max(detail.count ?? 6, 3), 12);

      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>("[data-chips-counter]"),
      );

      const isVisible = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };

      const findVisible = (selector: string) => {
        for (const el of Array.from(
          document.querySelectorAll<HTMLElement>(selector),
        )) {
          if (isVisible(el)) return el;
          const child = el.querySelector<HTMLElement>("*");
          if (child && isVisible(child)) return child;
        }
        return null;
      };

      const target =
        findVisible('[data-chips-counter="fullscreen"]') ??
        findVisible('[data-chips-counter="header"]');

      if (!target) return;

      const t = target.getBoundingClientRect();
      const tx = t.left + t.width / 2;
      const ty = t.top + t.height / 2;

      const startX = window.innerWidth / 2;
      const startY = window.innerHeight * 0.62;

      const batch: Chip[] = Array.from({ length: count }, () => ({
        id: chipId++,
        sx: startX + (Math.random() - 0.5) * 160,
        sy: startY + (Math.random() - 0.5) * 90,
        tx,
        ty,
        delay: Math.random() * 250,
        size: 14 + Math.random() * 8,
        spin: (Math.random() - 0.5) * 540,
      }));

      setChips((prev) => [...prev, ...batch]);

      requestAnimationFrame(() => {
        batch.forEach((c) => {
          const el = refs.current.get(c.id);
          if (!el) return;

          const midX = (c.sx + c.tx) / 2 + (Math.random() - 0.5) * 120;
          const midY = Math.min(c.sy, c.ty) - 90 - Math.random() * 70;

          el.animate(
  [
    {
      transform: `translate(-50%, -50%) translate(${c.sx}px, ${c.sy}px) scale(0.6) rotateY(0deg)`,
      opacity: 0,
    },
    {
      transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px) scale(1.15) rotateY(${c.spin / 2}deg)`,
      opacity: 1,
      offset: 0.35,
    },
    {
      transform: `translate(-50%, -50%) translate(${c.tx}px, ${c.ty}px) scale(0.5) rotateY(${c.spin}deg)`,
      opacity: 1,
      offset: 0.82,
    },
    {
      transform: `translate(-50%, -50%) translate(${c.tx}px, ${c.ty}px) scale(0.15) rotateY(${c.spin}deg)`,
      opacity: 0,
    },
  ],
  {
    duration: 950,
    delay: c.delay,
    easing: "cubic-bezier(0.3, 0.6, 0.25, 1)",
    fill: "both",
  },
);
        });
      });

      window.setTimeout(() => {
        setChips((prev) =>
          prev.filter((c) => !batch.some((b) => b.id === c.id)),
        );
      }, 1400);
    }

    window.addEventListener("royalace:chip-fly", fly);
    return () => window.removeEventListener("royalace:chip-fly", fly);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] [perspective:800px]">
      {chips.map((c) => (
        <span
          key={c.id}
          ref={(el) => {
            if (el) refs.current.set(c.id, el);
            else refs.current.delete(c.id);
          }}
          className="absolute left-0 top-0 rounded-full"
          style={{
            width: c.size,
            height: c.size,
            transform: `translate(-50%, -50%) translate(${c.sx}px, ${c.sy}px)`,
            background:
              "radial-gradient(circle at 32% 28%, #fff3c4 0%, #f5d67a 35%, #c9962f 70%, #8a6414 100%)",
            boxShadow:
              "inset 0 2px 3px rgba(255,255,255,0.65), inset 0 -3px 5px rgba(0,0,0,0.45), 0 3px 8px rgba(0,0,0,0.55)",
            border: "1px solid rgba(120,84,20,0.8)",
          }}
        >
          <span
            className="absolute inset-[22%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.55), rgba(160,110,25,0.35) 70%)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5)",
            }}
          />
        </span>
      ))}
    </div>
  );
}