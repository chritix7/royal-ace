import type { Sym } from "./slots";
import { MIAMI_ART } from "./symbolArt";

export type SkinId = "classic" | "miami";
export type SlotLabels = { big: string; mega: string; epic: string; freeSpins: string };

export type Skin = {
  id: SkinId;
  title: string;
  tagline: string;
  emoji: Record<Sym, string>;
  art: Record<Sym, string> | null; // symboles dessinés (null = on utilise les emojis)
  names: Record<Sym, string>;
  labels: SlotLabels;
  confetti: string[];
  // Classes Tailwind complètes (écrites en entier pour que Tailwind les détecte)
  stage: string; // fond de la scène
  titleClass: string; // texte de l'enseigne
  signBox: string; // cadre lumineux de l'enseigne
  bezel: string; // cadre de la machine
  reel: string; // fond d'un rouleau
  divider: string; // séparation entre les rouleaux
  win: string; // case gagnante
  wildBg: string;
  scatterBg: string;
  wildTag: string; // petite étiquette "WILD"
  scatterTag: string; // petite étiquette "SCATTER"
  led: string; // chiffres lumineux
  ledBox: string;
  spinBtn: string;
  betOn: string; // case de mise sélectionnée
  accent: string;
  lineColor: string; // couleur du trait de la ligne gagnante
  bulb: string; // couleur des ampoules
};

export const SKINS: Record<SkinId, Skin> = {
  classic: {
    id: "classic",
    title: "Golden Reels",
    tagline: "Classic casino",
    emoji: { cherry: "🍒", lemon: "🍋", grape: "🍇", bell: "🔔", gem: "💎", seven: "7️⃣", wild: "👑", scatter: "⭐" },
    art: null,
    names: { cherry: "Cherry", lemon: "Lemon", grape: "Grapes", bell: "Bell", gem: "Diamond", seven: "Seven", wild: "Crown", scatter: "Star" },
    labels: { big: "BIG WIN", mega: "MEGA WIN", epic: "EPIC WIN", freeSpins: "FREE SPINS" },
    confetti: ["#e5c779", "#d7b45b", "#34d399", "#f87171", "#60a5fa", "#ffffff"],
    stage: "bg-[radial-gradient(ellipse_at_center,#254336_0%,#12271e_48%,#0a120e_100%)]",
    titleClass: "text-[#e5c779] [text-shadow:0_0_16px_#c8a65b88]",
    signBox: "border-[#c8a65b]/60 shadow-[0_0_24px_#c8a65b44]",
    bezel: "bg-[linear-gradient(145deg,#ffe9a3_0%,#b8860b_35%,#ffe9a3_55%,#8a6508_100%)] shadow-[0_0_30px_#c8a65b55]",
    reel: "bg-[#f5eedc]",
    divider: "border-[#c8a65b]/50",
    win: "animate-pulse bg-[#e5c779]/45 ring-2 ring-inset ring-[#c8a65b]",
    wildBg: "bg-[radial-gradient(circle,#fff6cf_0%,#f5d778_100%)]",
    scatterBg: "bg-[radial-gradient(circle,#d9ffe9_0%,#86efac_100%)]",
    wildTag: "from-[#f5d778] to-[#c8a65b] text-black",
    scatterTag: "from-[#34d399] to-[#10b981] text-black",
    led: "text-[#ffb347] [text-shadow:0_0_8px_#ff9f1c]",
    ledBox: "bg-black/70 border-white/10",
    spinBtn: "bg-[radial-gradient(circle_at_35%_30%,#ffe9a3,#d7b45b_55%,#8a6508)] text-[#10130e] ring-4 ring-white/50 shadow-[0_0_26px_#d7b45b88]",
    betOn: "border-white/60 bg-[linear-gradient(180deg,#ffe9a3,#d7b45b)] text-[#10130e]",
    accent: "text-[#e5c779]",
    lineColor: "#dc2626",
    bulb: "#fff1b0",
  },
  // Tribut original aux polars des années 80 : Miami, néons, ascension d'un parrain.
  miami: {
    id: "miami",
    title: "Miami Kingpin",
    tagline: "Rise from the docks. Own the skyline.",
    emoji: { cherry: "🌴", lemon: "🍹", grape: "🕶️", bell: "🚤", gem: "🏎️", seven: "🐅", wild: "🕴️", scatter: "🌎" },
    art: MIAMI_ART,
    names: { cherry: "Palm tree", lemon: "Cocktail", grape: "Shades", bell: "Speedboat", gem: "Sports car", seven: "Tiger", wild: "The Boss", scatter: "Globe" },
    labels: { big: "BIG SCORE", mega: "EMPIRE MOVE", epic: "KINGPIN WIN", freeSpins: "PENTHOUSE SPINS" },
    confetti: ["#ff4fa3", "#22d3ee", "#ffd166", "#ffffff", "#a78bfa", "#ff2e88"],
    stage: "bg-[linear-gradient(180deg,#12062e_0%,#2a0d55_55%,#7a1d6b_100%)]",
    titleClass: "neon-flicker text-[#ff7ac0] [text-shadow:0_0_18px_#ff2e88,0_0_44px_#ff2e88]",
    signBox: "border-[#ff4fa3]/70 bg-black/30 shadow-[0_0_30px_#ff2e8866,inset_0_0_20px_#ff2e8833]",
    bezel: "bg-[linear-gradient(145deg,#ff9fd0_0%,#c2185b_35%,#ff9fd0_55%,#7a1d6b_100%)] shadow-[0_0_44px_#ff2e8877]",
    reel: "bg-[linear-gradient(180deg,#1a0838,#2d1060_50%,#1a0838)]",
    divider: "border-[#ff4fa3]/40",
    win: "animate-pulse bg-[#22d3ee]/30 ring-2 ring-inset ring-[#22d3ee]",
    wildBg: "bg-[radial-gradient(circle_at_50%_40%,#ff4fa3aa_0%,#4c1d95_78%)]",
    scatterBg: "bg-[radial-gradient(circle_at_50%_40%,#22d3eeaa_0%,#1e1b4b_78%)]",
    wildTag: "from-[#ff2e88] to-[#ff7ac0] text-white",
    scatterTag: "from-[#22d3ee] to-[#60a5fa] text-black",
    led: "text-[#ff9fd0] [text-shadow:0_0_10px_#ff2e88]",
    ledBox: "bg-[#12062e] border-[#ff4fa3]/40",
    spinBtn: "bg-[radial-gradient(circle_at_35%_30%,#ff9fd0,#e11d74_55%,#7a1d6b)] text-white ring-4 ring-[#ffd166]/70 shadow-[0_0_30px_#ff2e88aa]",
    betOn: "border-[#ffd166] bg-[linear-gradient(180deg,#ff9fd0,#e11d74)] text-white",
    accent: "text-[#ff7ac0]",
    lineColor: "#22d3ee",
    bulb: "#ffd166",
  },
};

/** Rangs de l'empire : ils montent avec le total gagné à la machine (sauvegardé). */
export const RANKS = [
  { min: 0, name: "Dockhand" },
  { min: 3_000, name: "Street hustler" },
  { min: 15_000, name: "Lieutenant" },
  { min: 60_000, name: "Boss" },
  { min: 250_000, name: "Kingpin" },
];

export function rankOf(totalWon: number) {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (totalWon >= r.min) index = i;
  });
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const progress = next ? (totalWon - current.min) / (next.min - current.min) : 1;
  return { index, current, next, progress: Math.min(1, Math.max(0, progress)) };
}