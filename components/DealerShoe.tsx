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
          width: "230px",
          height: "150px",
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg) rotateZ(-30deg)",
        }}
      >
        {/* Ombre de contact */}
        <div
          className="absolute left-1 top-10 h-[130px] w-[225px] rounded-[40px] bg-black/55 blur-2xl"
          style={{ transform: "translateZ(-36px)" }}
        />

        {/* Dessus incliné du sabot */}
        <div
          className="absolute left-0 top-0 h-[120px] w-[210px] rounded-[14px] border border-black/70 bg-gradient-to-br from-[#3a5a4b] via-[#1e332a] to-[#0a1310] shadow-[0_40px_80px_rgba(0,0,0,0.65)]"
          style={{ transform: "translateZ(30px)" }}
        >
          {/* Reflet satiné */}
          <div className="absolute inset-0 rounded-[14px] bg-gradient-to-br from-white/18 via-transparent to-black/35" />

          {/* Ouverture avant : l’endroit d’où sortent les cartes */}
          <div className="absolute bottom-3 left-4 right-4 h-[42px] rounded-lg bg-black/80 shadow-[inset_0_8px_18px_rgba(0,0,0,0.95)]">
            <div className="absolute inset-x-3 top-1.5 h-[3px] rounded-full bg-white/10" />
          </div>

          {/* Cartes qui dépassent de l’ouverture */}
          <div
            className="absolute bottom-[16px] left-[22px] h-[64px] w-[46px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#e9e2d1] to-[#cfc7b1] shadow-[0_10px_20px_rgba(0,0,0,0.55)]"
            style={{ transform: "translateZ(2px)" }}
          />
          <div
            className="absolute bottom-[20px] left-[26px] h-[64px] w-[46px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f1ecdf] to-[#d9d2bf] shadow-[0_10px_20px_rgba(0,0,0,0.55)]"
            style={{ transform: "translateZ(7px)" }}
          />
          <div
            className="absolute bottom-[24px] left-[30px] h-[64px] w-[46px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f8f5ec] to-[#e7e1d1] shadow-[0_10px_20px_rgba(0,0,0,0.55)]"
            style={{ transform: "translateZ(12px)" }}
          />

          {/* Carte prête à être distribuée */}
          <div
            className="absolute bottom-[28px] left-[34px] h-[64px] w-[46px] rounded-[4px] border border-[#d7b45b]/60 shadow-[0_16px_30px_rgba(0,0,0,0.6)]"
            style={{
              transform: "translateZ(18px)",
              background:
                "repeating-linear-gradient(45deg, #142d27 0 5px, #1b3d33 5px 10px)",
            }}
          >
            <div className="absolute inset-2 flex items-center justify-center rounded-[3px] border border-[#d7b45b]/45 text-[#d7b45b]">
              ♠
            </div>
            <div className="absolute inset-x-2 top-1.5 h-[4px] rounded-full bg-gradient-to-r from-white/20 to-transparent" />
          </div>

          {/* Reflet sur le plastique */}
          <div className="absolute left-8 top-8 h-12 w-28 rotate-[-8deg] rounded-full bg-gradient-to-r from-white/18 via-white/5 to-transparent blur-[2px]" />
        </div>

        {/* Face avant : lèvre de sortie */}
        <div
          className="absolute left-0 top-[120px] h-[30px] w-[210px] rounded-b-[14px] border border-black/70 bg-gradient-to-b from-[#243c32] via-[#12211b] to-[#040806]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          {/* Lèvre de sortie des cartes */}
          <div className="absolute inset-x-4 top-1.5 h-[10px] rounded-full bg-black shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)]" />
          <div className="absolute inset-x-4 top-[14px] h-[3px] rounded-full bg-white/10" />
          <div className="mx-6 mt-3 h-[3px] rounded-full bg-white/5" />
        </div>

        {/* Côté droit */}
        <div
          className="absolute left-[210px] top-0 h-[120px] w-[30px] rounded-r-[14px] border border-black/70 bg-gradient-to-b from-[#1a2c25] via-[#0d1814] to-[#030604]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          <div className="absolute inset-y-3 left-[3px] w-[3px] rounded-full bg-white/15" />
        </div>

        {/* Côté gauche */}
        <div
          className="absolute left-0 top-0 h-[120px] w-[30px] rounded-l-[14px] bg-gradient-to-b from-[#0b1512] to-black"
          style={{
            transformOrigin: "right center",
            transform: "rotateY(-90deg) translateZ(0px)",
          }}
        />
      </div>
    </div>
  );
}