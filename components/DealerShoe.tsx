export default function DealerShoe({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative"
        style={{
          width: "190px",
          height: "130px",
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg) rotateZ(-32deg)",
        }}
      >
        {/* Dessus du sabot */}
        <div
          className="absolute left-0 top-0 h-[110px] w-[170px] rounded-[10px] border border-black/60 bg-gradient-to-br from-[#2c463b] via-[#182b24] to-[#0a1310] shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
          style={{ transform: "translateZ(26px)" }}
        >
          {/* Ouverture / zone de cartes */}
          <div className="absolute left-4 top-4 h-[74px] w-[92px] rounded-md bg-black/55 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)]" />

          {/* Cartes dans le sabot */}
          <div
            className="absolute left-[18px] top-[16px] h-[70px] w-[48px] rounded-[3px] border border-black/50 bg-gradient-to-b from-[#f8f5ec] to-[#e3dccb] shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
            style={{ transform: "translateZ(6px)" }}
          />
          <div
            className="absolute left-[24px] top-[14px] h-[70px] w-[48px] rounded-[3px] border border-black/50 bg-gradient-to-b from-[#f3efe4] to-[#d9d2bf] shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
            style={{ transform: "translateZ(10px)" }}
          />
          <div
            className="absolute left-[30px] top-[12px] h-[70px] w-[48px] rounded-[3px] border border-[#d7b45b]/60 shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            style={{
              transform: "translateZ(14px)",
              background:
                "repeating-linear-gradient(45deg, #142d27 0 5px, #1b3d33 5px 10px)",
            }}
          >
            <div className="absolute inset-1.5 flex items-center justify-center rounded-[2px] border border-[#d7b45b]/40 text-lg text-[#d7b45b]">
              ♠
            </div>
          </div>

          {/* Fente de distribution */}
          <div className="absolute bottom-5 left-5 h-2.5 w-[120px] rounded-full bg-black/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]" />
          <div className="absolute bottom-[30px] left-5 h-[3px] w-[120px] rounded-full bg-white/10" />

          {/* Reflet du dessus */}
          <div className="absolute inset-x-3 top-1.5 h-4 rounded-full bg-gradient-to-b from-white/15 to-transparent" />
        </div>

        {/* Face avant du sabot */}
        <div
          className="absolute left-0 top-[110px] h-[26px] w-[170px] rounded-b-[10px] border border-black/60 bg-gradient-to-b from-[#1a2c25] to-[#070e0b]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          <div className="mx-3 mt-1.5 h-1 rounded-full bg-white/5" />
        </div>

        {/* Côté droit du sabot */}
        <div
          className="absolute left-[170px] top-0 h-[110px] w-[26px] rounded-r-[10px] border border-black/60 bg-gradient-to-b from-[#132420] to-[#050a08]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        />

        {/* Ombre portée */}
        <div
          className="absolute left-2 top-6 h-[120px] w-[180px] rounded-[24px] bg-black/45 blur-xl"
          style={{ transform: "translateZ(-20px)" }}
        />
      </div>
    </div>
  );
}