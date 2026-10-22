export default function DealerShoe({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "1400px" }}
    >
      <div
        className="relative"
        style={{
          width: "200px",
          height: "150px",
          transformStyle: "preserve-3d",
          transform: "rotateX(60deg) rotateZ(-34deg)",
        }}
      >
        {/* Ombre portée */}
        <div
          className="absolute left-0 top-8 h-[130px] w-[200px] rounded-[30px] bg-black/50 blur-2xl"
          style={{ transform: "translateZ(-30px)" }}
        />

        {/* Paroi intérieure gauche */}
        <div
          className="absolute left-0 top-0 h-[120px] w-[16px] rounded-l-[10px] bg-gradient-to-b from-[#0d1814] to-[#040806]"
          style={{
            transformOrigin: "right center",
            transform: "rotateY(-90deg) translateZ(8px)",
          }}
        />

        {/* Face avant */}
        <div
          className="absolute left-0 top-[120px] h-[30px] w-[184px] rounded-b-[12px] border border-black/70 bg-gradient-to-b from-[#20362d] to-[#060c09]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          <div className="mx-4 mt-2 h-[3px] rounded-full bg-white/10" />
          <div className="mx-4 mt-1 h-[2px] rounded-full bg-black/60" />
        </div>

        {/* Côté droit */}
        <div
          className="absolute left-[184px] top-0 h-[120px] w-[30px] rounded-r-[12px] border border-black/70 bg-gradient-to-b from-[#16281f] to-[#040806]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          <div className="absolute inset-y-2 left-1 w-[2px] rounded-full bg-white/10" />
        </div>

        {/* Dessus du sabot */}
        <div
          className="absolute left-0 top-0 h-[120px] w-[184px] rounded-[12px] border border-black/70 bg-gradient-to-br from-[#314e41] via-[#1b2f27] to-[#0a1310] shadow-[0_36px_70px_rgba(0,0,0,0.6)]"
          style={{ transform: "translateZ(30px)" }}
        >
          {/* Couvercle incliné */}
          <div
            className="absolute inset-x-2 top-2 h-[34px] rounded-t-lg bg-gradient-to-b from-[#3b5a4b] to-[#15251f] shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
            style={{
              transformOrigin: "bottom center",
              transform: "rotateX(-18deg)",
            }}
          >
            <div className="absolute inset-x-3 top-2 h-[3px] rounded-full bg-white/20" />
            <div className="absolute inset-x-3 bottom-2 h-[2px] rounded-full bg-black/40" />
          </div>

          {/* Cuvette des cartes */}
          <div className="absolute bottom-4 left-4 h-[64px] w-[104px] rounded-lg bg-black/65 shadow-[inset_0_4px_14px_rgba(0,0,0,0.9)]" />

          {/* Pile de cartes */}
          <div
            className="absolute bottom-[18px] left-[16px] h-[58px] w-[40px] rounded-[3px] border border-black/50 bg-gradient-to-b from-[#efe9da] to-[#d6cfba] shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            style={{ transform: "translateZ(4px)" }}
          />
          <div
            className="absolute bottom-[21px] left-[19px] h-[58px] w-[40px] rounded-[3px] border border-black/50 bg-gradient-to-b from-[#f6f2e7] to-[#e2dbc8] shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            style={{ transform: "translateZ(8px)" }}
          />
          <div
            className="absolute bottom-[24px] left-[22px] h-[58px] w-[40px] rounded-[3px] border border-black/50 bg-gradient-to-b from-[#f8f5ec] to-[#e7e1d1] shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            style={{ transform: "translateZ(12px)" }}
          />

          {/* Carte du dessus */}
          <div
            className="absolute bottom-[27px] left-[25px] h-[58px] w-[40px] rounded-[3px] border border-[#d7b45b]/60 shadow-[0_10px_20px_rgba(0,0,0,0.55)]"
            style={{
              transform: "translateZ(17px)",
              background:
                "repeating-linear-gradient(45deg, #142d27 0 5px, #1b3d33 5px 10px)",
            }}
          >
            <div className="absolute inset-1.5 flex items-center justify-center rounded-[2px] border border-[#d7b45b]/40 text-[#d7b45b]">
              ♠
            </div>
            <div className="absolute inset-x-1 top-1 h-[3px] rounded-full bg-white/10" />
          </div>

          {/* Fente de distribution */}
          <div className="absolute bottom-5 right-5 h-3 w-[46px] rounded-full bg-black/85 shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)]" />
          <div className="absolute bottom-[30px] right-5 h-[3px] w-[46px] rounded-full bg-white/10" />

          {/* Reflet principal */}
          <div className="absolute inset-x-4 top-9 h-5 rounded-full bg-gradient-to-b from-white/15 to-transparent blur-[1px]" />
        </div>
      </div>
    </div>
  );
}