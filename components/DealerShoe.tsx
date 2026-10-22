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

const STATUS_STYLES: Record<ShoeStatus["tone"], { dot: string; text: string; glow: string }> = {
  gold: { dot: "bg-amber-300", text: "text-amber-100", glow: "shadow-[0_0_12px_rgba(251,191,36,.65)]" },
  green: { dot: "bg-emerald-400", text: "text-emerald-100", glow: "shadow-[0_0_12px_rgba(52,211,153,.65)]" },
  red: { dot: "bg-red-400", text: "text-red-100", glow: "shadow-[0_0_12px_rgba(248,113,113,.7)]" },
  orange: { dot: "bg-orange-400", text: "text-orange-100", glow: "shadow-[0_0_12px_rgba(251,146,60,.7)]" },
  white: { dot: "bg-white", text: "text-white", glow: "shadow-[0_0_12px_rgba(255,255,255,.6)]" },
};

const CARD_BACK =
  "repeating-linear-gradient(45deg,#102d28 0 3px,#174237 3px 6px),linear-gradient(135deg,#245b49,#102b25)";

function CardBack({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute rounded-[5px] border border-[#c9a85f]/55 bg-[#122d27] shadow-[0_5px_12px_rgba(0,0,0,.55)] ${className}`}
      style={{ background: CARD_BACK, ...style }}
    >
      <div className="absolute inset-[4px] rounded-[3px] border border-[#e4c77c]/45" />
      <div className="absolute inset-[8px] rounded-[2px] border border-[#e4c77c]/25" />
      <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#dfc47b]/80">♠</div>
      <div className="absolute inset-x-[5px] top-[4px] h-px bg-white/20" />
    </div>
  );
}

export default function DealerShoe({
  className = "",
  status = { label: "Ready", tone: "gold" },
  dealTick = 0,
}: DealerShoeProps) {
  const [cycle, setCycle] = useState<"idle" | "dispense">("idle");
  const firstTick = useRef(true);
  const tone = STATUS_STYLES[status.tone] ?? STATUS_STYLES.gold;

  useEffect(() => {
    if (firstTick.current) {
      firstTick.current = false;
      return;
    }
    setCycle("dispense");
    const timer = window.setTimeout(() => setCycle("idle"), 780);
    return () => window.clearTimeout(timer);
  }, [dealTick]);

  return (
    <div className={`relative isolate mx-auto w-full max-w-[440px] select-none ${className}`}>
      <style>{`
        @keyframes shoe-card-out {
          0% { transform: translate3d(0,0,0) rotate(-2deg) scale(.96); opacity: 0; }
          15% { opacity: 1; }
          62% { transform: translate3d(0,45px,0) rotate(2deg) scale(1); opacity: 1; }
          100% { transform: translate3d(0,78px,0) rotate(5deg) scale(.92); opacity: 0; }
        }
        @keyframes shoe-pulse { 0%,100% { opacity:.58; } 50% { opacity:1; } }
        @keyframes shoe-shine { 0% { transform:translateX(-130%) skewX(-18deg); } 100% { transform:translateX(240%) skewX(-18deg); } }
        @media (prefers-reduced-motion: reduce) {
          .shoe-motion { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      <div className="relative mx-auto h-[278px] w-full max-w-[390px] [perspective:1100px]">
        {/* Ambient table shadow */}
        <div className="absolute bottom-[11px] left-[7%] right-[7%] h-[38px] rounded-[50%] bg-black/70 blur-2xl" />
        <div className="absolute bottom-[19px] left-[12%] right-[12%] h-[30px] rounded-[50%] bg-amber-950/45 blur-xl" />

        {/* Lower chassis */}
        <div className="absolute bottom-[17px] left-[9%] right-[9%] h-[54px] rounded-[18px] border border-[#d8bc77]/40 bg-gradient-to-b from-[#34312a] via-[#111412] to-[#050707] shadow-[0_17px_22px_rgba(0,0,0,.7),inset_0_1px_1px_rgba(255,255,255,.18)] [transform:rotateX(58deg)]" />

        {/* Main molded shell */}
        <div className="absolute left-1/2 top-[43px] h-[202px] w-[72%] -translate-x-1/2 rounded-[31px] border border-[#dfc47c]/55 bg-gradient-to-br from-[#d8c184] via-[#8e7848] to-[#2a271e] p-[2px] shadow-[0_25px_32px_rgba(0,0,0,.65),inset_0_1px_2px_rgba(255,255,255,.7)] [transform:rotateX(9deg)_rotateY(-7deg)]">
          <div className="relative h-full overflow-hidden rounded-[29px] border border-black/70 bg-[linear-gradient(145deg,#34352f_0%,#191d1b_28%,#080b0b_68%,#28251d_100%)] shadow-[inset_0_2px_9px_rgba(255,255,255,.13),inset_0_-18px_26px_rgba(0,0,0,.7)]">
            <div className="absolute inset-x-3 top-2 h-[1px] bg-gradient-to-r from-transparent via-[#f7e7b2]/70 to-transparent" />
            <div className="absolute -left-12 top-0 h-full w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent shoe-motion" style={{ animation: "shoe-shine 5.5s ease-in-out infinite" }} />

            {/* Brand plate and ready indicator */}
            <div className="absolute left-1/2 top-[12px] flex -translate-x-1/2 flex-col items-center">
              <div className="whitespace-nowrap text-[9px] font-black tracking-[.34em] text-[#e5cf93] drop-shadow-[0_1px_2px_#000]">ROYAL ACE</div>
              <div className="mt-[5px] flex items-center gap-[6px] rounded-full border border-white/10 bg-black/50 px-[8px] py-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]">
                <span className={`h-[6px] w-[6px] rounded-full ${tone.dot} ${tone.glow}`} style={{ animation: "shoe-pulse 1.8s ease-in-out infinite" }} />
                <span className={`max-w-[102px] truncate text-[8px] font-bold uppercase tracking-[.14em] ${tone.text}`}>{status.label}</span>
              </div>
            </div>

            {/* Recessed card window */}
            <div className="absolute left-[12%] right-[12%] top-[61px] h-[105px] overflow-hidden rounded-[12px] border border-[#a9915b]/65 bg-[linear-gradient(180deg,#020706,#101512_45%,#050807)] shadow-[inset_0_8px_15px_rgba(0,0,0,.95),0_1px_0_rgba(255,255,255,.16)]">
              <div className="absolute inset-x-2 top-[8px] h-[70px] overflow-hidden rounded-[8px] border border-white/5 bg-gradient-to-b from-[#23332b] to-[#0b100d]">
                {/* Deep stack, individually edged for a physical deck impression */}
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="absolute left-[12%] right-[8%] h-[40px] rounded-[4px] border border-[#d8d1bb]/70 bg-gradient-to-b from-[#f5f0df] to-[#c9c1ad] shadow-[0_1px_2px_rgba(0,0,0,.8)]" style={{ bottom: `${i * 2}px`, transform: `translateX(${i % 2 ? 1 : 0}px)` }} />
                ))}
                <div className="absolute left-[14%] right-[10%] bottom-[14px] h-[32px] overflow-hidden rounded-[4px] border border-black/35" style={{ background: CARD_BACK }}>
                  <div className="absolute inset-[4px] rounded-[2px] border border-[#d8bd72]/50" />
                </div>
              </div>
              <div className="absolute bottom-0 left-[19%] right-[19%] h-[12px] rounded-t-[9px] border-x border-t border-[#a98e4f]/55 bg-gradient-to-b from-[#5b4d2e] to-[#171610]" />
              <div className="absolute inset-x-3 top-[4px] h-[1px] bg-white/10" />
            </div>

            {/* Chrome trim rails */}
            <div className="absolute left-[7%] top-[63px] h-[101px] w-[3px] rounded-full bg-gradient-to-b from-[#f1dfa5] via-[#75633b] to-[#211f18] shadow-[1px_0_3px_#000]" />
            <div className="absolute right-[7%] top-[63px] h-[101px] w-[3px] rounded-full bg-gradient-to-b from-[#f1dfa5] via-[#75633b] to-[#211f18] shadow-[-1px_0_3px_#000]" />

            {/* Ejection mouth */}
            <div className="absolute bottom-[12px] left-[18%] right-[18%] h-[21px] rounded-[7px] border border-[#b59b61]/65 bg-gradient-to-b from-[#020403] to-[#25231c] shadow-[inset_0_4px_7px_rgba(0,0,0,.95),0_1px_0_rgba(255,255,255,.16)]">
              <div className="absolute inset-x-3 top-[3px] h-[2px] rounded-full bg-[#d9c27e]/50" />
              <div className="absolute inset-x-2 bottom-[3px] h-[3px] rounded-full bg-black/80" />
            </div>
            <div className="absolute bottom-[37px] left-1/2 h-[5px] w-[34%] -translate-x-1/2 rounded-full bg-black/80 blur-[2px]" />
          </div>
        </div>

        {/* Output card and staging tray */}
        <div className="absolute bottom-[3px] left-1/2 z-20 h-[73px] w-[66%] -translate-x-1/2 [transform-style:preserve-3d]">
          <div className="absolute bottom-[5px] left-1/2 h-[35px] w-[110%] -translate-x-1/2 rounded-[9px] border border-[#d7bd7a]/55 bg-gradient-to-b from-[#5a4c2e] via-[#29271f] to-[#0a0d0c] shadow-[0_12px_15px_rgba(0,0,0,.65),inset_0_2px_2px_rgba(255,255,255,.22)] [transform:rotateX(60deg)]" />
          <div className="absolute bottom-[18px] left-[4%] right-[4%] h-[30px] rounded-[6px] border border-white/10 bg-gradient-to-b from-[#202522] to-[#090c0b] shadow-[inset_0_4px_7px_rgba(0,0,0,.8)]" />
          <CardBack className="bottom-[23px] left-1/2 z-10 h-[47px] w-[34px] -translate-x-1/2 rotate-[-3deg]" />
          <CardBack className="bottom-[26px] left-1/2 z-20 h-[47px] w-[34px] -translate-x-1/2 rotate-[2deg]" />
          {cycle === "dispense" && (
            <CardBack
              className="shoe-motion z-30 h-[49px] w-[35px]"
              style={{ left: "calc(50% - 17px)", bottom: "36px", animation: "shoe-card-out 760ms cubic-bezier(.2,.75,.25,1) both" }}
            />
          )}
          <div className="absolute bottom-[4px] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap text-[7px] font-bold tracking-[.28em] text-[#c9b77f]/80">PRECISION DEALER</div>
        </div>
      </div>
    </div>
  );
}
