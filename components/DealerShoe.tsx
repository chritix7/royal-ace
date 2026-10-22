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
          width: "240px",
          height: "160px",
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg) rotateZ(-30deg)",
        }}
      >
        {/* Ombre de contact */}
        <div
          className="absolute left-1 top-10 h-[135px] w-[235px] rounded-[44px] bg-black/60 blur-2xl"
          style={{ transform: "translateZ(-38px)" }}
        />

        {/* Dessus du sabot */}
        <div
          className="absolute left-0 top-0 h-[125px] w-[220px] rounded-[16px] border border-black/80 bg-gradient-to-br from-[#2b2f2d] via-[#141816] to-[#050706] shadow-[0_45px_85px_rgba(0,0,0,0.7)]"
          style={{ transform: "translateZ(32px)" }}
        >
          {/* Reflet plastique brillant */}
          <div className="absolute inset-0 rounded-[16px] bg-gradient-to-br from-white/20 via-transparent to-black/45" />
          <div className="absolute left-8 top-7 h-14 w-32 rotate-[-8deg] rounded-full bg-gradient-to-r from-white/20 via-white/5 to-transparent blur-[3px]" />

          {/* Fenêtre transparente : pile de cartes visible */}
          <div className="absolute bottom-4 left-5 h-[72px] w-[130px] rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-black/50 shadow-[inset_0_6px_20px_rgba(0,0,0,0.85)]">
            {/* Cartes à l’intérieur */}
            <div
              className="absolute bottom-3 left-3 h-[58px] w-[42px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#e9e2d1] to-[#cfc7b1] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(2px)" }}
            />
            <div
              className="absolute bottom-4 left-[18px] h-[58px] w-[42px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f1ecdf] to-[#d9d2bf] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(6px)" }}
            />
            <div
              className="absolute bottom-5 left-[24px] h-[58px] w-[42px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f8f5ec] to-[#e7e1d1] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(10px)" }}
            />
          </div>

          {/* Poids / pression sur les cartes */}
          <div className="absolute bottom-[52px] left-[38px] h-6 w-24 rounded-md border border-black/70 bg-gradient-to-b from-[#22282a] to-[#0a0d0c] shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-x-2 top-1 h-[3px] rounded-full bg-white/15" />
          </div>

          {/* Reflet du poids */}
          <div className="absolute bottom-[74px] left-[44px] h-[3px] w-16 rounded-full bg-white/10" />
        </div>

        {/* Face avant : lèvre de sortie */}
        <div
          className="absolute left-0 top-[125px] h-[32px] w-[220px] rounded-b-[16px] border border-black/80 bg-gradient-to-b from-[#1f2624] via-[#0d1210] to-[#030504]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          {/* Fente de sortie */}
          <div className="absolute inset-x-5 top-1.5 h-[12px] rounded-full bg-black shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)]" />
          <div className="absolute inset-x-5 top-[16px] h-[3px] rounded-full bg-white/10" />
          <div className="mx-8 mt-3 h-[3px] rounded-full bg-white/5" />
        </div>

        {/* Carte qui dépasse de la fente */}
        <div
          className="absolute bottom-[10px] left-[30px] h-[70px] w-[48px] rounded-[4px] border border-black/60 shadow-[0_18px_34px_rgba(0,0,0,0.65)]"
          style={{
            transform: "translateZ(26px) rotateZ(-2deg)",
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

        {/* Côté droit */}
        <div
          className="absolute left-[220px] top-0 h-[125px] w-[32px] rounded-r-[16px] border border-black/80 bg-gradient-to-b from-[#191d1b] via-[#0b0f0d] to-[#020403]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          <div className="absolute inset-y-3 left-[3px] w-[3px] rounded-full bg-white/15" />
        </div>

        {/* Côté gauche */}
        <div
          className="absolute left-0 top-0 h-[125px] w-[32px] rounded-l-[16px] bg-gradient-to-b from-[#0b0f0d] to-black"
          style={{
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
          }}
        />
      </div>
    </div>
  );
}