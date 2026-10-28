import type { Card, Hand } from "./blackjack";

export type Phase = "betting" | "dealing" | "insurance" | "player" | "dealer" | "settled";
export type Stats = { played: number; won: number; lost: number; pushed: number; blackjacks: number; profit: number; decisions: number; correct: number; dealerBJs: number; dealerPlayed: number; dealerBusts: number };
export type Records = { biggestWin: number; bestStreak: number; peakBalance: number };
export type Theme = "green" | "blue" | "burgundy" | "vegas";
export type Settings = { decks: number; h17: boolean; bj65: boolean; muted: boolean; spots: number; theme: Theme };
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
export const DEFAULT_SETTINGS: Settings = { decks: 6, h17: false, bj65: false, muted: false, spots: 1, theme: "green" };
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
  // Vegas: deep bordeaux felt with a hot gold spot — the overlay component
  // adds the damask pattern + concentric arcs + sparkles on top.
  vegas: "bg-[radial-gradient(ellipse_at_center,#7a1f3b_0%,#4a0f22_55%,#1f0510_100%)]",
};
export const BACKS: Record<Theme, [string, string]> = {
  green: ["#142d27", "#1b3d33"],
  blue: ["#10264a", "#1a3a6b"],
  burgundy: ["#3a0f1e", "#561a2e"],
  vegas: ["#3a0a1b", "#5a1130"],
};

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const money = (n: number) => n.toLocaleString("en-US");
export const floor10 = (n: number) => Math.floor(n / 10) * 10;