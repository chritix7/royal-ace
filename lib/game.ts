import type { Card, Hand } from "./blackjack";

export type Phase = "betting" | "dealing" | "insurance" | "player" | "dealer" | "settled";
export type Stats = { played: number; won: number; lost: number; pushed: number; blackjacks: number; profit: number; decisions: number; correct: number; dealerBJs: number; dealerPlayed: number; dealerBusts: number };
export type Records = { biggestWin: number; bestStreak: number; peakBalance: number };
export type Theme = "green" | "blue" | "burgundy" | "vegas";
export type VegasVariant =
  | "anthracite"
  | "plum"
  | "teal"
  | "oak"
  | "obsidian"
  | "carbon";

export type Settings = { decks: number; h17: boolean; bj65: boolean; muted: boolean; spots: number; theme: Theme; vegasVariant?: VegasVariant };
export type Round = { net: number; bj: boolean };
export type S = {
  shoe: Card[];
  dealer: Card[];
  hands: Hand[];
  active: number;
  hole: boolean;
  phase: Phase;
  busy: boolean;
  balance: number;
  bet: number;
  lastBet: number;
  insurance: number;
  message: string;
  net: number | null;
  stats: Stats;
  settings: Settings;
  history: Round[];
  trend: number[];
  ppBet: number;
  t3Bet: number;
  sideNote: string | null;
  streak: number;
  goodStreak: number;
  coach: string | null;
  records: Records;
  unlocked: string[];
  toast: string | null;
  celebrate: number;
  shuffling: boolean;
  dealTick: number;
};

export const CHIPS = [10, 20, 50, 100, 500];
export const CHIP_BG: Record<number, string> = {
  10: "bg-sky-700",
  20: "bg-emerald-700",
  50: "bg-red-700",
  100: "bg-slate-800",
  500: "bg-purple-800",
};
export const MIN_BET = 10;
export const START_BALANCE = 1000;
export const REFILL = 500;
export const EMPTY_STATS: Stats = { played: 0, won: 0, lost: 0, pushed: 0, blackjacks: 0, profit: 0, decisions: 0, correct: 0, dealerBJs: 0, dealerPlayed: 0, dealerBusts: 0 };
export const EMPTY_RECORDS: Records = { biggestWin: 0, bestStreak: 0, peakBalance: START_BALANCE };
export const DEFAULT_SETTINGS: Settings = { decks: 6, h17: false, bj65: false, muted: false, spots: 1, theme: "green", vegasVariant: "anthracite" };
export const INITIAL: S = {
  shoe: [],
  dealer: [],
  hands: [],
  active: 0,
  hole: false,
  phase: "betting",
  busy: false,
  balance: START_BALANCE,
  bet: 20,
  lastBet: 20,
  insurance: 0,
  message: "Place your bet to start.",
  net: null,
  stats: EMPTY_STATS,
  settings: DEFAULT_SETTINGS,
  history: [],
  trend: [START_BALANCE],
  ppBet: 0,
  t3Bet: 0,
  sideNote: null,
  streak: 0,
  goodStreak: 0,
  coach: null,
  records: EMPTY_RECORDS,
  unlocked: [],
  toast: null,
  celebrate: 0,
  shuffling: false,
  dealTick: 0,
};

export const THEMES: Record<Theme, string> = {
  green: "bg-[radial-gradient(ellipse_at_center,#20543c_0%,#103524_60%,#09170f_100%)]",
  blue: "bg-[radial-gradient(ellipse_at_center,#1f3f6b_0%,#10264a_60%,#09142a_100%)]",
  burgundy: "bg-[radial-gradient(ellipse_at_center,#6b2038_0%,#451325_60%,#240a14_100%)]",
  // Vegas: default (anthracite) class — the active color is resolved
  // from s.settings.vegasVariant via VEGAS_VARIANTS below. Use the
  // `tableBg(settings)` helper to get the right class.
  vegas: "bg-[radial-gradient(ellipse_at_center,#2d2832_0%,#191520_60%,#07060a_100%)]",
};
export const BACKS: Record<Theme, [string, string]> = {
  green: ["#142d27", "#1b3d33"],
  blue: ["#10264a", "#1a3a6b"],
  burgundy: ["#3a0f1e", "#561a2e"],
  vegas: ["#1a1419", "#2a2029"],
};

/**
 * Vegas color variants — the Vegas theme opens a secondary color picker
 * so the user can swap the base color within the Vegas family.
 * Keep each entry in the exact same radial-gradient format as the
 * other 3 themes (same stops: 0%, 60%, 100%), so Vegas variants
 * behave identically to green/blue/burgundy, only the color changes.
 */
export type VegasVariantDef = {
  label: string;
  bg: string;
  swatch: string;
  backs: [string, string];
};

export const VEGAS_VARIANTS: Record<VegasVariant, VegasVariantDef> = {
  anthracite: {
    label: "Anthracite",
    bg: "bg-[radial-gradient(ellipse_at_center,#2d2832_0%,#191520_60%,#07060a_100%)]",
    swatch: "#2d2832",
    backs: ["#1a1419", "#2a2029"],
  },
  plum: {
    label: "Midnight Plum",
    bg: "bg-[radial-gradient(ellipse_at_center,#3a2638_0%,#241524_60%,#0e050e_100%)]",
    swatch: "#3a2638",
    backs: ["#1e1020", "#3a1a36"],
  },
  teal: {
    label: "Deep Teal",
    bg: "bg-[radial-gradient(ellipse_at_center,#1e3836_0%,#112423_60%,#06100f_100%)]",
    swatch: "#1e3836",
    backs: ["#0f201e", "#1c3836"],
  },
  oak: {
    label: "Smoked Oak",
    bg: "bg-[radial-gradient(ellipse_at_center,#2d2520_0%,#1b1612_60%,#0a0705_100%)]",
    swatch: "#2d2520",
    backs: ["#1a140f", "#2a2018"],
  },
  obsidian: {
    label: "Obsidian",
    bg: "bg-[radial-gradient(ellipse_at_center,#1a1c22_0%,#0d0f14_60%,#040508_100%)]",
    swatch: "#1a1c22",
    backs: ["#0e1016", "#1a1c22"],
  },
  carbon: {
    label: "Carbon",
    bg: "bg-[radial-gradient(ellipse_at_center,#1f2628_0%,#121818_60%,#060909_100%)]",
    swatch: "#1f2628",
    backs: ["#0f1515", "#1f2828"],
  },
};

/** Resolve the actual table background class given the current settings. */
export function tableBg(s: Settings): string {
  if (s.theme === "vegas") {
    const v = VEGAS_VARIANTS[s.vegasVariant ?? "anthracite"];
    return v.bg;
  }
  return THEMES[s.theme];
}

/** Resolve the card-back color pair given the current settings. */
export function tableBacks(s: Settings): [string, string] {
  if (s.theme === "vegas") {
    const v = VEGAS_VARIANTS[s.vegasVariant ?? "anthracite"];
    return v.backs;
  }
  return BACKS[s.theme];
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const money = (n: number) => n.toLocaleString("en-US");
export const floor10 = (n: number) => Math.floor(n / 10) * 10;