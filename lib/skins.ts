import { useEffect, useState } from "react";
import type { Sym } from "./slots";
import { MIAMI_ART } from "./symbolArt";
import { BELLS_ART, GOLD_ART, PHARAOH_ART } from "./symbolArt2";
import { WINTER_ART } from "./symbolArt3";
import { isWinter } from "./advent";
import { today } from "./clock";

export type SkinId = "classic" | "miami" | "gold" | "pharaoh" | "winter";
export const SKIN_IDS: SkinId[] = ["miami", "gold", "pharaoh", "classic", "winter"];
/** Machines open today: Winter Royale only from 1 December to 6 January. */
export const openSkins = (key = today()): SkinId[] => SKIN_IDS.filter((id) => id !== "winter" || isWinter(key));
/** openSkins() read after mount (the prerendered page never shows the seasonal machine). */
export function useOpenSkins(): SkinId[] {
  const [ids, setIds] = useState<SkinId[]>(() => SKIN_IDS.filter((id) => id !== "winter"));
  useEffect(() => setIds(openSkins()), []);
  return ids;
}
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
  // Winter Royale: the limited winter machine (1 December – 6 January). Miami's maths.
  winter: {
    id: "winter",
    title: "Winter Royale",
    tagline: "Limited edition. Snowmen expand, wilds freeze.",
    emoji: { cherry: "🍬", lemon: "🔵", grape: "🍪", bell: "🔔", gem: "🎁", seven: "❄️", wild: "⛄", scatter: "🔮" },
    art: WINTER_ART,
    names: { cherry: "Candy cane", lemon: "Bauble", grape: "Gingerbread", bell: "Sleigh bell", gem: "Gift", seven: "Ice crystal", wild: "Snowman", scatter: "Snow globe" },
    labels: { big: "BIG WIN", mega: "BLIZZARD WIN", epic: "WINTER LEGEND", freeSpins: "FROZEN SPINS" },
    confetti: ["#ffffff", "#cfe7ff", "#f3e2a6", "#7fb6e6", "#e23b4a", "#ffffff"],
    stage: "bg-[radial-gradient(ellipse_at_50%_0%,#2b4f7a_0%,#122236_45%,#070b12_100%)]",
    titleClass: "text-[#f3f8ff] [text-shadow:0_0_16px_#7fb6e6,0_0_36px_#7fb6e699]",
    signBox: "border-[#cfe7ff]/70 bg-black/30 shadow-[0_0_28px_#7fb6e666,inset_0_0_18px_#7fb6e633]",
    bezel: "bg-[linear-gradient(145deg,#fff4c2_0%,#a87a2c_30%,#e8f4ff_52%,#f3e2a6_70%,#6b4f1d_100%)] shadow-[0_0_40px_#7fb6e655]",
    reel: "bg-[linear-gradient(180deg,#0c1626,#17263c_50%,#0c1626)]",
    divider: "border-[#cfe7ff]/25",
    win: "animate-pulse bg-[#cfe7ff]/25 ring-2 ring-inset ring-[#f3e2a6]",
    wildBg: "bg-[radial-gradient(circle_at_50%_40%,#cfe7ff88_0%,#17263c_78%)]",
    scatterBg: "bg-[radial-gradient(circle_at_50%_40%,#7fb6e688_0%,#0c1626_78%)]",
    wildTag: "from-[#ffffff] to-[#9fc7ea] text-[#0b1220]",
    scatterTag: "from-[#f3e2a6] to-[#c79b40] text-black",
    led: "text-[#e8f4ff] [text-shadow:0_0_10px_#7fb6e6]",
    ledBox: "bg-[#0a1320] border-[#cfe7ff]/35",
    spinBtn: "bg-[radial-gradient(circle_at_35%_30%,#ffffff,#9fc7ea_45%,#2b4f7a)] text-[#0b1220] ring-4 ring-[#f3e2a6]/70 shadow-[0_0_30px_#7fb6e6aa]",
    betOn: "border-[#f3e2a6] bg-[linear-gradient(180deg,#e8f4ff,#7fb6e6)] text-[#0b1220]",
    accent: "text-[#cfe7ff]",
    lineColor: "#f3e2a6",
    bulb: "#e8f4ff",
  },
  // Royal Bells (the old Classic): glossy fruits on dark velvet, the bell bonus.
  classic: {
    id: "classic",
    title: "Royal Bells",
    tagline: "Hot sevens. Five bells ring the bonus.",
    emoji: { cherry: "🍒", lemon: "🍋", grape: "🍇", bell: "🔔", gem: "🍉", seven: "🫐", wild: "7️⃣", scatter: "⭐" },
    art: BELLS_ART,
    names: { cherry: "Cherries", lemon: "Lemon", grape: "Grapes", bell: "Golden bell", gem: "Watermelon", seven: "Plum", wild: "Hot 7", scatter: "Star" },
    labels: { big: "BIG WIN", mega: "MEGA WIN", epic: "EPIC WIN", freeSpins: "FREE SPINS" },
    confetti: ["#f6dd94", "#ff4d5e", "#ffd166", "#ffffff", "#c78cff", "#7bd36a"],
    stage: "bg-[radial-gradient(ellipse_at_50%_105%,#7a1f06_0%,#3a0a08_35%,#120306_70%,#070103_100%)]",
    titleClass: "text-[#ffd98a] [text-shadow:0_0_16px_#ff4d5e88]",
    signBox: "border-[#e5c779]/70 bg-black/40 shadow-[0_0_26px_#ff4d5e44]",
    bezel: "bg-[linear-gradient(145deg,#fff4c2_0%,#a87a2c_35%,#fff4c2_55%,#6b4f1d_100%)] shadow-[0_0_34px_#ff4d5e44]",
    reel: "bg-[linear-gradient(180deg,#0d0a16,#1a1326_50%,#0d0a16)]",
    divider: "border-[#e5c779]/25",
    win: "animate-pulse bg-[#ffd166]/25 ring-2 ring-inset ring-[#ffd166]",
    wildBg: "bg-[radial-gradient(circle_at_50%_45%,#ff4d0066_0%,#1a1326_78%)]",
    scatterBg: "bg-[radial-gradient(circle_at_50%_40%,#3a6dff55_0%,#1a1326_78%)]",
    wildTag: "from-[#fff4c2] to-[#c79b40] text-black",
    scatterTag: "from-[#5a8cff] to-[#2f5fd6] text-white",
    led: "text-[#ffd166] [text-shadow:0_0_8px_#ff9f1c]",
    ledBox: "bg-black/70 border-[#e5c779]/25",
    spinBtn: "bg-[radial-gradient(circle_at_35%_30%,#ffb3b3,#d11b3a_55%,#5e0610)] text-white ring-4 ring-[#ffd166]/70 shadow-[0_0_26px_#ff4d5e88]",
    betOn: "border-[#ffd166] bg-[linear-gradient(180deg,#ffe9a3,#d7b45b)] text-[#10130e]",
    accent: "text-[#ffd98a]",
    lineColor: "#ffd166",
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
  // Chrysonyx Gold: the house machine. Black lacquer, gold and ivory.
  gold: {
    id: "gold",
    title: "Chrysonyx Gold",
    tagline: "Every wild multiplies.",
    emoji: { cherry: "🥂", lemon: "💍", grape: "⌚", bell: "🪙", gem: "💎", seven: "👑", wild: "🂡", scatter: "⚜️" },
    art: GOLD_ART,
    names: { cherry: "Champagne", lemon: "Ring", grape: "Watch", bell: "Gold bars", gem: "Diamond", seven: "Crown", wild: "Golden Ace", scatter: "Royal seal" },
    labels: { big: "BIG WIN", mega: "GOLD RUSH", epic: "ROYAL FORTUNE", freeSpins: "GOLDEN SPINS" },
    confetti: ["#f6dd94", "#e5c779", "#ffffff", "#c99b42", "#fff4c2", "#a87a2c"],
    stage: "bg-[radial-gradient(ellipse_at_50%_30%,#2a2214_0%,#120e08_55%,#050403_100%)]",
    titleClass: "text-[#f6dd94] [text-shadow:0_0_16px_#d7b45b88]",
    signBox: "border-[#e5c779]/70 bg-black/40 shadow-[0_0_26px_#d7b45b44]",
    bezel: "bg-[linear-gradient(145deg,#fff4c2_0%,#a87a2c_35%,#fff4c2_55%,#6b4f1d_100%)] shadow-[0_0_34px_#d7b45b55]",
    reel: "bg-[linear-gradient(180deg,#141210,#1f1b14_50%,#141210)]",
    divider: "border-[#d7b45b]/35",
    win: "animate-pulse bg-[#f6dd94]/25 ring-2 ring-inset ring-[#f6dd94]",
    wildBg: "bg-[radial-gradient(circle_at_50%_40%,#f6dd9466_0%,#1a1406_78%)]",
    scatterBg: "bg-[radial-gradient(circle_at_50%_40%,#ffffff44_0%,#1a1406_78%)]",
    wildTag: "from-[#fff4c2] to-[#c79b40] text-black",
    scatterTag: "from-[#ffffff] to-[#d9cfb8] text-black",
    led: "text-[#f6dd94] [text-shadow:0_0_8px_#d7b45b]",
    ledBox: "bg-black/70 border-[#d7b45b]/30",
    spinBtn: "bg-[radial-gradient(circle_at_35%_30%,#fff4c2,#d9ae54_55%,#6b4f1d)] text-[#1a1206] ring-4 ring-white/40 shadow-[0_0_26px_#d7b45b88]",
    betOn: "border-[#fff4c2] bg-[linear-gradient(180deg,#fff4c2,#c79b40)] text-[#1a1206]",
    accent: "text-[#f6dd94]",
    lineColor: "#f6dd94",
    bulb: "#fff4c2",
  },
  // Pharaoh's Vault: sandstone, lapis and gold.
  pharaoh: {
    id: "pharaoh",
    title: "Pharaoh's Vault",
    tagline: "One symbol rules the free spins.",
    emoji: { cherry: "☥", lemon: "🪷", grape: "👁️", bell: "🪲", gem: "🔺", seven: "🐈‍⬛", wild: "🗿", scatter: "☀️" },
    art: PHARAOH_ART,
    names: { cherry: "Ankh", lemon: "Lotus", grape: "Eye of Horus", bell: "Scarab", gem: "Pyramid", seven: "Bastet", wild: "Pharaoh", scatter: "Sun of Ra" },
    labels: { big: "BIG WIN", mega: "TREASURE", epic: "PHARAOH'S FORTUNE", freeSpins: "TOMB SPINS" },
    confetti: ["#f6dd94", "#5a8cff", "#ffb347", "#ffffff", "#7cf2c9", "#d7b45b"],
    stage: "bg-[linear-gradient(180deg,#0b1430_0%,#1b2a52_45%,#5a3a17_100%)]",
    titleClass: "text-[#ffd98a] [text-shadow:0_0_16px_#ff9a3c88]",
    signBox: "border-[#e5c779]/70 bg-[#0b1430]/60 shadow-[0_0_26px_#5a8cff44]",
    bezel: "bg-[linear-gradient(145deg,#ffe8a8_0%,#b9894a_35%,#ffe8a8_55%,#6b4a1d_100%)] shadow-[0_0_34px_#5a8cff44]",
    reel: "bg-[linear-gradient(180deg,#e9d7ae,#f6e7c6_50%,#e9d7ae)]",
    divider: "border-[#8a6a3a]/45",
    win: "animate-pulse bg-[#5a8cff]/25 ring-2 ring-inset ring-[#2f5fd6]",
    wildBg: "bg-[radial-gradient(circle_at_50%_40%,#fff3c4_0%,#e2c487_80%)]",
    scatterBg: "bg-[radial-gradient(circle_at_50%_40%,#ffe2a8_0%,#e6b864_80%)]",
    wildTag: "from-[#2f5fd6] to-[#14307a] text-white",
    scatterTag: "from-[#ff9a3c] to-[#d9631f] text-black",
    led: "text-[#ffd98a] [text-shadow:0_0_8px_#ff9a3c]",
    ledBox: "bg-[#0b1430] border-[#e5c779]/35",
    spinBtn: "bg-[radial-gradient(circle_at_35%_30%,#ffe8a8,#d9a54a_55%,#6b4a1d)] text-[#1a1206] ring-4 ring-[#5a8cff]/60 shadow-[0_0_26px_#5a8cff77]",
    betOn: "border-[#ffe8a8] bg-[linear-gradient(180deg,#ffe8a8,#d9a54a)] text-[#1a1206]",
    accent: "text-[#ffd98a]",
    lineColor: "#2f5fd6",
    bulb: "#ffe8a8",
  },
};

/** Rangs de l'empire : ils montent avec le total gagné à la machine (sauvegardé). */
/** Ranks of the Miami machine. Reaching one pays a one-time promotion bonus. */
export const RANKS = [
  { min: 0, name: "Dockhand", bonus: 0 },
  { min: 3_000, name: "Street hustler", bonus: 1_000 },
  { min: 15_000, name: "Lieutenant", bonus: 3_000 },
  { min: 60_000, name: "Boss", bonus: 8_000 },
  { min: 250_000, name: "Kingpin", bonus: 25_000 },
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