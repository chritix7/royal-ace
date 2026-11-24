"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { today } from "../lib/clock";
import { money } from "../lib/game";
import {
  BOOSTS,
  CHEST_PRICE,
  EQUIP_SLOT,
  SHOP,
  SHOP_CATS,
  dailyDeal,
  dealPrice,
  priceLabel,
  priceToday,
  rarityOf,
  shop,
  useShop,
  type Rarity,
  type ShopCat,
  type ShopItem,
} from "../lib/shop";
import { useBalance, useLocked } from "../lib/wallet";
import { AvatarBadge } from "./Avatar";
import { ChipFace } from "./ChipButton";
import { FxPreview } from "./CoinRain";

/**
 * The shop: a daily deal and a mystery chest up top, the collection
 * meter, then every category with live previews, rarity and prices.
 */
const RARITY_LABEL: Record<Rarity, string> = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };

export function ItemPreview({ it, big = false }: { it: ShopItem; big?: boolean }) {
  const [a, b, c] = it.swatch;
  const cls = `shop-prev ${big ? "is-big" : ""}`;
  switch (it.cat) {
    case "chips":
      return (
        <div className={`${cls} shop-prev--chips`} style={{ background: `radial-gradient(90% 90% at 50% 30%, #1b1b20, #070708)` }}>
          {[100, 500, 1000].map((v, i) => (
            <span key={v} className="shop-chip" style={{ transform: `translateX(${(i - 1) * 80}%) rotate(${(i - 1) * 8}deg)`, zIndex: i === 1 ? 2 : 1 }}>
              <ChipFace value={v} set={it.id} />
            </span>
          ))}
        </div>
      );
    case "effect":
      return (
        <div className={cls} style={{ background: `radial-gradient(100% 90% at 50% 0%, ${b}55, ${a})` }}>
          <FxPreview kind={it.glyph ?? "coin"} />
        </div>
      );
    case "avatar":
      return (
        <div className={`${cls} flex items-center justify-center`} style={{ background: `radial-gradient(70% 80% at 50% 40%, ${b}66, #070708)` }}>
          <AvatarBadge id={it.id} size={big ? "xl" : "lg"} />
        </div>
      );
    case "title":
      return (
        <div className={`${cls} flex items-center justify-center px-2`} style={{ background: `radial-gradient(90% 90% at 50% 20%, ${b}55, #070708)` }}>
          <span className="shop-plaque" style={{ borderColor: `${c}88` }}>
            <span className="pl-title">{it.glyph}</span>
          </span>
        </div>
      );
    case "card": {
      const fin = it.id === "card:gold" ? "" : `is-${it.id.slice(5)}`;
      return (
        <div className={`${cls} shop-prev--card`}>
          <div className={`vip-card shop-vip ${fin}`}>
            <div className="flex items-start justify-between">
              <span className="vip-card__brand">ROYAL ACE</span>
              <span className="vip-card__tier">VIP</span>
            </div>
            <span className="vip-card__chip" aria-hidden="true" />
          </div>
        </div>
      );
    }
    case "roulette":
      return (
        <div className={cls} style={{ background: `radial-gradient(120% 90% at 50% 20%, ${b}, ${a})` }}>
          <span className="shop-wheel" style={{ borderColor: c, background: `radial-gradient(circle, ${c} 0 12%, ${a} 13% 30%, transparent 31%), repeating-conic-gradient(#b3121f 0 10deg, #0b0b0d 10deg 20deg)` }} />
        </div>
      );
    default:
      return (
        <div className={cls} style={{ background: `radial-gradient(120% 100% at 50% 0%, ${b}, ${a})` }}>
          <span className="shop-arc" style={{ borderColor: c }} />
          <span className="shop-card shop-card--face" style={{ transform: "rotate(-8deg) translateX(-30%)" }}>
            A<span className="text-[#111]">♠</span>
          </span>
          <span className="shop-card shop-card--back" style={{ background: `repeating-linear-gradient(45deg, ${b} 0 3px, ${a} 3px 6px)`, borderColor: c, transform: "rotate(7deg) translateX(30%)" }} />
        </div>
      );
  }
}

function useCountdown() {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const p = (n: number) => String(n).padStart(2, "0");
      setLeft(`${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`);
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
  return left;
}
function useBoostLeft(until: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, until - Date.now()));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [until]);
  if (!left) return null;
  const m = Math.ceil(left / 60000);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`;
}

function ItemCard({ it, focus, onMsg, msg }: { it: ShopItem; focus: boolean; onMsg: (id: string, t: string) => void; msg: string | null }) {
  const st = useShop();
  const locked = useLocked();
  const has = st.owned.includes(it.id);
  const slot = EQUIP_SLOT[it.cat];
  const equipped = !!slot && st[slot] === it.id;
  const price = priceToday(it);
  const onDeal = price !== it.price;
  const rarity = rarityOf(it.price);
  return (
    <div id={`shop-${it.id}`} className={`shop-item is-${rarity} ${focus ? "is-focus" : ""} ${has ? "is-owned" : ""}`}>
      <div className="relative">
        <ItemPreview it={it} />
        {it.price > 0 && <span className={`shop-rarity is-${rarity}`}>{RARITY_LABEL[rarity]}</span>}
        {onDeal && !has && <span className="shop-dealtag">−30%</span>}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="shop-item__name">{it.name}</p>
        {!has && (
          <span className="shop-item__price">
            {onDeal && <s className="mr-1 text-white/35">{priceLabel(it.price)}</s>}◈ {priceLabel(price)}
          </span>
        )}
      </div>
      <p className="shop-item__note">{it.note}</p>
      {has ? (
        slot ? (
          <button type="button" className={`rl-key w-full ${equipped ? "is-on" : ""}`} disabled={equipped} onClick={() => shop.equip(it.id)}>
            {equipped ? "Equipped" : "Equip"}
          </button>
        ) : (
          <span className="shop-item__owned">Owned · choose it in the game</span>
        )
      ) : (
        <button
          type="button"
          className="rl-key is-on w-full"
          disabled={locked}
          onClick={() => {
            const ok = shop.buy(it.id);
            onMsg(it.id, ok ? (slot ? "Unlocked and equipped ✓" : "Unlocked ✓") : "Not enough chips");
          }}
        >
          Buy
        </button>
      )}
      {msg && <p className="text-center text-[10px] text-[#f5d778]">{msg}</p>}
    </div>
  );
}

function ChestReveal({ it, onClose }: { it: ShopItem; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, []);
  const rarity = rarityOf(it.price);
  const slot = EQUIP_SLOT[it.cat];
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Mystery chest">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/80" />
      <div className="relative w-full max-w-xs text-center">
        {!open ? (
          <div className="chest chest--shake mx-auto" aria-hidden="true">
            <span className="chest__lid" />
            <span className="chest__body" />
            <span className="chest__lock" />
          </div>
        ) : (
          <div className={`chest-win is-${rarity}`}>
            <p className={`shop-rarity is-${rarity} !static !inline-block`}>{RARITY_LABEL[rarity]}</p>
            <div className="mt-2">
              <ItemPreview it={it} big />
            </div>
            <p className="mt-3 font-display text-xl font-bold text-[#f6e7bd]">{it.name}</p>
            <p className="text-[12px] text-white/55">{SHOP_CATS.find((c) => c.id === it.cat)?.label}</p>
            <div className="mt-3 flex justify-center gap-2">
              {slot && (
                <button
                  type="button"
                  className="rl-key is-on"
                  onClick={() => {
                    shop.equip(it.id);
                    onClose();
                  }}
                >
                  Equip
                </button>
              )}
              <button type="button" className="rl-key" onClick={onClose}>
                {slot ? "Later" : "Great"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function ShopView({ focus }: { focus?: string }) {
  const st = useShop();
  const balance = useBalance();
  const locked = useLocked();
  const [cat, setCat] = useState<"all" | ShopCat>("all");
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [chest, setChest] = useState<ShopItem | null>(null);
  const [chestMsg, setChestMsg] = useState("");
  const [day, setDay] = useState("");
  useEffect(() => setDay(today()), []);
  const countdown = useCountdown();
  const boostLeft = useBoostLeft(st.xpUntil);
  const deal = useMemo(() => (day ? dailyDeal(day) : null), [day]);
  useEffect(() => {
    if (!focus) return;
    const t = window.setTimeout(() => document.getElementById(`shop-${focus}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 150);
    return () => window.clearTimeout(t);
  }, [focus]);
  const say = (id: string, t: string) => setMsgs((m) => ({ ...m, [id]: t }));
  const collectible = SHOP.length;
  const owned = st.owned.filter((id) => SHOP.some((i) => i.id === id)).length;

  return (
    <div className="space-y-5">
      {/* Featured: daily deal + mystery chest */}
      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr]">
        {deal && (
          <div className={`shop-feature is-deal is-${rarityOf(deal.price)}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="shop-feature__kicker">Deal of the day</p>
              <span className="shop-feature__timer" translate="no">
                ⏱ {countdown}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
              <ItemPreview it={deal} />
              <div className="min-w-0">
                <p className={`shop-rarity is-${rarityOf(deal.price)} !static !inline-block`}>{RARITY_LABEL[rarityOf(deal.price)]}</p>
                <p className="mt-1 truncate font-display text-lg font-bold text-[#f6e7bd]">{deal.name}</p>
                <p className="text-[11px] text-white/50">{SHOP_CATS.find((c) => c.id === deal.cat)?.label}</p>
                <p className="mt-1 text-[13px] font-black text-[#f5d778]">
                  <s className="mr-1.5 text-white/35">◈ {priceLabel(deal.price)}</s>◈ {priceLabel(dealPrice(deal.price))}
                </p>
                {st.owned.includes(deal.id) ? (
                  <span className="shop-item__owned !text-left">Owned ✓</span>
                ) : (
                  <button type="button" className="rl-key is-on mt-1.5 w-full" disabled={locked} onClick={() => say(deal.id, shop.buy(deal.id) ? "Unlocked ✓" : "Not enough chips")}>
                    Buy −30%
                  </button>
                )}
                {msgs[deal.id] && <p className="mt-1 text-[10px] text-[#f5d778]">{msgs[deal.id]}</p>}
              </div>
            </div>
          </div>
        )}
        <div className="shop-feature is-chest">
          <p className="shop-feature__kicker">Mystery chest</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="chest shrink-0" aria-hidden="true">
              <span className="chest__lid" />
              <span className="chest__body" />
              <span className="chest__lock" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] leading-snug text-white/60">A random item you don&apos;t own yet — maybe a legendary.</p>
              <p className="mt-1 text-[10px] text-white/40">Common 50% · Rare 32% · Epic 14% · Legendary 4%</p>
              <button
                type="button"
                className="rl-key is-on mt-2 w-full"
                disabled={locked}
                onClick={() => {
                  const r = shop.openChest();
                  if (r === null) setChestMsg("Not enough chips");
                  else if (r === "refund") setChestMsg("You already own everything!");
                  else {
                    setChestMsg("");
                    setChest(r);
                  }
                }}
              >
                {`Open · ◈ ${priceLabel(CHEST_PRICE)}`}
              </button>
              {chestMsg && <p className="mt-1 text-[10px] text-[#f5d778]">{chestMsg}</p>}
            </div>
          </div>
        </div>
        <div className="shop-feature is-boost">
          <div className="flex items-center justify-between gap-2">
            <p className="shop-feature__kicker">XP boost</p>
            {boostLeft && <span className="shop-feature__timer is-live">×2 · {boostLeft}</span>}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="xp-medal shrink-0" aria-hidden="true">
              ×2
              <small>XP</small>
            </span>
            <div className="grid min-w-0 flex-1 gap-1.5">
              {BOOSTS.map((b) => (
                <button key={b.id} type="button" className="rl-key w-full !justify-between !px-3" disabled={locked} onClick={() => say(b.id, shop.buyBoost(b.id) ? "Boost on ✓" : "Not enough chips")}>
                  <span>{b.minutes >= 60 * 24 ? "24 h" : "1 h"}</span>
                  <span className="text-[#f5d778]">◈ {priceLabel(b.price)}</span>
                </button>
              ))}
              {(msgs["boost:xp1"] || msgs["boost:xp24"]) && <p className="text-[10px] text-[#f5d778]">{msgs["boost:xp1"] || msgs["boost:xp24"]}</p>}
            </div>
          </div>
          <p className="mt-2 text-[10px] text-white/40">Levels come twice as fast in every game. Time adds up.</p>
        </div>
      </div>

      {/* Collection meter */}
      <div className="shop-collect">
        <div className="flex items-baseline justify-between gap-3">
          <p className="st-head !mb-0">Collection</p>
          <p className="text-[11px] text-white/50">
            <b className="text-[#f5d778]">{`${owned} of ${collectible} owned`}</b>
          </p>
        </div>
        <div className="shop-collect__bar">
          <span style={{ width: `${(owned / collectible) * 100}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-white/40">{`Credit: ◈ ${money(balance)} · everything is paid in virtual chips`}</p>
      </div>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Categories">
        {([["all", "All"], ...SHOP_CATS.filter((c) => c.id !== "boost").map((c) => [c.id, c.label])] as ["all" | ShopCat, string][]).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={cat === id} onClick={() => setCat(id)} className={`st-chip ${cat === id ? "is-on" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      {SHOP_CATS.filter((c) => c.id !== "boost" && (cat === "all" || c.id === cat)).map((c) => (
        <section key={c.id}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="st-head !mb-0">{c.label}</p>
            <p className="st-sub">{c.where}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {SHOP.filter((i) => i.cat === c.id).map((it) => (
              <ItemCard key={it.id} it={it} focus={focus === it.id} msg={msgs[it.id] ?? null} onMsg={say} />
            ))}
          </div>
        </section>
      ))}
      {locked && <p className="st-sub text-center">Finish the round in progress to buy.</p>}
      {chest && <ChestReveal it={chest} onClose={() => setChest(null)} />}
    </div>
  );
}
