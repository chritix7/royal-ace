export default function DealerShoe({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "1700px" }}
    >
      <div
        className="relative"
        style={{
          width: "280px",
          height: "195px",
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg) rotateZ(-31deg)",
        }}
      >
        {/* Ombre de contact au sol */}
        <div
          className="absolute left-0 top-16 h-[160px] w-[275px] rounded-[60px] bg-black/70 blur-3xl"
          style={{ transform: "translateZ(-50px)" }}
        />

        {/* Halo doré sous la machine */}
        <div
          className="absolute left-8 top-24 h-[110px] w-[230px] rounded-full bg-[#d7b45b]/10 blur-2xl"
          style={{ transform: "translateZ(-30px)" }}
        />

        {/* Côté gauche */}
        <div
          className="absolute left-0 top-0 h-[150px] w-[40px] rounded-l-[24px] bg-gradient-to-b from-[#0d1311] via-[#050807] to-black"
          style={{
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
          }}
        >
          <div className="absolute inset-y-5 left-[5px] w-[3px] rounded-full bg-white/[0.07]" />
          <div className="absolute bottom-6 left-3 h-3 w-3 rounded-full border border-white/10 bg-gradient-to-b from-[#3a3f3d] to-[#0f1312]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/80" />
          </div>
        </div>

        {/* Côté droit */}
        <div
          className="absolute left-[260px] top-0 h-[150px] w-[40px] rounded-r-[24px] border border-black/80 bg-gradient-to-b from-[#242b29] via-[#0e1311] to-[#020403]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          {/* Reflet métallique */}
          <div className="absolute inset-y-5 left-[5px] w-[3px] rounded-full bg-white/20" />
          <div className="absolute inset-y-10 left-[10px] w-[1px] rounded-full bg-white/10" />

          {/* Grille de ventilation */}
          <div className="absolute right-2 top-8 flex flex-col gap-[6px]">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[3px] w-[20px] rounded-full bg-black/85 shadow-[inset_0_1px_2px_rgba(0,0,0,0.95)]"
              />
            ))}
          </div>

          {/* Vis */}
          <div className="absolute bottom-5 left-3 h-3 w-3 rounded-full border border-white/15 bg-gradient-to-b from-[#3f4543] to-[#0f1312]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[8px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/80" />
          </div>
        </div>

        {/* Face avant : sortie des cartes */}
        <div
          className="absolute left-0 top-[150px] h-[42px] w-[260px] rounded-b-[24px] border border-black/80 bg-gradient-to-b from-[#2a302e] via-[#121615] to-[#020403]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          {/* Fente de sortie */}
          <div className="absolute inset-x-7 top-2 h-[15px] rounded-full bg-black shadow-[inset_0_4px_12px_rgba(0,0,0,0.98)]" />
          <div className="absolute inset-x-7 top-[20px] h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#e5c779]/70 to-transparent" />

          {/* Moulures */}
          <div className="mx-10 mt-[28px] h-[3px] rounded-full bg-white/[0.07]" />
          <div className="mx-10 mt-[2px] h-[2px] rounded-full bg-black/75" />

          {/* Vis */}
          <div className="absolute bottom-2.5 left-5 h-3 w-3 rounded-full border border-white/15 bg-gradient-to-b from-[#3f4543] to-[#0f1312]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[8px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/80" />
          </div>
          <div className="absolute bottom-2.5 right-5 h-3 w-3 rounded-full border border-white/15 bg-gradient-to-b from-[#3f4543] to-[#0f1312]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[8px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/80" />
          </div>
        </div>

        {/* Dessus de la machine */}
        <div
          className="absolute left-0 top-0 h-[150px] w-[260px] rounded-[24px] border border-black/80 bg-gradient-to-br from-[#39413f] via-[#181d1b] to-[#030504] shadow-[0_65px_120px_rgba(0,0,0,0.85)]"
          style={{ transform: "translateZ(42px)" }}
        >
          {/* Matière métal brossé */}
          <div
            className="absolute inset-0 rounded-[24px] opacity-[0.16]"
            style={{
              background:
                "repeating-linear-gradient(115deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 4px)",
            }}
          />

          {/* Reflet global */}
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/22 via-transparent to-black/60" />
          <div className="absolute left-12 top-12 h-24 w-52 rotate-[-8deg] rounded-full bg-gradient-to-r from-white/22 via-white/5 to-transparent blur-[5px]" />

          {/* Liserés or */}
          <div className="absolute inset-x-5 top-2.5 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#e5c779]/90 to-transparent shadow-[0_0_14px_rgba(229,199,121,0.35)]" />
          <div className="absolute inset-x-5 bottom-2.5 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#d7b45b]/50 to-transparent" />

          {/* Écran holographique */}
          <div className="absolute left-6 top-6 h-14 w-[150px] rounded-2xl border border-[#e5c779]/50 bg-black/90 shadow-[inset_0_4px_18px_rgba(0,0,0,0.98),0_0_28px_rgba(215,180,91,0.18)]">
            <div className="absolute inset-x-3 top-2 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                Royal Ace
              </span>

              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e5c779]/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#e5c779] shadow-[0_0_14px_rgba(229,199,121,1)]" />
              </span>
            </div>

            <div className="absolute inset-x-3 bottom-2 flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-white/55">
                Ready
              </span>
              <span className="text-[8px] font-bold tabular-nums tracking-[0.18em] text-white/35">
                6 DECKS
              </span>
            </div>

            {/* Lignes HUD */}
            <div className="absolute inset-x-3 top-[26px] h-[2px] rounded-full bg-gradient-to-r from-[#e5c779]/40 via-white/10 to-transparent" />
            <div className="absolute inset-x-3 top-[32px] h-[2px] rounded-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

            {/* Reflet d’écran */}
            <div className="absolute inset-x-4 top-3 h-4 rounded-full bg-gradient-to-b from-white/15 to-transparent" />
          </div>

          {/* Grille de ventilation */}
          <div className="absolute right-7 top-9 flex flex-col gap-[7px]">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[3px] w-[70px] rounded-full bg-black/85 shadow-[inset_0_1px_2px_rgba(0,0,0,0.95)]"
              />
            ))}
          </div>

          {/* Fenêtre des cartes */}
          <div className="absolute bottom-6 left-6 h-[78px] w-[165px] rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-black/70 shadow-[inset_0_10px_28px_rgba(0,0,0,0.98)]">
            <div className="absolute inset-x-4 top-2 h-[3px] rounded-full bg-white/10" />

            {/* Pile de cartes */}
            <div
              className="absolute bottom-3 left-3 h-[58px] w-[42px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#e9e2d1] to-[#cfc7b1] shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(4px)" }}
            />
            <div
              className="absolute bottom-4 left-[22px] h-[58px] w-[42px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f1ecdf] to-[#d9d2bf] shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(9px)" }}
            />
            <div
              className="absolute bottom-5 left-[31px] h-[58px] w-[42px] rounded-[4px] border border-black/50 bg-gradient-to-b from-[#f8f5ec] to-[#e7e1d1] shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
              style={{ transform: "translateZ(14px)" }}
            />
          </div>

          {/* Bouton doré */}
          <div className="absolute bottom-8 right-8 flex h-11 w-11 items-center justify-center rounded-full border border-[#e5c779]/80 bg-gradient-to-b from-[#f7e2a3] via-[#d7b45b] to-[#6f571f] shadow-[0_10px_24px_rgba(0,0,0,0.7),inset_0_1px_4px_rgba(255,255,255,0.6)]">
            <div className="h-4 w-4 rounded-full bg-gradient-to-b from-black/50 to-black/75" />
            <div className="absolute left-2.5 top-2 h-[4px] w-5 rounded-full bg-white/45" />
          </div>

          {/* Texte gravé */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-[0.42em] text-white/25">
            Automatic Dealer
          </div>
        </div>

        {/* Carte prête à être distribuée */}
        <div
          className="absolute bottom-[16px] left-[42px] h-[82px] w-[56px] rounded-[5px] border border-black/60 shadow-[0_28px_52px_rgba(0,0,0,0.8)]"
          style={{
            transform: "translateZ(38px) rotateZ(-2deg)",
            background:
              "repeating-linear-gradient(45deg, #142d27 0 5px, #1b3d33 5px 10px)",
          }}
        >
          {/* Halo de sortie */}
          <div className="absolute -inset-2 rounded-lg bg-[#e5c779]/10 blur-md" />

          <div className="absolute inset-2 flex items-center justify-center rounded-[3px] border border-[#d7b45b]/45 text-[#d7b45b]">
            ♠
          </div>
          <div className="absolute inset-x-2 top-2 h-[4px] rounded-full bg-gradient-to-r from-white/25 to-transparent" />
          <div className="absolute inset-x-2 bottom-2 h-[2px] rounded-full bg-black/40" />
        </div>
      </div>
    </div>
  );
}