export default function DealerShoe({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "1500px" }}
    >
      <div
        className="relative"
        style={{
          width: "210px",
          height: "160px",
          transformStyle: "preserve-3d",
          transform: "rotateX(61deg) rotateZ(-35deg)",
        }}
      >
        {/* Ombre de contact au sol */}
        <div
          className="absolute left-1 top-10 h-[135px] w-[205px] rounded-[36px] bg-black/55 blur-2xl"
          style={{ transform: "translateZ(-34px)" }}
        />

        {/* Paroi interne gauche */}
        <div
          className="absolute left-0 top-0 h-[128px] w-[20px] rounded-l-[14px] bg-gradient-to-b from-[#0b1512] via-[#050b08] to-black"
          style={{
            transformOrigin: "right center",
            transform: "rotateY(-90deg) translateZ(10px)",
          }}
        />

        {/* Face avant */}
        <div
          className="absolute left-0 top-[128px] h-[34px] w-[196px] rounded-b-[16px] border border-black/70 bg-gradient-to-b from-[#243c32] via-[#12211b] to-[#040806]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          {/* Moulure horizontale */}
          <div className="mx-5 mt-2 h-[4px] rounded-full bg-gradient-to-b from-white/15 to-transparent" />
          <div className="mx-5 mt-[3px] h-[3px] rounded-full bg-black/70" />
          {/* Reflet bas */}
          <div className="mx-8 mt-2 h-[2px] rounded-full bg-white/5" />
        </div>

        {/* Côté droit */}
        <div
          className="absolute left-[196px] top-0 h-[128px] w-[34px] rounded-r-[16px] border border-black/70 bg-gradient-to-b from-[#1a2c25] via-[#0d1814] to-[#030604]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          {/* Fente de distribution */}
          <div className="absolute left-1 top-8 h-[10px] w-[26px] rounded-full bg-black shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)]" />
          <div className="absolute left-1 top-[30px] h-[3px] w-[26px] rounded-full bg-white/10" />

          {/* Reflet vertical */}
          <div className="absolute inset-y-3 left-[3px] w-[3px] rounded-full bg-white/15" />
        </div>

        {/* Dessus du sabot */}
        <div
          className="absolute left-0 top-0 h-[128px] w-[196px] rounded-[16px] border border-black/70 bg-gradient-to-br from-[#38584a] via-[#1d332a] to-[#081210] shadow-[0_42px_80px_rgba(0,0,0,0.65)]"
          style={{ transform: "translateZ(34px)" }}
        >
          {/* Reflet satiné global */}
          <div className="absolute inset-0 rounded-[16px] bg-gradient-to-br from-white/15 via-transparent to-black/30" />

          {/* Couvercle articulé */}
          <div
            className="absolute inset-x-3 top-3 h-[44px] rounded-t-xl bg-gradient-to-b from-[#456a59] via-[#23392f] to-[#101d18] shadow-[0_16px_28px_rgba(0,0,0,0.55)]"
            style={{
              transformOrigin: "bottom center",
              transform: "rotateX(-22deg)",
            }}
          >
            <div className="absolute inset-x-4 top-3 h-[4px] rounded-full bg-gradient-to-r from-white/25 via-white/5 to-transparent" />
            <div className="absolute inset-x-4 bottom-3 h-[3px] rounded-full bg-black/50" />

            {/* Charnière */}
            <div className="absolute -bottom-1 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#0c1613] to-black shadow-[0_2px_5px_rgba(0,0,0,0.7)]" />
          </div>

          {/* Cuvette à cartes */}
          <div className="absolute bottom-5 left-5 h-[68px] w-[116px] rounded-xl bg-black/70 shadow-[inset_0_6px_18px_rgba(0,0,0,0.95)]">
            <div className="absolute inset-x-2 top-1 h-[3px] rounded-full bg-white/5" />
          </div>

          {/* Pile de cartes */}
          <div
            className="absolute bottom-[20px] left-[18px] h-[62px] w-[44px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#e9e2d1] to-[#cfc7b1] shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
            style={{ transform: "translateZ(4px)" }}
          />
          <div
            className="absolute bottom-[24px] left-[21px] h-[62px] w-[44px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f1ecdf] to-[#d9d2bf] shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
            style={{ transform: "translateZ(9px)" }}
          />
          <div
            className="absolute bottom-[28px] left-[24px] h-[62px] w-[44px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f8f5ec] to-[#e7e1d1] shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
            style={{ transform: "translateZ(14px)" }}
          />

          {/* Carte supérieure */}
          <div
            className="absolute bottom-[32px] left-[27px] h-[62px] w-[44px] rounded-[4px] border border-[#d7b45b]/60 shadow-[0_14px_26px_rgba(0,0,0,0.6)]"
            style={{
              transform: "translateZ(20px)",
              background:
                "repeating-linear-gradient(45deg, #142d27 0 5px, #1b3d33 5px 10px)",
            }}
          >
            <div className="absolute inset-2 flex items-center justify-center rounded-[3px] border border-[#d7b45b]/45 text-[#d7b45b]">
              ♠
            </div>
            <div className="absolute inset-x-2 top-1.5 h-[4px] rounded-full bg-gradient-to-r from-white/20 to-transparent" />
            <div className="absolute inset-x-2 bottom-1.5 h-[2px] rounded-full bg-black/40" />
          </div>

          {/* Reflet spéculaire sur le plastique */}
          <div className="absolute left-6 top-[52px] h-10 w-24 rotate-[-8deg] rounded-full bg-gradient-to-r from-white/15 via-white/5 to-transparent blur-[2px]" />
        </div>
      </div>
    </div>
  );
}