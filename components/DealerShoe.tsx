export default function DealerShoe({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "1600px" }}
    >
      <div
        className="relative"
        style={{
          width: "260px",
          height: "180px",
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg) rotateZ(-31deg)",
        }}
      >
        {/* Ombre de contact au sol */}
        <div
          className="absolute left-0 top-14 h-[150px] w-[255px] rounded-[52px] bg-black/65 blur-2xl"
          style={{ transform: "translateZ(-44px)" }}
        />

        {/* Côté gauche */}
        <div
          className="absolute left-0 top-0 h-[140px] w-[36px] rounded-l-[20px] bg-gradient-to-b from-[#0c1210] via-[#050807] to-black"
          style={{
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
          }}
        >
          <div className="absolute inset-y-4 left-[4px] w-[3px] rounded-full bg-white/[0.06]" />
        </div>

        {/* Côté droit */}
        <div
          className="absolute left-[240px] top-0 h-[140px] w-[36px] rounded-r-[20px] border border-black/80 bg-gradient-to-b from-[#202624] via-[#0d1110] to-[#020403]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          {/* Reflet vertical */}
          <div className="absolute inset-y-4 left-[4px] w-[3px] rounded-full bg-white/15" />

          {/* Grille de ventilation */}
          <div className="absolute right-2 top-6 flex flex-col gap-[5px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[3px] w-[18px] rounded-full bg-black/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]"
              />
            ))}
          </div>

          {/* Vis décorative */}
          <div className="absolute bottom-4 left-2 h-2.5 w-2.5 rounded-full border border-white/15 bg-gradient-to-b from-[#3a3f3d] to-[#101413]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[6px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/70" />
          </div>
        </div>

        {/* Face avant : sortie des cartes */}
        <div
          className="absolute left-0 top-[140px] h-[38px] w-[240px] rounded-b-[20px] border border-black/80 bg-gradient-to-b from-[#262b2a] via-[#111514] to-[#020403]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          {/* Lèvre de sortie */}
          <div className="absolute inset-x-6 top-2 h-[14px] rounded-full bg-black shadow-[inset_0_3px_10px_rgba(0,0,0,0.95)]" />
          <div className="absolute inset-x-6 top-[19px] h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#d7b45b]/60 to-transparent" />

          {/* Moulure */}
          <div className="mx-8 mt-[26px] h-[3px] rounded-full bg-white/[0.06]" />
          <div className="mx-8 mt-[2px] h-[2px] rounded-full bg-black/70" />

          {/* Vis */}
          <div className="absolute bottom-2 left-4 h-2.5 w-2.5 rounded-full border border-white/15 bg-gradient-to-b from-[#3a3f3d] to-[#101413]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[6px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/70" />
          </div>
          <div className="absolute bottom-2 right-4 h-2.5 w-2.5 rounded-full border border-white/15 bg-gradient-to-b from-[#3a3f3d] to-[#101413]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[6px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/70" />
          </div>
        </div>

        {/* Dessus de la machine */}
        <div
          className="absolute left-0 top-0 h-[140px] w-[240px] rounded-[20px] border border-black/80 bg-gradient-to-br from-[#333a38] via-[#171c1a] to-[#040605] shadow-[0_55px_100px_rgba(0,0,0,0.8)]"
          style={{ transform: "translateZ(38px)" }}
        >
          {/* Reflet satiné global */}
          <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-white/20 via-transparent to-black/55" />
          <div className="absolute left-10 top-10 h-20 w-44 rotate-[-8deg] rounded-full bg-gradient-to-r from-white/20 via-white/5 to-transparent blur-[4px]" />

          {/* Liseré doré */}
          <div className="absolute inset-x-4 top-2 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#e5c779]/80 to-transparent" />
          <div className="absolute inset-x-4 bottom-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#d7b45b]/40 to-transparent" />

          {/* Écran de status */}
          <div className="absolute left-5 top-5 h-11 w-[130px] rounded-xl border border-[#d7b45b]/45 bg-black/85 shadow-[inset_0_3px_14px_rgba(0,0,0,0.95),0_0_18px_rgba(215,180,91,0.12)]">
            <div className="absolute inset-x-2 top-1.5 flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#e5c779]">
                Royal Ace
              </span>

              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e5c779]/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e5c779] shadow-[0_0_10px_rgba(229,199,121,0.95)]" />
              </span>
            </div>

            <div className="absolute inset-x-2 bottom-1.5 text-center text-[8px] font-bold uppercase tracking-[0.26em] text-white/50">
              Ready
            </div>

            {/* Reflet d’écran */}
            <div className="absolute inset-x-3 top-4 h-[3px] rounded-full bg-white/10" />
          </div>

          {/* Grille de ventilation */}
          <div className="absolute right-6 top-7 flex flex-col gap-[6px]">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[3px] w-16 rounded-full bg-black/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]"
              />
            ))}
          </div>

          {/* Fenêtre des cartes */}
          <div className="absolute bottom-5 left-5 h-[70px] w-[150px] rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-black/65 shadow-[inset_0_8px_24px_rgba(0,0,0,0.95)]">
            <div className="absolute inset-x-3 top-1.5 h-[3px] rounded-full bg-white/10" />

            {/* Pile de cartes */}
            <div
              className="absolute bottom-3 left-3 h-[54px] w-[40px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#e9e2d1] to-[#cfc7b1] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(3px)" }}
            />
            <div
              className="absolute bottom-4 left-[20px] h-[54px] w-[40px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f1ecdf] to-[#d9d2bf] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(8px)" }}
            />
            <div
              className="absolute bottom-5 left-[27px] h-[54px] w-[40px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f8f5ec] to-[#e7e1d1] shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(13px)" }}
            />
          </div>

          {/* Bouton doré */}
          <div className="absolute bottom-7 right-7 flex h-9 w-9 items-center justify-center rounded-full border border-[#d7b45b]/80 bg-gradient-to-b from-[#f0d38b] via-[#d7b45b] to-[#7d6224] shadow-[0_8px_18px_rgba(0,0,0,0.65),inset_0_1px_3px_rgba(255,255,255,0.55)]">
            <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-b from-black/50 to-black/70" />
            <div className="absolute left-2 top-1.5 h-[3px] w-4 rounded-full bg-white/40" />
          </div>

          {/* Petit texte gravé */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-[0.35em] text-white/25">
            Automatic Dealer
          </div>
        </div>

        {/* Carte prête à être distribuée */}
        <div
          className="absolute bottom-[14px] left-[38px] h-[76px] w-[52px] rounded-[5px] border border-black/60 shadow-[0_24px_44px_rgba(0,0,0,0.75)]"
          style={{
            transform: "translateZ(32px) rotateZ(-2deg)",
            background:
              "repeating-linear-gradient(45deg, #142d27 0 5px, #1b3d33 5px 10px)",
          }}
        >
          <div className="absolute inset-2 flex items-center justify-center rounded-[3px] border border-[#d7b45b]/45 text-[#d7b45b]">
            ♠
          </div>
          <div className="absolute inset-x-2 top-2 h-[4px] rounded-full bg-gradient-to-r from-white/20 to-transparent" />
          <div className="absolute inset-x-2 bottom-2 h-[2px] rounded-full bg-black/40" />
        </div>
      </div>
    </div>
  );
}