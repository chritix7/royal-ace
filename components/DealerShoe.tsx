import { useEffect, useRef, useState } from "react";

type ShoeStatus = {
  label: string;
  tone: "gold" | "green" | "red" | "orange" | "white";
};

type DealerShoeProps = {
  className?: string;
  status?: ShoeStatus;
  dealTick?: number;
};

const CARD_BACK =
  "repeating-linear-gradient(45deg, #102d27 0 3px, #1b4034 3px 6px), linear-gradient(135deg, #245b49, #102b25)";

const STATUS_STYLES: Record<ShoeStatus["tone"], string> = {
  gold: "bg-[#e5c779] shadow-[0_0_12px_rgba(229,199,121,.9)]",
  green: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]",
  red: "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.9)]",
  orange: "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,.9)]",
  white: "bg-white shadow-[0_0_12px_rgba(255,255,255,.85)]",
};

function Card({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute h-[58px] w-[42px] overflow-hidden rounded-[4px] border border-[#c9ac65]/65 shadow-[0_7px_13px_rgba(0,0,0,.6)] ${className}`}
      style={{ background: CARD_BACK, ...style }}
    >
      <div className="absolute inset-[4px] rounded-[2px] border border-[#e4c879]/55" />
      <div className="absolute inset-[8px] rounded-[2px] border border-[#e4c879]/30" />
      <div className="absolute inset-0 flex items-center justify-center text-[15px] text-[#e4c879]/80">♠</div>
      <div className="absolute inset-x-1 top-[3px] h-px bg-white/25" />
    </div>
  );
}

export default function DealerShoe({
  className = "",
  status = { label: "Ready", tone: "gold" },
  dealTick = 0,
}: DealerShoeProps) {
  const [cycle, setCycle] = useState<"idle" | "dispense" | "refill">("idle");
  const firstTick = useRef(true);
  const tone = STATUS_STYLES[status.tone] ?? STATUS_STYLES.gold;
  const active = status.tone === "orange" || status.label.toLowerCase() === "dealing";

  useEffect(() => {
    if (firstTick.current) {
      firstTick.current = false;
      return;
    }
    setCycle("dispense");
    const refill = window.setTimeout(() => setCycle("refill"), 440);
    const idle = window.setTimeout(() => setCycle("idle"), 950);
    return () => {
      window.clearTimeout(refill);
      window.clearTimeout(idle);
    };
  }, [dealTick]);

  return (
    <div
      id="dealer-shoe"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "1700px" }}
    >
      <style>{`
        @keyframes shoe-stack-settle {
          0% { transform: translateY(-8px); }
          65% { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }
        @keyframes shoe-led-pulse {
          0%,100% { opacity:.55; transform:scale(.82); }
          50% { opacity:1; transform:scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .shoe-motion { animation-duration:.01ms !important; animation-iteration-count:1 !important; }
        }
      `}</style>

      {/* Keep the shoe's existing footprint and tabletop orientation. */}
      <div
        className="relative h-[230px] w-[300px] [transform-style:preserve-3d]"
        style={{ transform: "rotateX(56deg) rotateZ(-28deg)" }}
      >
        <div className="absolute left-2 top-24 h-[180px] w-[290px] rounded-[70px] bg-black/75 blur-3xl" style={{ transform: "translateZ(-55px)" }} />
        <div className="absolute left-10 top-32 h-[110px] w-[240px] rounded-full bg-[#d7b45b]/10 blur-2xl" style={{ transform: "translateZ(-35px)" }} />

        {/* Compact Vegas-style shoe body: one clear shell with a visible deck well. */}
        <div className="absolute left-[20px] top-[48px] h-[160px] w-[260px] rounded-[25px] border border-[#d7c184]/55 bg-gradient-to-br from-[#555a52] via-[#222722] to-[#080b09] shadow-[0_26px_45px_rgba(0,0,0,.78),inset_0_2px_3px_rgba(255,255,255,.25)]" style={{ transform: "translateZ(28px)" }}>
          <div className="absolute inset-[5px] rounded-[20px] border border-white/[.07]" />
          <div className="absolute inset-x-7 top-[4px] h-px bg-white/20" />
          <div className="absolute left-[9px] top-[12px] h-[5px] w-[5px] rounded-full border border-white/20 bg-gradient-to-br from-[#76796e] to-[#111410] shadow-[0_1px_2px_#000]" />
          <div className="absolute right-[9px] top-[12px] h-[5px] w-[5px] rounded-full border border-white/20 bg-gradient-to-br from-[#76796e] to-[#111410] shadow-[0_1px_2px_#000]" />
          <div className="absolute bottom-[10px] left-[9px] h-[5px] w-[5px] rounded-full border border-white/20 bg-gradient-to-br from-[#76796e] to-[#111410] shadow-[0_1px_2px_#000]" />
          <div className="absolute bottom-[10px] right-[9px] h-[5px] w-[5px] rounded-full border border-white/20 bg-gradient-to-br from-[#76796e] to-[#111410] shadow-[0_1px_2px_#000]" />
          <div className="absolute inset-x-5 top-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#f0daa0]/85 to-transparent" />
          <div className="absolute inset-0 rounded-[24px] bg-[linear-gradient(140deg,rgba(255,255,255,.17),transparent_26%,transparent_64%,rgba(0,0,0,.55))]" />

          {/* Vitre fumée : pile visible, toutes les cartes au même design */}
          <div className="absolute left-[24px] right-[24px] top-[13px] h-[79px] overflow-hidden rounded-[13px] border border-[#cfb66f]/65 bg-gradient-to-b from-[#101613] via-[#172019] to-[#060908] shadow-[inset_0_5px_12px_rgba(0,0,0,.9),0_1px_0_rgba(255,255,255,.16)]">
            <div className="absolute inset-x-[15px] top-[8px] h-[57px] overflow-hidden rounded-[8px] border border-white/[.08] bg-gradient-to-b from-[#304036] to-[#0c110d]">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-[14px] right-[14px] h-[38px] rounded-[3px] border border-[#c9ac65]/45"
                  style={{
                    bottom: `${i * 2}px`,
                    background: CARD_BACK,
                  }}
                >
                  <div className="absolute inset-[4px] rounded-[2px] border border-[#e4c879]/40" />
                </div>
              ))}
            </div>
            <div className="absolute inset-x-3 top-[4px] h-px bg-white/15" />
          </div>

          {/* Automatic-machine controls remain on the shell. */}
          <div className="absolute bottom-[18px] left-[18px] h-[34px] w-[145px] rounded-[10px] border border-[#e5c779]/50 bg-gradient-to-br from-[#1d211d] to-black shadow-[inset_0_3px_9px_rgba(0,0,0,.95),0_0_15px_rgba(215,180,91,.12)]">
            <div className="absolute inset-x-2 top-[5px] flex items-center justify-between">
              <span className="text-[7px] font-black uppercase tracking-[.2em] text-[#e5c779]">ROYAL ACE</span>
              <span className="relative flex h-[7px] w-[7px]">
                {active && <span className={`absolute inset-0 rounded-full ${tone}`} style={{ animation: "shoe-led-pulse 1.1s ease-in-out infinite" }} />}
                <span className={`relative h-[7px] w-[7px] rounded-full ${tone}`} />
              </span>
            </div>
            <div className="absolute inset-x-2 bottom-[4px] flex items-center justify-between gap-2">
              <span className="max-w-[78px] truncate text-[7px] font-bold uppercase tracking-[.17em] text-white/75">{status.label}</span>
              <span className="text-[6px] font-bold tracking-[.12em] text-white/35">6 DECKS</span>
            </div>
          </div>
          <div className="absolute bottom-[16px] right-[18px] flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#f4dfa2]/80 bg-gradient-to-br from-[#fff0b6] via-[#d7b45b] to-[#76591f] shadow-[0_7px_13px_rgba(0,0,0,.7),inset_0_2px_3px_rgba(255,255,255,.65)]">
            <div className="absolute inset-[6px] rounded-full border border-[#624b1e]/75 bg-gradient-to-b from-[#25251f] to-[#080a09] shadow-[inset_0_2px_4px_#000]" />
            <div className="absolute left-[8px] top-[6px] h-[3px] w-[12px] -rotate-[28deg] rounded-full bg-white/55" />
            <span className="relative h-[5px] w-[5px] rounded-full bg-[#e5c779]" />
          </div>
          <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[6px] font-black uppercase tracking-[.34em] text-white/30">Automatic Dealer</div>
        </div>

                  {/* Sortie côté dealer : les cartes reposent sur le tapis, prêtes à être glissées */}
        <div
          className="absolute left-[73px] top-[-64px] h-[100px] w-[154px]"
          style={{ transform: "translateZ(24px)" }}
        >
          {/* Rampe métallique */}
          <div className="absolute left-3 right-3 bottom-[10px] h-[52px] rounded-t-[13px] border-x border-t border-[#c7aa61]/50 bg-gradient-to-b from-[#070908] via-[#171b18] to-[#2d332f] shadow-[0_12px_21px_rgba(0,0,0,.72),inset_0_1px_2px_rgba(255,255,255,.16)]" />

          {/* Fente de sortie — point de départ du vol */}
          <div
            data-shoe-outlet=""
            className={`absolute left-1/2 bottom-[54px] h-[9px] w-[112px] -translate-x-1/2 rounded-full border border-black/80 bg-black shadow-[inset_0_3px_6px_rgba(0,0,0,.95)] ${
              cycle === "dispense" ? "ring-1 ring-[#e5c779]/70" : ""
            }`}
          />
          <div className="absolute left-1/2 bottom-[55px] h-[2px] w-[76px] -translate-x-1/2 rounded-full bg-[#e5c779]/65 shadow-[0_0_7px_rgba(229,199,121,.55)]" />

          {/* Pile qui dépasse sur le tapis — carte du haut la plus proche du dealer */}
          {[0, 1, 2].map((i) => {
            const isTop = i === 2;

            return (
              <Card
                key={i}
                className={
                  isTop && cycle === "dispense"
                    ? "animate-shoe-top-dispense"
                    : cycle === "refill"
                      ? "shoe-motion"
                      : ""
                }
                style={{
                  left: `${55 + (2 - i) * 2}px`,
                  bottom: `${14 + (2 - i) * 6}px`,
                  transform: `translateZ(${3 + i * 3}px)`,
                  animation:
                    cycle === "refill"
                      ? "shoe-stack-settle 420ms cubic-bezier(.2,.8,.25,1) both"
                      : undefined,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}




