import { useSyncExternalStore } from "react";
import { wallet } from "./wallet";

/**
 * The cosmetics shop: table felts and card backs, roulette rooms and VIP
 * card finishes, bought once with chips. Kept in the browser.
 * Themes a player already used before the shop existed stay theirs.
 */
export type ShopCat = "blackjack" | "roulette" | "card";
export type ShopItem = { id: string; cat: ShopCat; name: string; note: string; price: number; swatch: [string, string, string] };

export const SHOP: ShopItem[] = [
  { id: "bj:green", cat: "blackjack", name: "Classic green", note: "Green baize, red backs", price: 0, swatch: ["#0b2a1c", "#11603b", "#d7b45b"] },
  { id: "bj:blue", cat: "blackjack", name: "Midnight blue", note: "Blue felt, navy backs", price: 25000, swatch: ["#061428", "#13407a", "#d7b45b"] },
  { id: "bj:burgundy", cat: "blackjack", name: "Burgundy", note: "Wine felt, black backs", price: 25000, swatch: ["#1a0509", "#6a1323", "#e3c27a"] },
  { id: "bj:vegas", cat: "blackjack", name: "Vegas lounge", note: "Five Vegas variants", price: 60000, swatch: ["#0c0d0f", "#3a1f4a", "#f0d38b"] },
  { id: "rl:carbon", cat: "roulette", name: "Carbon 911", note: "Matte black, carbon, gold", price: 0, swatch: ["#0c0d0f", "#24262b", "#d7b45b"] },
  { id: "rl:monaco", cat: "roulette", name: "Monaco", note: "Green baize, mahogany, brass", price: 40000, swatch: ["#1a0f0a", "#0f5c3a", "#d9b45e"] },
  { id: "rl:velours", cat: "roulette", name: "Rouge velours", note: "Bordeaux velvet, black lacquer", price: 40000, swatch: ["#140608", "#5a0f1c", "#e3c27a"] },
  { id: "rl:royal", cat: "roulette", name: "Royal Blue", note: "Royal blue, white, silver", price: 80000, swatch: ["#06102a", "#0f3a8c", "#e8eef8"] },
  { id: "card:gold", cat: "card", name: "Carbon gold", note: "The house finish", price: 0, swatch: ["#08080a", "#1d1d21", "#e5c779"] },
  { id: "card:rose", cat: "card", name: "Rose gold", note: "Warm copper sheen", price: 150000, swatch: ["#140b0a", "#3a2320", "#f2b8a2"] },
  { id: "card:platinum", cat: "card", name: "Platinum", note: "Brushed steel, silver", price: 100000, swatch: ["#0d0f12", "#2c3036", "#e6ebf2"] },
  { id: "card:diamond", cat: "card", name: "Black diamond", note: "Facets and ice", price: 250000, swatch: ["#020204", "#141a26", "#9be7ff"] },
];
export const SHOP_CATS: { id: ShopCat; label: string; where: string }[] = [
  { id: "blackjack", label: "Blackjack felts", where: "Choose it in the blackjack table settings (Felt)." },
  { id: "roulette", label: "Roulette rooms", where: "Choose it in the roulette Style panel." },
  { id: "card", label: "VIP card finish", where: "Equip it here; it shows on your VIP card." },
];

type State = { owned: string[]; card: string };
const KEY = "royalace:shop";
const FREE = SHOP.filter((i) => i.price === 0).map((i) => i.id);
const EMPTY: State = { owned: FREE, card: "card:gold" };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<State>;
      state = { owned: [...new Set([...FREE, ...(Array.isArray(s.owned) ? s.owned : [])])], card: typeof s.card === "string" ? s.card : "card:gold" };
    } else {
      // First run of the shop: keep whatever felt / room was already in use.
      const owned = new Set(FREE);
      try {
        const bj = JSON.parse(localStorage.getItem("royalace:blackjack") ?? "null");
        if (bj?.settings?.theme) owned.add(`bj:${bj.settings.theme}`);
        const rl = JSON.parse(localStorage.getItem("royalace:roulette") ?? "null");
        if (rl?.theme) owned.add(`rl:${rl.theme}`);
      } catch {}
      state = { owned: [...owned], card: "card:gold" };
      persist();
    }
  } catch {}
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
  /** Buys an item with chips; false when not enough. */
  buy(id: string) {
    load();
    const it = SHOP.find((x) => x.id === id);
    if (!it || state.owned.includes(id)) return true;
    if (wallet.getLocked() || wallet.getBalance() < it.price) return false;
    wallet.add(-it.price);
    state = { ...state, owned: [...state.owned, id] };
    persist();
    emit();
    return true;
  },
  equipCard(id: string) {
    load();
    if (!state.owned.includes(id)) return;
    state = { ...state, card: id };
    persist();
    emit();
  },
  /** Asks the page to open the shop on an item (from a locked picker). */
  open(id?: string) {
    window.dispatchEvent(new CustomEvent("royal-ace:settings", { detail: { tab: "shop", item: id } }));
  },
};
export const useShop = () => useSyncExternalStore(shop.subscribe, shop.get, () => EMPTY);
export const priceLabel = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}K`.replace(".0K", "K") : String(n));
