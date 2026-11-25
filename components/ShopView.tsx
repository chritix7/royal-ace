"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { CardBackArt } from "./CardArt";
import PlayingCard from "./PlayingCard";
import { useProfile } from "../lib/profile";
import { useProgression } from "../lib/progression";
import { vipTierForLevel } from "../lib/daily";

/** A card back drawn with an item's colours. */
function BackCard({ it, className = "", style }: { it: ShopItem; className?: string; style?: CSSProperties }) {
  const [a, b, c] = it.id === "back:table" ? (["#142d27", "#1b3d33", "#d7b45b"] as const) : it.swatch;
  return (
    <span className={`shop-back ${className}`} style={{ background: a, ...style }}>
      <CardBackArt back={[a, b]} ink={c} />
    </span>
  );
}
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
/** A die face with an item's colours. */
function DieFace({ it, n, className = "", style }: { it: ShopItem; n: number; className?: string; style?: CSSProperties }) {
  const [hi, lo, pip] = it.swatch;
  const classic = it.id === "dice:ivory";
  return (
    <span className={`shop-die ${className}`} style={{ background: `radial-gradient(circle at 30% 25%, ${hi}, ${classic ? "#efe9dc" : hi} 55%, ${lo})`, ...style }}>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={PIPS[n].includes(i) ? { background: classic && n === 1 ? "#b3121f" : pip } : { visibility: "hidden" }} />
      ))}
    </span>
  );
}

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
    case "back":
      return (
        <div className={`${cls} shop-prev--back`} style={{ background: "radial-gradient(90% 90% at 50% 30%, #1b1b20, #070708)" }}>
          <BackCard it={it} style={{ transform: "rotate(-9deg) translateX(-28%)" }} />
          <BackCard it={it} style={{ transform: "rotate(7deg) translateX(28%)" }} />
        </div>
      );
    case "dice":
      return (
        <div className={`${cls} shop-prev--dice`} style={{ background: "radial-gradient(100% 90% at 50% 30%, #0f3a26, #06140d)" }}>
          <DieFace it={it} n={5} style={{ transform: "rotate(-12deg)" }} />
          <DieFace it={it} n={6} style={{ transform: "rotate(9deg)" }} />
        </div>
      );
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

function ItemCard({ it, focus, onMsg, msg, onTry }: { it: ShopItem; focus: boolean; onMsg: (id: string, t: string) => void; msg: string | null; onTry: () => void }) {
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
        <button type="button" onClick={onTry} className="block w-full" aria-label={`Try ${it.name}`}>
          <ItemPreview it={it} />
        </button>
        <button type="button" onClick={onTry} className="shop-try">
          Try
        </button>
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
          equipped ? (
            <span className="lux-tag is-equipped"><span aria-hidden="true">✓</span><span>Equipped</span></span>
          ) : (
            <button type="button" className="pr-btn is-ghost w-full" onClick={() => shop.equip(it.id)}>
              Equip
            </button>
          )
        ) : (
          <span className="lux-tag is-owned">Owned · choose it in the game</span>
        )
      ) : (
        <button
          type="button"
          className="pr-btn w-full"
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

/** A bigger, in-context look at an item before buying it. */
function TryScene({ it }: { it: ShopItem }) {
  const profile = useProfile();
  const level = useProgression().level;
  const [a, b, c] = it.swatch;
  const ace = { rank: "A", suit: "♠", value: 11 };
  const king = { rank: "K", suit: "♥", value: 10 };
  switch (it.cat) {
    case "back":
      return (
        <div className="try-scene try-felt">
          <div className="try-cards">
            <span className="try-card"><PlayingCard card={ace} fit animated={false} /></span>
            <BackCard it={it} className="try-card" style={{ transform: "rotate(4deg)" }} />
            <BackCard it={it} className="try-card" style={{ transform: "rotate(10deg) translateY(4%)" }} />
          </div>
          <p className="try-cap">At the blackjack and Hold'em tables</p>
        </div>
      );
    case "dice":
      return (
        <div className="try-scene try-felt">
          <div className="flex items-center justify-center gap-6">
            <DieFace it={it} n={4} className="is-big" style={{ transform: "rotate(-14deg)" }} />
            <DieFace it={it} n={3} className="is-big" style={{ transform: "rotate(11deg) translateY(10%)" }} />
          </div>
          <p className="try-cap">On the craps table · Point is 7</p>
        </div>
      );
    case "blackjack":
      return (
        <div className="try-scene" style={{ background: `radial-gradient(ellipse at 50% 40%, ${b}, ${a} 75%)` }}>
          <span className="try-arc" style={{ borderColor: `${c}55` }} />
          <p className="try-felt-text" style={{ color: `${c}aa` }}>BLACKJACK PAYS 3 TO 2</p>
          <div className="try-cards">
            <span className="try-card"><PlayingCard card={ace} fit animated={false} /></span>
            <span className="try-card" style={{ transform: "rotate(6deg)" }}><PlayingCard card={king} fit animated={false} /></span>
          </div>
        </div>
      );
    case "roulette":
      return (
        <div className="try-scene" style={{ background: `radial-gradient(120% 90% at 50% 20%, ${b}, ${a})` }}>
          <span className="shop-wheel is-big" style={{ borderColor: c, background: `radial-gradient(circle, ${c} 0 12%, ${a} 13% 30%, transparent 31%), repeating-conic-gradient(#b3121f 0 10deg, #0b0b0d 10deg 20deg)` }} />
          <p className="try-cap" style={{ color: `${c}cc` }}>Your roulette room</p>
        </div>
      );
    case "card": {
      const fin = it.id === "card:gold" ? "" : `is-${it.id.slice(5)}`;
      return (
        <div className="try-scene" style={{ background: "radial-gradient(90% 90% at 50% 20%, #1b1b20, #070708)" }}>
          <div className={`vip-card try-vip ${fin}`}>
            <div className="flex items-start justify-between">
              <span className="vip-card__brand">ROYAL ACE</span>
              <span className="vip-card__tier">{`VIP · ${vipTierForLevel(level).label}`}</span>
            </div>
            <span className="vip-card__chip" aria-hidden="true" />
            <p className="try-vip__name">{profile.name || "Player"}</p>
            <p className="try-vip__lv">{`Level ${level}`}</p>
          </div>
        </div>
      );
    }
    case "avatar":
    case "title":
      return (
        <div className="try-scene" style={{ background: `radial-gradient(90% 90% at 50% 20%, ${b}55, #070708)` }}>
          <div className="flex items-center gap-3">
            <AvatarBadge id={it.cat === "avatar" ? it.id : undefined} size="xl" />
            <div>
              <p className="pl-title !tracking-[0.18em]">{it.cat === "title" ? it.glyph : "Good evening"}</p>
              <p className="lb-hero__name">{profile.name || "Player"}</p>
            </div>
          </div>
        </div>
      );
    default:
      return <ItemPreview it={it} big />;
  }
}

function TryOn({ it, onClose }: { it: ShopItem; onClose: () => void }) {
  const st = useShop();
  const locked = useLocked();
  const [msg, setMsg] = useState("");
  const has = st.owned.includes(it.id);
  const slot = EQUIP_SLOT[it.cat];
  const equipped = !!slot && st[slot] === it.id;
  const price = priceToday(it);
  const rarity = rarityOf(it.price);
  useEffect(() => {
    // Escape closes this window only (not the shop behind it).
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Try ${it.name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/80" />
      <div className={`try-box is-${rarity}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="st-sub">{SHOP_CATS.find((x) => x.id === it.cat)?.label}</p>
            <p className="shop-feature__title !text-[20px]">{it.name}</p>
          </div>
          {it.price > 0 && <span className={`shop-rarity is-${rarity} !static`}>{RARITY_LABEL[rarity]}</span>}
        </div>
        <div className="mt-3">
          <TryScene it={it} />
        </div>
        <p className="mt-2 text-[12px] text-white/55">{it.note}</p>
        <div className="mt-3 flex gap-2">
          {has ? (
            slot && !equipped ? (
              <button type="button" className="pr-btn flex-1" onClick={() => (shop.equip(it.id), onClose())}>
                Equip
              </button>
            ) : (
              <span className="lux-tag is-equipped flex-1">{equipped ? "✓ Equipped" : "Owned · choose it in the game"}</span>
            )
          ) : (
            <button
              type="button"
              className="pr-btn flex-1"
              disabled={locked}
              onClick={() => {
                if (shop.buy(it.id)) onClose();
                else setMsg("Not enough chips");
              }}
            >
              {`Buy · ◈ ${priceLabel(price)}`}
            </button>
          )}
          <button type="button" className="pr-btn is-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {msg && <p className="mt-2 text-center text-[11px] text-[#f5d778]">{msg}</p>}
      </div>
    </div>,
    document.body,
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
            <p className="shop-feature__title mt-3 !text-[22px]">{it.name}</p>
            <p className="text-[12px] text-white/55">{SHOP_CATS.find((c) => c.id === it.cat)?.label}</p>
            <div className="mt-3 flex justify-center gap-2">
              {slot && (
                <button
                  type="button"
                  className="pr-btn"
                  onClick={() => {
                    shop.equip(it.id);
                    onClose();
                  }}
                >
                  Equip
                </button>
              )}
              <button type="button" className="pr-btn is-ghost" onClick={onClose}>
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
  const [trying, setTrying] = useState<ShopItem | null>(null);
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
                <p className="shop-feature__title mt-1 truncate">{deal.name}</p>
                <p className="shop-feature__fine">{SHOP_CATS.find((c) => c.id === deal.cat)?.label}</p>
                <p className="shop-item__price mt-1 !text-[15px]">
                  <s className="mr-1.5 text-white/35">◈ {priceLabel(deal.price)}</s>◈ {priceLabel(dealPrice(deal.price))}
                </p>
                {st.owned.includes(deal.id) ? (
                  <span className="lux-tag is-equipped mt-1.5">Owned ✓</span>
                ) : (
                  <button type="button" className="pr-btn mt-1.5 w-full" disabled={locked} onClick={() => say(deal.id, shop.buy(deal.id) ? "Unlocked ✓" : "Not enough chips")}>
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
              <p className="shop-feature__text">A random item you don&apos;t own yet — maybe a legendary.</p>
              <p className="shop-feature__fine mt-1">Common 50% · Rare 32% · Epic 14% · Legendary 4%</p>
              <button
                type="button"
                className="pr-btn mt-2 w-full"
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
                <button key={b.id} type="button" className="pr-btn is-ghost is-row w-full" disabled={locked} onClick={() => say(b.id, shop.buyBoost(b.id) ? "Boost on ✓" : "Not enough chips")}>
                  <span>{b.minutes >= 60 * 24 ? "24 h" : "1 h"}</span>
                  <span className="text-[#fff3c4]">◈ {priceLabel(b.price)}</span>
                </button>
              ))}
              {(msgs["boost:xp1"] || msgs["boost:xp24"]) && <p className="text-[10px] text-[#f5d778]">{msgs["boost:xp1"] || msgs["boost:xp24"]}</p>}
            </div>
          </div>
          <p className="shop-feature__fine mt-2">Levels come twice as fast in every game. Time adds up.</p>
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

      <div className="shop-catbar" role="tablist" aria-label="Categories">
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
              <ItemCard key={it.id} it={it} focus={focus === it.id} msg={msgs[it.id] ?? null} onMsg={say} onTry={() => setTrying(it)} />
            ))}
          </div>
        </section>
      ))}
      {locked && <p className="st-sub text-center">Finish the round in progress to buy.</p>}
      {chest && <ChestReveal it={chest} onClose={() => setChest(null)} />}
      {trying && <TryOn it={trying} onClose={() => setTrying(null)} />}
    </div>
  );
}
