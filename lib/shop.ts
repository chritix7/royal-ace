import { useSyncExternalStore } from "react";
import { today } from "./clock";
import { wallet } from "./wallet";

/**
 * The shop, paid in virtual chips only. Everything bought changes
 * something you see: chip sets on every betting rail, the shower that
 * falls on big wins, an avatar and a title next to your name, your VIP
 * card, table felts, roulette rooms — plus an XP boost and a mystery chest.
 * Kept with the rest of the progress (and synced by the cloud save).
 */
export type ShopCat = "chips" | "effect" | "avatar" | "title" | "card" | "back" | "dice" | "blackjack" | "roulette" | "boost";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type ShopItem = {
  id: string;
  cat: ShopCat;
  name: string;
  note: string;
  price: number;
  swatch: [string, string, string];
  /** avatar emblem, title text, effect particle… */
  glyph?: string;
};

export const SHOP: ShopItem[] = [
  // Chip sets — drawn on every betting rail.
  { id: "chips:classic", cat: "chips", name: "Casino classic", note: "The house colours", price: 0, swatch: ["#0a6ea8", "#b3301e", "#d4a84e"] },
  { id: "chips:carbon", cat: "chips", name: "Carbon 911", note: "Matte black, gold inlays", price: 50000, swatch: ["#111114", "#2a2b30", "#e5c779"] },
  { id: "chips:neon", cat: "chips", name: "Neon nights", note: "Vegas strip glow", price: 75000, swatch: ["#13001f", "#ff2fd1", "#22e6ff"] },
  { id: "chips:jade", cat: "chips", name: "Jade dynasty", note: "Jade and old gold", price: 90000, swatch: ["#06231a", "#1f8a5f", "#e8c36a"] },
  { id: "chips:porcelain", cat: "chips", name: "Royal porcelain", note: "White china, gold leaf", price: 120000, swatch: ["#f3efe6", "#d9cfb8", "#c9a24a"] },
  { id: "chips:ruby", cat: "chips", name: "Obsidian ruby", note: "Black glass, ruby core", price: 200000, swatch: ["#060507", "#5a0610", "#ff4d5e"] },
  // Win showers — on big wins (computers; phones stay light).
  { id: "fx:coins", cat: "effect", name: "Gold coins", note: "The classic shower", price: 0, swatch: ["#2a1d05", "#f5c518", "#fff3b0"], glyph: "coin" },
  { id: "fx:confetti", cat: "effect", name: "Confetti", note: "Party at the table", price: 30000, swatch: ["#120a18", "#ff4fa3", "#3dd6ff"], glyph: "confetti" },
  { id: "fx:stars", cat: "effect", name: "Shooting stars", note: "Gold stars falling", price: 35000, swatch: ["#0b0a14", "#3a2f6b", "#ffd76a"], glyph: "star" },
  { id: "fx:cards", cat: "effect", name: "Royal cards", note: "A rain of aces", price: 45000, swatch: ["#0d1a12", "#f4efe2", "#b3121f"], glyph: "card" },
  { id: "fx:bills", cat: "effect", name: "Banknotes", note: "Make it rain", price: 60000, swatch: ["#07160d", "#3f8f52", "#c9f0b5"], glyph: "bill" },
  { id: "fx:diamonds", cat: "effect", name: "Diamonds", note: "Ice-cold sparkle", price: 90000, swatch: ["#06121c", "#5ed1ff", "#ffffff"], glyph: "diamond" },
  // Avatars — next to your name, on the VIP card and in the ranking.
  { id: "av:ace", cat: "avatar", name: "Ace of spades", note: "Where it all begins", price: 0, swatch: ["#0c0c0e", "#1d1d21", "#e5c779"], glyph: "♠" },
  { id: "av:heart", cat: "avatar", name: "Ruby heart", note: "Play with heart", price: 20000, swatch: ["#1a0508", "#7a0f1f", "#ff6b7d"], glyph: "♥" },
  { id: "av:clover", cat: "avatar", name: "Lucky clover", note: "Luck is on your side", price: 30000, swatch: ["#04140b", "#1c6b3f", "#7dffb0"], glyph: "☘" },
  { id: "av:star", cat: "avatar", name: "Star player", note: "Born to shine", price: 35000, swatch: ["#0d0b16", "#3c2f72", "#ffd76a"], glyph: "★" },
  { id: "av:queen", cat: "avatar", name: "The Queen", note: "Rules the table", price: 60000, swatch: ["#140a1a", "#5a2a78", "#f0c8ff"], glyph: "♛" },
  { id: "av:king", cat: "avatar", name: "The King", note: "Bows to no dealer", price: 90000, swatch: ["#120d04", "#6b4a12", "#ffe08a"], glyph: "♚" },
  { id: "av:lys", cat: "avatar", name: "Fleur-de-lys", note: "Old-money elegance", price: 150000, swatch: ["#06101f", "#1d3f86", "#e8eef8"], glyph: "⚜" },
  // Titles — under your name.
  { id: "title:newcomer", cat: "title", name: "Newcomer", note: "Fresh at the tables", price: 0, swatch: ["#111", "#222", "#999"], glyph: "Newcomer" },
  { id: "title:owl", cat: "title", name: "Night Owl", note: "Last one at the table", price: 15000, swatch: ["#0a0c18", "#26306b", "#b9c4ff"], glyph: "Night Owl" },
  { id: "title:shark", cat: "title", name: "Card Shark", note: "Counts every card", price: 25000, swatch: ["#04121a", "#0f4a63", "#7fe3ff"], glyph: "Card Shark" },
  { id: "title:lucky", cat: "title", name: "Lucky Charm", note: "Fortune follows you", price: 30000, swatch: ["#04140b", "#1c6b3f", "#7dffb0"], glyph: "Lucky Charm" },
  { id: "title:striker", cat: "title", name: "Penalty King", note: "Never misses a corner", price: 40000, swatch: ["#0b1a0e", "#2c6b35", "#f2f2f2"], glyph: "Penalty King" },
  { id: "title:roller", cat: "title", name: "High Roller", note: "Bets big, smiles bigger", price: 80000, swatch: ["#140c02", "#6b4a12", "#ffd76a"], glyph: "High Roller" },
  { id: "title:whale", cat: "title", name: "The Whale", note: "The casino knows your name", price: 250000, swatch: ["#020a14", "#0f3a6b", "#9be7ff"], glyph: "The Whale" },
  { id: "title:legend", cat: "title", name: "Chrysonyx Legend", note: "The ultimate flex", price: 1000000, swatch: ["#120d02", "#c99b42", "#fff3c4"], glyph: "Chrysonyx Legend" },
  // VIP card finishes.
  { id: "card:gold", cat: "card", name: "Carbon gold", note: "The house finish", price: 0, swatch: ["#08080a", "#1d1d21", "#e5c779"] },
  { id: "card:platinum", cat: "card", name: "Platinum", note: "Brushed steel, silver", price: 100000, swatch: ["#0d0f12", "#2c3036", "#e6ebf2"] },
  { id: "card:rose", cat: "card", name: "Rose gold", note: "Warm copper sheen", price: 150000, swatch: ["#140b0a", "#3a2320", "#f2b8a2"] },
  { id: "card:diamond", cat: "card", name: "Black diamond", note: "Facets and ice", price: 250000, swatch: ["#020204", "#141a26", "#9be7ff"] },
  // Card backs — blackjack and Hold'em. Swatch: field, field light, ornament.
  { id: "back:table", cat: "back", name: "Table colours", note: "Follows the felt", price: 0, swatch: ["#142d27", "#1b3d33", "#e5c779"] },
  { id: "back:onyx", cat: "back", name: "Onyx & gold", note: "Black lacquer, gold lattice", price: 30000, swatch: ["#08080a", "#1d1d22", "#e5c779"] },
  { id: "back:bordeaux", cat: "back", name: "Bordeaux", note: "Deep wine, gold rosette", price: 40000, swatch: ["#2a0610", "#57101f", "#e9c77e"] },
  { id: "back:royal", cat: "back", name: "Royal blue", note: "Royal blue, silver lattice", price: 50000, swatch: ["#0a1a3f", "#1d3f8f", "#dfe6f2"] },
  { id: "back:emerald", cat: "back", name: "Emerald", note: "Emerald and old gold", price: 80000, swatch: ["#032018", "#0c5a3d", "#e8c36a"] },
  { id: "back:ivory", cat: "back", name: "Ivory", note: "Ivory card, gold engraving", price: 140000, swatch: ["#d8ccb0", "#f1e9d6", "#8f6a26"] },
  { id: "back:neon", cat: "back", name: "Vegas neon", note: "Violet night, pink glow", price: 220000, swatch: ["#12001c", "#3d0b57", "#ff5fd6"] },
  // Dice — the craps table. Swatch: face, face shade, pips.
  { id: "dice:ivory", cat: "dice", name: "Casino ivory", note: "White dice, red ace", price: 0, swatch: ["#ffffff", "#d8cfbb", "#0b0b0b"] },
  { id: "dice:ruby", cat: "dice", name: "Ruby glass", note: "Clear red, white pips", price: 30000, swatch: ["#e0303f", "#7a0a16", "#ffffff"] },
  { id: "dice:onyx", cat: "dice", name: "Onyx", note: "Black dice, gold pips", price: 50000, swatch: ["#2a2a2e", "#050506", "#e5c779"] },
  { id: "dice:jade", cat: "dice", name: "Jade", note: "Green jade, white pips", price: 80000, swatch: ["#3fae7f", "#0d5236", "#f4fff8"] },
  { id: "dice:sapphire", cat: "dice", name: "Sapphire", note: "Deep blue, silver pips", price: 120000, swatch: ["#3a6fd8", "#0b2366", "#eef3ff"] },
  { id: "dice:gold", cat: "dice", name: "Solid gold", note: "Gold dice, black pips", price: 250000, swatch: ["#fff0b8", "#b98a2e", "#140f04"] },
  // Blackjack felts.
  { id: "bj:green", cat: "blackjack", name: "Classic green", note: "Green baize, red backs", price: 0, swatch: ["#0b2a1c", "#11603b", "#d7b45b"] },
  { id: "bj:blue", cat: "blackjack", name: "Midnight blue", note: "Blue felt, navy backs", price: 25000, swatch: ["#061428", "#13407a", "#d7b45b"] },
  { id: "bj:burgundy", cat: "blackjack", name: "Burgundy", note: "Wine felt, black backs", price: 25000, swatch: ["#1a0509", "#6a1323", "#e3c27a"] },
  { id: "bj:vegas", cat: "blackjack", name: "Vegas lounge", note: "Five Vegas variants", price: 60000, swatch: ["#0c0d0f", "#3a1f4a", "#f0d38b"] },
  // Roulette rooms.
  { id: "rl:carbon", cat: "roulette", name: "Carbon 911", note: "Matte black, carbon, gold", price: 0, swatch: ["#0c0d0f", "#24262b", "#d7b45b"] },
  { id: "rl:monaco", cat: "roulette", name: "Monaco", note: "Green baize, mahogany, brass", price: 40000, swatch: ["#1a0f0a", "#0f5c3a", "#d9b45e"] },
  { id: "rl:velours", cat: "roulette", name: "Rouge velours", note: "Bordeaux velvet, black lacquer", price: 40000, swatch: ["#140608", "#5a0f1c", "#e3c27a"] },
  { id: "rl:royal", cat: "roulette", name: "Royal Blue", note: "Royal blue, white, silver", price: 80000, swatch: ["#06102a", "#0f3a8c", "#e8eef8"] },
];

/** Consumables: bought again and again. */
export const BOOSTS = [
  { id: "boost:xp1", name: "XP ×2 · 1 hour", note: "Double XP in every game for an hour", price: 15000, minutes: 60 },
  { id: "boost:xp24", name: "XP ×2 · 24 hours", note: "A full day of double XP", price: 180000, minutes: 24 * 60 },
] as const;
export const CHEST_PRICE = 40000;

export const SHOP_CATS: { id: ShopCat; label: string; where: string }[] = [
  { id: "chips", label: "Chip sets", where: "On every betting rail, in all games." },
  { id: "effect", label: "Win showers", where: "Falls on your big wins (computers)." },
  { id: "avatar", label: "Avatars", where: "Next to your name, on your VIP card and in the ranking." },
  { id: "title", label: "Titles", where: "Shown under your name." },
  { id: "card", label: "VIP card finish", where: "Your VIP card (tap your name in the lobby)." },
  { id: "back", label: "Card backs", where: "Blackjack and Hold'em cards." },
  { id: "dice", label: "Dice", where: "The craps dice." },
  { id: "blackjack", label: "Blackjack felts", where: "Choose it in the blackjack table settings (Felt)." },
  { id: "roulette", label: "Roulette rooms", where: "Choose it in the roulette Style panel." },
  { id: "boost", label: "Boosts", where: "Consumables — buy as often as you like." },
];
/** What can be equipped straight from the shop, and the slot it goes in. */
export const EQUIP_SLOT: Partial<Record<ShopCat, "chips" | "effect" | "avatar" | "title" | "card" | "back" | "dice">> = {
  chips: "chips",
  back: "back",
  dice: "dice",
  effect: "effect",
  avatar: "avatar",
  title: "title",
  card: "card",
};

export const rarityOf = (price: number): Rarity => (price >= 200000 ? "legendary" : price >= 80000 ? "epic" : price >= 30000 ? "rare" : "common");

type State = { owned: string[]; card: string; chips: string; effect: string; avatar: string; title: string; back: string; dice: string; xpUntil: number; chests: number; deal: { day: string; id: string | null } | null };
const KEY = "royalace:shop";
const FREE = SHOP.filter((i) => i.price === 0).map((i) => i.id);
const EMPTY: State = { owned: FREE, card: "card:gold", chips: "chips:classic", effect: "fx:coins", avatar: "av:ace", title: "title:newcomer", back: "back:table", dice: "dice:ivory", xpUntil: 0, chests: 0, deal: null };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<State>;
      state = {
        owned: [...new Set([...FREE, ...(Array.isArray(s.owned) ? s.owned : [])])],
        card: str(s.card, EMPTY.card),
        chips: str(s.chips, EMPTY.chips),
        effect: str(s.effect, EMPTY.effect),
        avatar: str(s.avatar, EMPTY.avatar),
        title: str(s.title, EMPTY.title),
        back: str(s.back, EMPTY.back),
        dice: str(s.dice, EMPTY.dice),
        xpUntil: Number(s.xpUntil) || 0,
        chests: Number(s.chests) || 0,
        deal: s.deal && typeof s.deal.day === "string" ? s.deal : null,
      };
    } else {
      // First run of the shop: keep whatever felt / room was already in use.
      const owned = new Set(FREE);
      try {
        const bj = JSON.parse(localStorage.getItem("royalace:blackjack") ?? "null");
        if (bj?.settings?.theme) owned.add(`bj:${bj.settings.theme}`);
        const rl = JSON.parse(localStorage.getItem("royalace:roulette") ?? "null");
        if (rl?.theme) owned.add(`rl:${rl.theme}`);
      } catch {}
      state = { ...EMPTY, owned: [...owned] };
      persist();
    }
  } catch {}
}
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  persist();
  emit();
};

// ── daily deal: one item you don't own, 30% off, changes at midnight ──
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export const DEAL_OFF = 0.3;
function pickDeal(owned: string[], day: string): ShopItem | null {
  const pool = SHOP.filter((i) => i.price > 0 && !owned.includes(i.id));
  if (!pool.length) return null;
  return pool[hash(`deal:${day}`) % pool.length];
}
/** Today's deal, fixed for the whole day (buying it does not roll a new one). */
export function dailyDeal(day: string): ShopItem | null {
  load();
  if (!day) return null;
  if (state.deal?.day !== day) {
    state = { ...state, deal: { day, id: pickDeal(state.owned, day)?.id ?? null } };
    persist();
  }
  return state.deal?.id ? SHOP.find((i) => i.id === state.deal!.id) ?? null : null;
}
export const dealPrice = (p: number) => Math.round((p * (1 - DEAL_OFF)) / 500) * 500;
/** Price today (the daily deal is cheaper). */
export function priceToday(it: ShopItem, day = today()) {
  return dailyDeal(day)?.id === it.id ? dealPrice(it.price) : it.price;
}

// ── mystery chest: a random cosmetic you don't own, rarer = less likely ──
const CHEST_WEIGHT: Record<Rarity, number> = { common: 50, rare: 32, epic: 14, legendary: 4 };
function chestPick(owned: string[]): ShopItem | null {
  const pool = SHOP.filter((i) => i.price > 0 && !owned.includes(i.id) && i.price <= 300000);
  if (!pool.length) return null;
  const total = pool.reduce((t, i) => t + CHEST_WEIGHT[rarityOf(i.price)], 0);
  let r = Math.random() * total;
  for (const i of pool) {
    r -= CHEST_WEIGHT[rarityOf(i.price)];
    if (r <= 0) return i;
  }
  return pool[pool.length - 1];
}

export const shop = {
  get: () => {
    load();
    return state;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  owns: (id: string) => {
    load();
    return state.owned.includes(id);
  },
  /** Buys an item with chips (today's price); false when not enough. */
  buy(id: string) {
    load();
    const it = SHOP.find((x) => x.id === id);
    if (!it || state.owned.includes(id)) return true;
    const price = priceToday(it);
    if (wallet.getLocked() || wallet.getBalance() < price) return false;
    wallet.add(-price);
    set({ owned: [...state.owned, id] });
    const slot = EQUIP_SLOT[it.cat];
    if (slot) set({ [slot]: id } as Partial<State>);
    return true;
  },
  equip(id: string) {
    load();
    const it = SHOP.find((x) => x.id === id);
    const slot = it && EQUIP_SLOT[it.cat];
    if (!it || !slot || !state.owned.includes(id)) return;
    set({ [slot]: id } as Partial<State>);
  },
  /** Kept for callers of the first shop. */
  equipCard(id: string) {
    shop.equip(id);
  },
  buyBoost(id: string) {
    load();
    const b = BOOSTS.find((x) => x.id === id);
    if (!b || wallet.getLocked() || wallet.getBalance() < b.price) return false;
    wallet.add(-b.price);
    const now = Date.now();
    set({ xpUntil: Math.max(now, state.xpUntil) + b.minutes * 60_000 });
    return true;
  },
  /** XP multiplier right now (read when XP is earned). */
  xpMultiplier: () => {
    load();
    return state.xpUntil > Date.now() ? 2 : 1;
  },
  /** Opens a mystery chest: the item, "refund" when everything is owned, or null when not enough chips. */
  openChest(): ShopItem | "refund" | null {
    load();
    if (wallet.getLocked() || wallet.getBalance() < CHEST_PRICE) return null;
    const it = chestPick(state.owned);
    if (!it) return "refund";
    wallet.add(-CHEST_PRICE);
    set({ owned: [...state.owned, it.id], chests: state.chests + 1 });
    return it;
  },
  /** Asks the page to open the shop on an item (from a locked picker). */
  open(id?: string) {
    window.dispatchEvent(new CustomEvent("royal-ace:settings", { detail: { tab: "shop", item: id } }));
  },
};
export const useShop = () => useSyncExternalStore(shop.subscribe, shop.get, () => EMPTY);
export const priceLabel = (n: number) =>
  n >= 1_000_000 ? `${Math.round(n / 100_000) / 10}M`.replace(".0M", "M") : n >= 1000 ? `${Math.round(n / 100) / 10}K`.replace(".0K", "K") : String(n);
export const itemOf = (id: string) => SHOP.find((i) => i.id === id);
