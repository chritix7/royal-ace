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

const CARD_BG =
  "repeating-linear-gradient(45deg, #102b25 0 3px, #1a4034 3px 6px), linear-gradient(135deg, #245b49, #102b25)";

const STATUS_STYLES: Record<ShoeStatus["tone"], string> = {
  gold: "bg-[#e5c779] shadow-[0_0_13px_rgba(229,199,121,0.9)]",
  green: "bg-emerald-400 shadow-[0_0_13px_rgba(52,211,153,0.9)]",
  red: "bg-red-400 shadow-[0_0_13px_rgba(248,113,113,0.9)]",
  orange: "bg-orange-400 shadow-[0_0_13px_rgba(251,146,60,0.9)]",
  white: "bg-white shadow-[0_0_13px_rgba(255,255,255,0.85)]",
};

function ShoeCard({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute h-[58px] w-[42px] overflow-hidden rounded-[5px] border border-[#c6a85e]/60 shadow-[0_10px_18px_rgba(0,0,0,0.62),inset_0_1px_1px_rgba(255,255,255,.28)] ${className}`}
      style={{ background: CARD_BG, ...style }}
    >
      <div className="absolute inset-[4px] rounded-[3px] border border-[#e4c879]/55" />
      <div className="absolute inset-[8px] rounded-[2px] border border-[#e4c879]/30" />
      <div className="absolute inset-0 flex items-center justify-center text-[15px] text-[#e4c879]/80">♠</div>
      <div className="absolute inset-x-[5px] top-[4px] h-px bg-white/25" />
      <div className="absolute bottom-[4px] right-[5px] text-[5px] font-black tracking-widest text-[#e4c879]/55">RA</div>
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
  const toneStyle = STATUS_STYLES[status.tone] ?? STATUS_STYLES.gold;
  const isActive = status.tone === "orange" || status.label.toLowerCase() === "dealing";

  useEffect(() => {
    if (firstTick.current) {
      firstTick.current = false;
      return;
    }

    setCycle("dispense");
    const refillTimer = window.setTimeout(() => setCycle("refill"), 450);
    const idleTimer = window.setTimeout(() => setCycle("idle"), 950);
    return () => {
      window.clearTimeout(refillTimer);
      window.clearTimeout(idleTimer);
    };
  }, [dealTick]);

  return (
    <div
      id="dealer-shoe"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "1500px" }}
    >
      <style>{`
        @keyframes royal-card-dispense {
          0% { transform: translate3d(0, 0, 8px) rotate(-1deg); opacity: 1; }
          58% { transform: translate3d(1px, -42px, 15px) rotate(1deg); opacity: 1; }
          100% { transform: translate3d(3px, -74px, 18px) rotate(3deg); opacity: 0; }
        }
        @keyframes royal-stack-rise {
          0% { transform: translate3d(0, 12px, 0) rotate(-4deg) scale(.92); opacity: 0; }
          75% { transform: translate3d(0, -2px, 0) rotate(1deg) scale(1.015); opacity: 1; }
          100% { transform: translate3d(0, 0, 0) rotate(0) scale(1); opacity: 1; }
        }
        @keyframes royal-card-enter {
          0% { transform: translateY(-26px) rotate(-7deg); opacity: 0; }
          100% { transform: translateY(0) rotate(0); opacity: 1; }
        }
        @keyframes royal-status-pulse {
          0%, 100% { opacity: .55; transform: scale(.82); }
          50% { opacity: 1; transform: scale(1.16); }
        }
        @keyframes royal-sheen {
          0%, 58% { transform: translateX(-150%) skewX(-18deg); }
          86%, 100% { transform: translateX(260%) skewX(-18deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .royal-motion { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      <div
        className="relative h-[230px] w-[300px] [transform-style:preserve-3d]"
        style={{ transform: "rotateX(54deg) rotateZ(-27deg)" }}
      >
        {/* Soft table contact shadow and warm reflected light */}
        <div className="absolute left-[-8px] top-[100px] h-[170px] w-[320px] rounded-[70px] bg-black/70 blur-3xl" style={{ transform: "translateZ(-52px)" }} />
        <div className="absolute left-[28px] top-[137px] h-[95px] w-[250px] rounded-full bg-[#d7b45b]/10 blur-2xl" style={{ transform: "translateZ(-30px)" }} />

        {/* Satin black lower body */}
        <div className="absolute left-[12px] top-[67px] h-[150px] w-[276px] rounded-[30px] border border-[#b69b5a]/35 bg-gradient-to-b from-[#303631] via-[#101512] to-[#030504] shadow-[0_28px_38px_rgba(0,0,0,.68),inset_0_2px_3px_rgba(255,255,255,.18)]" style={{ transform: "translateZ(14px)" }}>
          <div className="absolute inset-x-5 top-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-x-8 bottom-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#d7b45b]/55 to-transparent" />
          <div className="absolute bottom-[-8px] left-8 right-8 h-[16px] rounded-b-[18px] border-x border-b border-black/80 bg-gradient-to-b from-[#111513] to-black" />
        </div>

        {/* Left and right cast-metal sides */}
        <div className="absolute left-0 top-[49px] h-[161px] w-[42px] rounded-l-[26px] border border-black/80 bg-gradient-to-r from-[#050807] via-[#1c211e] to-[#090c0a] shadow-[inset_2px_0_4px_rgba(255,255,255,.08)]" style={{ transform: "rotateY(-90deg) translateZ(0px)", transformOrigin: "right center" }}>
          <div className="absolute inset-y-6 left-[7px] w-[2px] rounded-full bg-white/10" />
          <div className="absolute bottom-6 left-3 h-3 w-3 rounded-full border border-white/15 bg-gradient-to-b from-[#4b504b] to-[#111412] shadow-[0_2px_4px_#000]" />
        </div>
        <div className="absolute right-0 top-[49px] h-[161px] w-[42px] rounded-r-[26px] border border-black/80 bg-gradient-to-l from-[#050807] via-[#222824] to-[#0a0d0b] shadow-[inset_-2px_0_5px_rgba(255,255,255,.12)]" style={{ transform: "rotateY(90deg)", transformOrigin: "left center" }}>
          <div className="absolute inset-y-5 right-[6px] w-[2px] rounded-full bg-white/20" />
          <div className="absolute right-3 top-10 flex flex-col gap-[6px]">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[3px] w-[19px] rounded-full bg-black/90 shadow-[inset_0_1px_2px_rgba(255,255,255,.12)]" />)}
          </div>
        </div>

        {/* Player-facing fascia */}
        <div className="absolute left-[20px] top-[205px] h-[25px] w-[260px] rounded-b-[20px] border border-black/80 bg-gradient-to-b from-[#282d2a] to-[#050706] shadow-[0_8px_12px_rgba(0,0,0,.6)]" style={{ transform: "rotateX(-90deg)", transformOrigin: "top center" }}>
          <div className="mx-8 mt-2 h-[2px] rounded-full bg-white/[0.08]" />
        </div>

        {/* Main polished upper shell */}
        <div className="absolute left-[20px] top-[49px] h-[160px] w-[260px] overflow-hidden rounded-[26px] border border-[#d5c18d]/30 bg-gradient-to-br from-[#4a514d] via-[#202522] to-[#070a09] shadow-[0_55px_90px_rgba(0,0,0,.8),inset_0_1px_2px_rgba(255,255,255,.35)]" style={{ transform: "translateZ(44px)" }}>
          <div className="absolute inset-0 opacity-[.16]" style={{ background: "repeating-linear-gradient(115deg,rgba(255,255,255,.12) 0 1px,transparent 1px 4px)" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/65" />
          <div className="royal-motion absolute -left-16 top-[-20px] h-[210px] w-[52px] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-md" style={{ animation: "royal-sheen 7s ease-in-out infinite" }} />
          <div className="absolute inset-x-5 top-[3px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#f3dda0] to-transparent shadow-[0_0_12px_rgba(229,199,121,.45)]" />
          <div className="absolute inset-x-5 bottom-[3px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#d7b45b]/65 to-transparent" />

          {/* Recessed smoked-glass deck window */}
          <div className="absolute left-[16px] top-[15px] h-[81px] w-[228px] overflow-hidden rounded-[17px] border border-[#dfc77e]/55 bg-gradient-to-b from-[#080c0a] via-[#111713] to-[#030504] shadow-[inset_0_5px_14px_rgba(0,0,0,.95),0_1px_0_rgba(255,255,255,.18),0_0_16px_rgba(0,0,0,.6)]">
            <div className="absolute inset-x-2 top-[6px] h-[59px] overflow-hidden rounded-[10px] border border-white/[.08] bg-gradient-to-b from-[#24382e] to-[#0b110d]">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="absolute left-[23px] right-[13px] h-[40px] rounded-[3px] border border-[#a9a18b]/60 bg-gradient-to-b from-[#f5f0df] via-[#e7e0cf] to-[#b9b19c] shadow-[0_1px_2px_rgba(0,0,0,.65)]" style={{ bottom: `${i * 2}px`, transform: `translateX(${i % 2 ? 1 : 0}px)` }} />
              ))}
              <div className="absolute inset-x-[25px] bottom-[13px] h-[32px] overflow-hidden rounded-[3px] border border-black/40" style={{ background: CARD_BG }}>
                <div className="absolute inset-[4px] rounded-[2px] border border-[#e5c779]/45" />
                <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[#e5c779]/70">♠</div>
              </div>
            </div>
            <div className="absolute inset-x-[42px] bottom-0 h-[13px] rounded-t-[9px] border-x border-t border-[#a98f54]/60 bg-gradient-to-b from-[#55472c] to-[#171610]" />
            <div className="absolute inset-x-3 top-[3px] h-px bg-white/15" />
          </div>

          {/* Status display */}
          <div className="absolute bottom-[14px] left-[15px] h-[37px] w-[148px] rounded-[11px] border border-[#e5c779]/45 bg-[linear-gradient(150deg,#171915,#020403)] shadow-[inset_0_3px_10px_rgba(0,0,0,.95),0_0_15px_rgba(215,180,91,.13)]">
            <div className="absolute inset-x-2 top-[5px] flex items-center justify-between">
              <span className="text-[7px] font-black uppercase tracking-[.2em] text-[#e5c779]">ROYAL ACE</span>
              <span className="relative flex h-[7px] w-[7px]">
                {isActive && <span className={`absolute inset-0 rounded-full ${toneStyle}`} style={{ animation: "royal-status-pulse 1.2s ease-in-out infinite" }} />}
                <span className={`relative h-[7px] w-[7px] rounded-full ${toneStyle}`} />
              </span>
            </div>
            <div className="absolute inset-x-2 bottom-[5px] flex items-center justify-between gap-2">
              <span className="max-w-[82px] truncate text-[7px] font-bold uppercase tracking-[.18em] text-white/75">{status.label}</span>
              <span className="text-[6px] font-bold tabular-nums tracking-[.13em] text-white/35">6 DECKS</span>
            </div>
          </div>

          {/* Machined gold control dial */}
          <div className="absolute bottom-[13px] right-[18px] flex h-[37px] w-[37px] items-center justify-center rounded-full border border-[#f4dfa2]/75 bg-[linear-gradient(145deg,#fff0b5_0%,#d7b45b_42%,#71571f_100%)] shadow-[0_7px_13px_rgba(0,0,0,.72),inset_0_2px_3px_rgba(255,255,255,.65),inset_0_-3px_5px_rgba(0,0,0,.35)]">
            <div className="absolute inset-[5px] rounded-full border border-[#624b1e]/70 bg-gradient-to-b from-[#30281a] to-[#090b09] shadow-[inset_0_2px_4px_#000]" />
            <div className="absolute left-[9px] top-[7px] h-[3px] w-[13px] rotate-[-28deg] rounded-full bg-white/50 blur-[.3px]" />
            <div className="relative h-[5px] w-[5px] rounded-full bg-[#d7b45b] shadow-[0_0_6px_rgba(229,199,121,.7)]" />
          </div>
          <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[6px] font-black uppercase tracking-[.38em] text-white/30">Automatic Dealer</div>
        </div>

        {/* Integrated output ramp and eject slot */}
        <div className="absolute left-[67px] top-[-49px] h-[111px] w-[166px]" style={{ transform: "translateZ(24px)" }}>
          <div className="absolute inset-x-0 bottom-0 h-[36px] rounded-[12px] border border-[#c9ad68]/40 bg-gradient-to-b from-[#333a36] via-[#171c19] to-[#050807] shadow-[0_17px_27px_rgba(0,0,0,.72),inset_0_1px_2px_rgba(255,255,255,.22)]" />
          <div className="absolute inset-x-3 bottom-[31px] h-[11px] rounded-full border border-[#c9ad68]/20 bg-black shadow-[inset_0_4px_8px_rgba(0,0,0,.98)]" />
          <div className="absolute inset-x-4 bottom-[41px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#e5c779]/80 to-transparent shadow-[0_0_8px_rgba(229,199,121,.55)]" />
          {/* Staged card stack, offset to show individual paper edges */}
          {[0, 1, 2, 3].map((i) => {
            const isTop = i === 3;
            const offset = (3 - i) * 7;
            const dispensing = isTop && cycle === "dispense";
            const rising = cycle === "refill";
            return (
              <ShoeCard
                key={i}
                className={dispensing ? "royal-motion" : rising ? "royal-motion" : ""}
                style={{
                  left: `${42 + offset * 0.38}px`,
                  bottom: `${28 + offset}px`,
                  transform: `translateZ(${3 + i * 3}px) rotate(${(i - 1.5) * 1.35}deg)`,
                  animation: dispensing
                    ? "royal-card-dispense 450ms cubic-bezier(.2,.75,.3,1) both"
                    : rising
                      ? "royal-stack-rise 480ms cubic-bezier(.2,.8,.25,1) both"
                      : undefined,
                }}
              />
            );
          })}
          {cycle === "refill" && (
            <div className="royal-motion absolute left-[43px] bottom-[27px] h-[58px] w-[42px] rounded-[5px] border border-[#c6a85e]/60 shadow-[0_10px_18px_rgba(0,0,0,.6)]" style={{ background: CARD_BG, animation: "royal-card-enter 430ms cubic-bezier(.18,.75,.25,1) both" }}>
              <div className="absolute inset-[4px] rounded-[3px] border border-[#e4c879]/55" />
              <div className="absolute inset-0 flex items-center justify-center text-[15px] text-[#e4c879]/80">♠</div>
            </div>
          )}
          <div className="absolute bottom-[2px] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-[6px] font-bold uppercase tracking-[.3em] text-[#d3bd7d]/75">Precision card delivery</div>
        </div>
      </div>
    </div>
  );
}
