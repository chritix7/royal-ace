import { useEffect, useRef, useState } from "react";

type ShoeStatus = {
  label: string;
  tone: "gold" | "green" | "red" | "orange" | "white";
};

const CARD_BG =
  "repeating-linear-gradient(45deg, #142d27 0 5px, #1b3d33 5px 10px)";

function ShoeCard({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`absolute h-[56px] w-[40px] rounded-[4px] border border-black/60 shadow-[0_10px_20px_rgba(0,0,0,0.6)] ${className}`}
      style={{ background: CARD_BG, ...style }}
    >
      <div className="absolute inset-[5px] flex items-center justify-center rounded-[3px] border border-[#d7b45b]/40 text-[#d7b45b]">
        ♠
      </div>
      <div className="absolute inset-x-[6px] top-[6px] h-[2px] rounded-full bg-white/15" />

      {children}
    </div>
  );
}

export default function DealerShoe({
  className = "",
  status = { label: "Ready", tone: "gold" },
  dealTick = 0,
}: {
  className?: string;
  status?: ShoeStatus;
  dealTick?: number;
}) {
  const [cycle, setCycle] = useState<"idle" | "dispense" | "refill">("idle");
  const firstTick = useRef(true);

  useEffect(() => {
    if (firstTick.current) {
      firstTick.current = false;
      return;
    }

    setCycle("dispense");

    const t1 = setTimeout(() => setCycle("refill"), 450);
    const t2 = setTimeout(() => setCycle("idle"), 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [dealTick]);

  const toneStyles: Record<ShoeStatus["tone"], string> = {
    gold: "bg-[#e5c779] shadow-[0_0_14px_rgba(229,199,121,0.95)]",
    green: "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]",
    red: "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.9)]",
    orange: "bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.9)]",
    white: "bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]",
  };

  const pulse =
    status.tone === "orange" || status.label.toLowerCase() === "dealing"
      ? "animate-pulse"
      : "";

  return (
    <div
      id="dealer-shoe"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "1700px" }}
    >
      <div
        className="relative"
        style={{
          width: "300px",
          height: "210px",
          transformStyle: "preserve-3d",
          transform: "rotateX(56deg) rotateZ(-28deg)",
        }}
      >
        {/* Ombre au sol */}
        <div
          className="absolute left-2 top-20 h-[170px] w-[290px] rounded-[70px] bg-black/75 blur-3xl"
          style={{ transform: "translateZ(-55px)" }}
        />

        {/* Halo or sous la machine */}
        <div
          className="absolute left-10 top-28 h-[110px] w-[240px] rounded-full bg-[#d7b45b]/10 blur-2xl"
          style={{ transform: "translateZ(-35px)" }}
        />

        {/* Côté gauche */}
        <div
          className="absolute left-0 top-0 h-[160px] w-[42px] rounded-l-[26px] bg-gradient-to-b from-[#111614] via-[#070b09] to-black"
          style={{
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
          }}
        >
          <div className="absolute inset-y-6 left-[6px] w-[2px] rounded-full bg-white/[0.08]" />
          <div className="absolute bottom-7 left-3 h-3 w-3 rounded-full border border-white/10 bg-gradient-to-b from-[#3a3f3d] to-[#0f1312]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/80" />
          </div>
        </div>

        {/* Côté droit */}
        <div
          className="absolute left-[258px] top-0 h-[160px] w-[42px] rounded-r-[26px] border border-black/80 bg-gradient-to-b from-[#2b3230] via-[#101513] to-[#020403]"
          style={{
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          <div className="absolute inset-y-5 left-[5px] w-[3px] rounded-full bg-gradient-to-b from-white/25 to-white/5" />
          <div className="absolute right-3 top-9 flex flex-col gap-[6px]">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[3px] w-[20px] rounded-full bg-black/85 shadow-[inset_0_1px_2px_rgba(0,0,0,0.95)]"
              />
            ))}
          </div>
          <div className="absolute bottom-6 left-3 h-3 w-3 rounded-full border border-white/15 bg-gradient-to-b from-[#3f4543] to-[#0f1312]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[8px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/80" />
          </div>
        </div>

        {/* Face avant (côté joueur) */}
        <div
          className="absolute left-0 top-[160px] h-[46px] w-[260px] rounded-b-[26px] border border-black/80 bg-gradient-to-b from-[#2b3230] via-[#121615] to-[#020403]"
          style={{
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
          }}
        >
          <div className="mx-8 mt-4 h-[3px] rounded-full bg-white/[0.07]" />
          <div className="mx-8 mt-[3px] h-[2px] rounded-full bg-black/75" />
          <div className="absolute bottom-2.5 left-5 h-3 w-3 rounded-full border border-white/15 bg-gradient-to-b from-[#3f4543] to-[#0f1312]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[8px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/80" />
          </div>
          <div className="absolute bottom-2.5 right-5 h-3 w-3 rounded-full border border-white/15 bg-gradient-to-b from-[#3f4543] to-[#0f1312]">
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[8px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-black/80" />
          </div>
        </div>

        {/* Face arrière : bouche de sortie côté dealer */}
        <div
          className="absolute left-0 top-[-14px] h-[46px] w-[260px] rounded-t-[26px] border border-black/80 bg-gradient-to-b from-[#050807] via-[#101513] to-[#1d2321]"
          style={{
            transformOrigin: "bottom center",
            transform: "rotateX(90deg) translateZ(-46px)",
          }}
        >
          {/* Bouche de sortie */}
          <div className="absolute inset-x-10 top-4 h-[16px] rounded-full bg-black shadow-[inset_0_5px_14px_rgba(0,0,0,0.98)]" />
          <div className="absolute inset-x-10 top-[22px] h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#e5c779]/70 to-transparent" />
        </div>

        {/* Dessus de la machine */}
        <div
          className="absolute left-0 top-0 h-[160px] w-[260px] rounded-[26px] border border-black/80 bg-gradient-to-br from-[#3d4543] via-[#171c1a] to-[#030504] shadow-[0_70px_130px_rgba(0,0,0,0.9)]"
          style={{ transform: "translateZ(44px)" }}
        >
          {/* Métal brossé */}
          <div
            className="absolute inset-0 rounded-[26px] opacity-[0.18]"
            style={{
              background:
                "repeating-linear-gradient(115deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 4px)",
            }}
          />

          {/* Reflets */}
          <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-white/20 via-transparent to-black/60" />
          <div className="absolute left-10 top-8 h-24 w-56 rotate-[-8deg] rounded-full bg-gradient-to-r from-white/20 via-white/5 to-transparent blur-[6px]" />

          {/* Liserés or */}
          <div className="absolute inset-x-5 top-2.5 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#e5c779]/90 to-transparent shadow-[0_0_14px_rgba(229,199,121,0.35)]" />
          <div className="absolute inset-x-5 bottom-2.5 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#d7b45b]/50 to-transparent" />

          {/* Écran de statut */}
          <div className="absolute bottom-5 left-5 h-14 w-[150px] rounded-2xl border border-[#e5c779]/50 bg-black/90 shadow-[inset_0_4px_18px_rgba(0,0,0,0.98),0_0_28px_rgba(215,180,91,0.18)]">
            <div className="absolute inset-x-3 top-2 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                Royal Ace
              </span>

              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${toneStyles[status.tone]} ${pulse ? "animate-ping" : ""}`}
                />
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${toneStyles[status.tone]} ${pulse}`}
                />
              </span>
            </div>

            <div className="absolute inset-x-3 bottom-2 flex items-center justify-between">
              <span
                className={`text-[8px] font-bold uppercase tracking-[0.28em] text-white/70 ${pulse}`}
              >
                {status.label}
              </span>

              <span className="text-[8px] font-bold tabular-nums tracking-[0.18em] text-white/35">
                6 DECKS
              </span>
            </div>

            <div className="absolute inset-x-3 top-[26px] h-[2px] rounded-full bg-gradient-to-r from-[#e5c779]/40 via-white/10 to-transparent" />
          </div>

          {/* Bouton doré */}
          <div className="absolute bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full border border-[#e5c779]/80 bg-gradient-to-b from-[#f7e2a3] via-[#d7b45b] to-[#6f571f] shadow-[0_10px_24px_rgba(0,0,0,0.7),inset_0_1px_4px_rgba(255,255,255,0.6)]">
            <div className="h-4 w-4 rounded-full bg-gradient-to-b from-black/50 to-black/75" />
            <div className="absolute left-2.5 top-2 h-[4px] w-5 rounded-full bg-white/45" />
          </div>

          {/* Puits à cartes : ouvert vers le dealer (haut) */}
          <div className="absolute left-[62px] top-[14px] h-[96px] w-[130px] overflow-hidden rounded-t-[14px] rounded-b-[8px] border border-white/10 bg-gradient-to-b from-black/85 to-black/40 shadow-[inset_0_10px_24px_rgba(0,0,0,0.95)]">
            {/* Vitre fumée */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-black/40" />
            <div className="absolute inset-x-3 top-1 h-[2px] rounded-full bg-white/10" />

            {/* Pile de 4 cartes identiques, carte du haut côté dealer */}
            {[0, 1, 2, 3].map((i) => {
              const isTop = i === 3;
              const offset = (3 - i) * 8;

              return (
                <ShoeCard
                  key={i}
                  className={
                    isTop && cycle === "dispense"
                      ? "animate-shoe-top-dispense"
                      : cycle === "refill"
                        ? "animate-shoe-stack-rise"
                        : ""
                  }
                  style={{
                    right: `${10 + offset}px`,
                    top: `${10 + offset}px`,
                    transform: `translateZ(${3 + i * 5}px)`,
                  }}
                >
                  {i === 0 && cycle === "refill" && (
                    <div
                      className="animate-shoe-new-card-enter absolute inset-0 rounded-[4px] border border-black/60"
                      style={{ background: CARD_BG }}
                    >
                      <div className="absolute inset-[5px] flex items-center justify-center rounded-[3px] border border-[#d7b45b]/40 text-[#d7b45b]">
                        ♠
                      </div>
                    </div>
                  )}
                </ShoeCard>
              );
            })}
          </div>

          {/* Texte gravé */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-[0.42em] text-white/25">
            Automatic Dealer
          </div>
        </div>
      </div>
    </div>
  );
}