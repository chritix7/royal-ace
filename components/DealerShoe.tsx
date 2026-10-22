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
          width: "250px",
          height: "170px",
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg) rotateZ(-30deg)",
        }}
      >
        {/* Ombre de contact */}
        <div
          className="absolute left-1 top-12 h-[140px] w-[245px] rounded-[46px] bg-black/65 blur-2xl"
          style={{ transform: "translateZ(-40px)" }}
        />

        {/* Dessus de la machine */}
        <div
          className="absolute left-0 top-0 h-[130px] w-[230px] rounded-[18px] border border-black/80 bg-gradient-to-br from-[#2e3231] via-[#151917] to-[#050706] shadow-[0_48px_90px_rgba(0,0,0,0.75)]"
          style={{ transform: "translateZ(34px)" }}
        >
          {/* Reflet satiné */}
          <div className="absolute inset-0 rounded-[18px] bg-gradient-to-br from-white/18 via-transparent to-black/50" />
          <div className="absolute left-8 top-8 h-16 w-36 rotate-[-8deg] rounded-full bg-gradient-to-r from-white/20 via-white/5 to-transparent blur-[3px]" />

          {/* Liseré doré */}
          <div className="absolute inset-x-3 top-2 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#d7b45b]/70 to-transparent" />

          {/* Écran de status */}
          <div className="absolute left-5 top-5 h-9 w-[110px] rounded-lg border border-[#d7b45b]/40 bg-black/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)]">
            <div className="absolute inset-1 flex items-center justify-between px-2">
              <span className="text-[8px] font-black uppercase tracking-[0.18em] text-[#e5c779]">
                Royal Ace
              </span>

              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e5c779]/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e5c779] shadow-[0_0_8px_rgba(229,199,121,0.9)]" />
              </span>
            </div>

            <div className="absolute inset-x-2 bottom-1 text-center text-[7px] font-bold uppercase tracking-[0.22em] text-white/45">
              Ready
            </div>
          </div>

          {/* Grille / ventilation */}
          <div className="absolute right-5 top-6 flex flex-col gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[3px] w-14 rounded-full bg-black/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]"
              />
            ))}
          </div>

          {/* Zone de cartes visible */}
          <div className="absolute bottom-4 left-5 h-[62px] w-[140px] rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/60 shadow-[inset_0_6px_20px_rgba(0,0,0,0.9)]">
            <div
              className="absolute bottom-3 left-3 h-[52px] w-[38px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#e9e2d1] to-[#cfc7b1] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(2px)" }}
            />
            <div
              className="absolute bottom-4 left-[19px] h-[52px] w-[38px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f1ecdf] to-[#d9d2bf] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(6px)" }}
            />
            <div
              className="absolute bottom-5 left-[25px] h-[52px] w-[38px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f8f5ec] to-[#e7e1d1] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(10px)" }}
            />
          </div>

          {/* Bouton doré */}
          <div className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-[#d7b45b]/70 bg-gradient-to-b from-[#e5c779] to-[#8a6d2a] shadow-[0_6px_14px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.5)]">
            <div className="h-3 w-3 rounded-full bg-black/40" />
          </div>
        </div>

        {/* Face avant : sortie des cartes */}
        <div
          className="absolute left-0 top-[130px] h-[34px] w-[230px] rounded-b-[18px] border border-black/80 bg-gradient-to-b from-[#232827] via-[#101413] to-[#030504]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          {/* Fente de sortie */}
          <div className="absolute inset-x-6 top-2 h-[13px] rounded-full bg-black shadow-[inset_0_3px_9px_rgba(0,0,0,0.95)]" />
          <div className="absolute inset-x-6 top-[18px] h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#d7b45b]/50 to-transparent" />
          <div className="mx-10 mt-3 h-[3px] rounded-full bg-white/5" />
        </div>

        {/* Carte prête à être distribuée */}
        <div
          className="absolute bottom-[12px] left-[34px] h-[72px] w-[50px] rounded-[4px] border border-black/60 shadow-[0_20px_38px_rgba(0,0,0,0.7)]"
          style={{
            transform: "translateZ(28px) rotateZ(-2deg)",
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
          className="absolute left-[230px] top-0 h-[130px] w-[34px] rounded-r-[18px] border border-black/80 bg-gradient-to-b from-[#1c211f] via-[#0b0f0d] to-[#020403]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          <div className="absolute inset-y-4 left-[3px] w-[3px] rounded-full bg-white/15" />
        </div>

        {/* Côté gauche */}
        <div
          className="absolute left-0 top-0 h-[130px] w-[34px] rounded-l-[18px] bg-gradient-to-b from-[#0b0f0d] to-black"
          style={{
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
          }}
        />
      </div>
    </div>
  );
}