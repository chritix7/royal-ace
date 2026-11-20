"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChipFace } from "./ChipButton";
import { Counter } from "./ui";
import { money } from "../lib/game";
import { marketsOf, priced, type Priced } from "../lib/sports/odds";
import type { Match, Sport } from "../lib/sports/types";
import { MAX_PICKS, SPORT_CHIPS, SPORTS_MAX, SPORTS_MIN, useSportsbook, type SportsGame, type Ticket } from "../lib/useSportsbook";
import { isNarrowScreen, requestFullscreenSettled } from "../lib/fullscreen";
import { useSession } from "../lib/sessionStore";

function useDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}
const compact = (v: number) => (v < 10000 ? money(v) : v < 1e6 ? `${Math.round(v / 100) / 10}K`.replace(".0K", "K") : `${Math.round(v / 1e5) / 10}M`.replace(".0M", "M"));
const fmtOdds = (o: number) => (o >= 100 ? o.toFixed(0) : o.toFixed(2));

const SPORTS: { id: Sport; label: string; icon: string }[] = [
  { id: "football", label: "Football", icon: "⚽" },
  { id: "basketball", label: "Basketball", icon: "🏀" },
  { id: "hockey", label: "Hockey", icon: "🏒" },
];
type View = "live" | "today" | "upcoming" | "results";
const VIEWS: { id: View; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "results", label: "Results" },
];

const isLive = (m: Match) => m.status === "live" || m.status === "break";
function sameDay(a: number, b: number) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
function when(m: Match, now: number) {
  if (m.status === "void") return "Postponed";
  if (m.status === "done") return "FT";
  if (isLive(m)) return m.clock?.label ?? "Live";
  const d = new Date(m.kickoff);
  const hm = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay(m.kickoff, now)) return hm;
  if (sameDay(m.kickoff, now + 86400000)) return `Tomorrow ${hm}`;
  return `${d.toLocaleDateString([], { weekday: "short", day: "numeric" })} ${hm}`;
}
function errorText(e: string | undefined) {
  if (!e) return "";
  if (e === "missing-key") return "Real matches need the API key in Vercel.";
  if (e === "busy") return "Data provider busy — retrying shortly.";
  if (e.startsWith("provider")) return `Data provider: ${e.replace(/^provider:?\s*/, "")}`;
  return "Data unavailable — retrying shortly.";
}

/* ───────────── Odds button ───────────── */

function OddButton({ p, on, onClick, wide = false }: { p: Priced; on: boolean; onClick: () => void; wide?: boolean }) {
  const prev = useRef(p.odds);
  const born = useRef(0);
  const [move, setMove] = useState<"" | "is-up" | "is-down">("");
  useEffect(() => {
    if (!born.current) born.current = Date.now();
    // No flash while the tables load (first seconds).
    if (prev.current !== null && p.odds !== null && p.odds !== prev.current && Date.now() - born.current > 4000) {
      setMove(p.odds > prev.current ? "is-up" : "is-down");
      const t = window.setTimeout(() => setMove(""), 2500);
      prev.current = p.odds;
      return () => window.clearTimeout(t);
    }
    prev.current = p.odds;
  }, [p.odds]);
  return (
    <button type="button" disabled={p.odds === null && !on} onClick={onClick} aria-pressed={on} title={p.label} className={`sb-odd ${on ? "is-on" : ""} ${move} ${wide ? "is-wide" : ""}`}>
      <span className="sb-odd__label">{p.label}</span>
      <span className="sb-odd__value">{p.odds === null ? "🔒" : fmtOdds(p.odds)}</span>
    </button>
  );
}

/* ───────────── One match ───────────── */

function MatchRow({ g, m, open, onOpen, lite }: { g: SportsGame; m: Match; open: boolean; onOpen: () => void; lite: boolean }) {
  const model = useMemo(() => g.modelFor(m), [g, m]);
  const markets = useMemo(() => marketsOf(m, model), [m, model]);
  const main = markets[0];
  const mainPriced = main ? priced(m, model, main, g.now || Date.now()) : [];
  const live = isLive(m);
  const add = (p: Priced, title: string) => g.toggle(m, p.market, p.pick, p.label, title);
  const short = (p: Priced) => ({ ...p, label: p.pick === "X" ? "Draw" : p.pick === "1" ? "1" : p.pick === "2" ? "2" : p.label });
  return (
    <div className={`sb-match ${open ? "is-open" : ""} ${live ? "is-live" : ""}`}>
      <div className="sb-match__row">
        <button type="button" onClick={onOpen} className="sb-match__info" aria-expanded={open}>
          <span className={`sb-when ${live ? "is-live" : ""}`}>
            {live && <i className="sb-dot" />}
            {when(m, g.now || Date.now())}
          </span>
          <span className="sb-teams">
            <span className="sb-team">
              <span className="truncate">{m.home.name}</span>
              {m.score && <b>{m.score.h}</b>}
            </span>
            <span className="sb-team">
              <span className="truncate">{m.away.name}</span>
              {m.score && <b>{m.score.a}</b>}
            </span>
          </span>
        </button>
        {m.status !== "done" && m.status !== "void" ? (
          <div className={`sb-main ${mainPriced.length === 2 ? "is-two" : ""}`}>
            {mainPriced.map((p) => (
              <OddButton key={p.pick} p={lite ? short(p) : short(p)} on={g.inSlip.has(`${m.id}|${p.market}|${p.pick}`)} onClick={() => add(p, main.title)} />
            ))}
          </div>
        ) : (
          <span className="sb-final">{m.status === "done" ? "Full time" : "Postponed"}</span>
        )}
        {m.status !== "done" && m.status !== "void" && (
          <button type="button" onClick={onOpen} className="sb-more" aria-label="All markets">
            {open ? "−" : `+${markets.reduce((n, k) => n + k.picks.length, 0) - mainPriced.length}`}
          </button>
        )}
      </div>
      {open && m.status !== "done" && m.status !== "void" && (
        <div className="sb-markets">
          {markets.slice(1).map((k) => {
            const ps = priced(m, model, k, g.now || Date.now());
            return (
              <div key={k.key} className="sb-market">
                <p className="sb-market__title">{k.title}</p>
                <div className={`sb-market__picks ${ps.length > 3 ? "is-grid" : ps.length === 2 ? "is-two" : ""}`}>
                  {ps.map((p) => (
                    <OddButton key={p.pick} p={p} wide on={g.inSlip.has(`${m.id}|${p.market}|${p.pick}`)} onClick={() => add(p, k.title)} />
                  ))}
                </div>
              </div>
            );
          })}
          {!model && <p className="text-[11px] text-white/40">Odds not available for this match.</p>}
        </div>
      )}
    </div>
  );
}

/* ───────────── Match list ───────────── */

function useList(g: SportsGame, sport: Sport, view: View, comp: string) {
  const now = g.now || 0;
  return useMemo(() => {
    const list = g.matches.filter((m) => m.sport === sport);
    const inView = list.filter((m) => {
      if (view === "live") return isLive(m);
      if (view === "results") return m.status === "done" || m.status === "void";
      if (m.status !== "pre") return false;
      return view === "today" ? sameDay(m.kickoff, now) : !sameDay(m.kickoff, now);
    });
    const comps = new Map<string, { id: string; name: string; country?: string; n: number; live: number }>();
    for (const m of list) {
      const c = comps.get(m.comp.id) ?? { id: m.comp.id, name: m.comp.name, country: m.comp.country, n: 0, live: 0 };
      if (m.status === "pre" || isLive(m)) c.n++;
      if (isLive(m)) c.live++;
      comps.set(m.comp.id, c);
    }
    const shown = (comp === "all" ? inView : inView.filter((m) => m.comp.id === comp)).sort((a, b) => (view === "results" ? b.kickoff - a.kickoff : a.kickoff - b.kickoff));
    const groups: { id: string; name: string; country?: string; matches: Match[] }[] = [];
    for (const m of shown) {
      let grp = groups.find((x) => x.id === m.comp.id);
      if (!grp) groups.push((grp = { id: m.comp.id, name: m.comp.name, country: m.comp.country, matches: [] }));
      grp.matches.push(m);
    }
    const counts: Record<View, number> = {
      live: list.filter(isLive).length,
      today: list.filter((m) => m.status === "pre" && sameDay(m.kickoff, now)).length,
      upcoming: list.filter((m) => m.status === "pre" && !sameDay(m.kickoff, now)).length,
      results: list.filter((m) => m.status === "done" || m.status === "void").length,
    };
    return { groups, comps: [...comps.values()].sort((a, b) => b.live - a.live || b.n - a.n), counts, total: shown.length };
  }, [g.matches, sport, view, comp, now]);
}

function MatchList({ g, sport, view, comp, lite }: { g: SportsGame; sport: Sport; view: View; comp: string; lite: boolean }) {
  const { groups } = useList(g, sport, view, comp);
  const [open, setOpen] = useState<string | null>(null);
  const err = g.errors[sport];
  if (!g.loaded[sport]) return <p className="sb-empty">Loading matches…</p>;
  if (!groups.length)
    return (
      <div className="sb-empty">
        {err ? errorText(err) : view === "live" ? "No live match right now." : view === "results" ? "No recent result." : "No match in this view."}
        {sport !== "football" && err === "missing-key" && <span className="mt-1 block text-white/35">Basketball and hockey use API_SPORTS_KEY.</span>}
      </div>
    );
  return (
    <div className="space-y-3">
      {groups.map((grp) => (
        <section key={grp.id}>
          <p className="sb-comp">
            {grp.name}
            {grp.country && <span>{grp.country}</span>}
          </p>
          <div className="space-y-1.5">
            {grp.matches.map((m) => (
              <MatchRow key={m.id} g={g} m={m} lite={lite} open={open === m.id} onOpen={() => setOpen((o) => (o === m.id ? null : m.id))} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ───────────── Ticket (bet slip) ───────────── */

function Slip({ g, lite }: { g: SportsGame; lite: boolean }) {
  const [typed, setTyped] = useState("");
  useEffect(() => setTyped(String(g.stake)), [g.stake]);
  const n = g.slip.length;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
        {!n && <p className="sb-empty !py-6">Tap odds to add picks. Several picks make a combo: the odds multiply.</p>}
        {g.slip.map((s) => (
          <div key={s.key} className={`sb-sel ${s.now === null ? "is-closed" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-[#efe2bd]">{s.label}</p>
              <p className="truncate text-[10px] text-white/45">{s.marketTitle}</p>
              <p className="truncate text-[10px] text-white/35">
                {s.live && <span className="mr-1 text-[#ff6b6b]">LIVE</span>}
                {s.matchLabel}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`sb-sel__odds ${s.now !== null && s.now !== s.odds ? (s.now > s.odds ? "is-up" : "is-down") : ""}`}>
                {s.now === null ? "Closed" : fmtOdds(s.now)}
                {s.now !== null && s.now !== s.odds && <small>{fmtOdds(s.odds)}</small>}
              </span>
              <button type="button" onClick={() => g.removeSel(s.key)} className="text-[10px] font-bold uppercase tracking-wider text-white/35 hover:text-white/70" aria-label="Remove pick">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold uppercase tracking-[0.16em] text-white/45">{n > 1 ? `Combo · ${n} picks` : n ? "Single" : "Ticket"}</span>
          {n > 0 && (
            <button type="button" onClick={g.clearSlip} className="font-bold uppercase tracking-wider text-white/35 hover:text-white/70">
              Clear
            </button>
          )}
        </div>
        <div className={`flex items-center gap-1 overflow-x-auto [scrollbar-width:none] ${lite ? "" : "justify-between"}`} role="radiogroup" aria-label="Stake">
          {SPORT_CHIPS.map((v) => (
            <button key={v} type="button" role="radio" aria-checked={g.stake === v} onClick={() => g.setStake(v)} className={`rl-chip-pick relative aspect-square shrink-0 rounded-full ${lite ? "w-[2.3rem]" : "w-[clamp(1.45rem,1.75vw,2rem)]"} ${g.stake === v ? "is-selected" : ""}`}>
              <ChipFace value={v} />
            </button>
          ))}
        </div>
        <label className="sb-stake">
          <span>Stake ◈</span>
          <input
            inputMode="numeric"
            value={typed}
            onChange={(e) => setTyped(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
            onBlur={() => g.setStake(+typed || SPORTS_MIN)}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            aria-label={`Stake, ${SPORTS_MIN} to ${SPORTS_MAX}`}
          />
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rl-window rl-window--sm">
            <span className="rl-window__label">Total odds</span>
            <span className="rl-window__value">{n ? fmtOdds(g.slipOdds) : "—"}</span>
          </div>
          <div className={`rl-window rl-window--sm ${n ? "is-hot" : ""}`}>
            <span className="rl-window__label">Potential win</span>
            <span className="rl-window__value">
              <span className="rl-window__cur">◈</span>
              {n ? compact(g.potential) : 0}
            </span>
          </div>
        </div>
        <button type="button" onClick={g.place} disabled={!n} className={`rl-spin !py-2.5 ${n ? "is-ready" : ""}`}>
          <span className="text-[13px] !tracking-[0.14em]">{g.slipChanged ? "ACCEPT NEW ODDS" : n > 1 ? "PLACE COMBO" : "PLACE BET"}</span>
          <span className="text-[9px] font-black tracking-[0.12em] opacity-60">◈ {compact(g.stake)}{n >= MAX_PICKS ? ` · max ${MAX_PICKS} picks` : ""}</span>
        </button>
      </div>
    </div>
  );
}

function TicketCard({ g, t }: { g: SportsGame; t: Ticket }) {
  const co = t.status === "open" ? g.cashOutValue(t) : null;
  const state = t.status === "open" ? "Open" : t.status === "won" ? "Won" : t.status === "lost" ? "Lost" : t.status === "cashed" ? "Cashed out" : "Void";
  return (
    <div className={`sb-ticket is-${t.status}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="sb-ticket__state">{state}</span>
        <span className="text-[10px] text-white/35">
          #{t.id} · {t.legs.length > 1 ? `Combo ×${fmtOdds(t.odds)}` : `@ ${fmtOdds(t.odds)}`}
        </span>
      </div>
      <ul className="mt-1.5 space-y-1">
        {t.legs.map((l) => (
          <li key={l.key} className="flex items-center gap-2 text-[11px]">
            <i className={`sb-leg ${l.result ? `is-${l.result}` : ""}`} />
            <span className="min-w-0 flex-1 truncate">
              <b className="font-bold text-[#efe2bd]">{l.label}</b> <span className="text-white/40">· {l.matchLabel}</span>
            </span>
            <span className="text-white/45">{l.final ?? fmtOdds(l.odds)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-white/45">Stake ◈ {money(t.stake)}</span>
        {t.status === "open" ? (
          co !== null ? (
            <button type="button" onClick={() => g.cashOut(t.id)} className="rl-key is-on !h-7">
              Cash out ◈ {compact(co)}
            </button>
          ) : (
            <span className="text-white/40">Win ◈ {compact(Math.floor(t.stake * t.odds))}</span>
          )
        ) : (
          <span className={t.payout > t.stake ? "font-bold text-[#f0d38b]" : "text-white/40"}>{t.payout ? `◈ ${money(t.payout)}` : "—"}</span>
        )}
      </div>
    </div>
  );
}

function MyBets({ g }: { g: SportsGame }) {
  const s = useSession().sports;
  const open = g.tickets.filter((t) => t.status === "open").reverse();
  const done = g.tickets.filter((t) => t.status !== "open").reverse().slice(0, 40);
  useEffect(() => {
    g.markSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {(
          [
            ["Tickets today", String(s.spins)],
            ["Net today", `${s.net >= 0 ? "+" : "−"}◈ ${compact(Math.abs(s.net))}`],
            ["Best", `◈ ${compact(Math.max(0, s.biggest))}`],
          ] as const
        ).map(([l, v]) => (
          <div key={l} className="rounded-lg border border-white/10 bg-black/30 px-1 py-1.5">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/40">{l}</p>
            <p className="truncate text-[12px] font-bold text-[#efe2bd]">{v}</p>
          </div>
        ))}
      </div>
      {!open.length && !done.length && <p className="sb-empty">No ticket yet.</p>}
      {open.length > 0 && <p className="rl-eyebrow !text-[9px]">Open · {open.length}</p>}
      {open.map((t) => (
        <TicketCard key={t.id} g={g} t={t} />
      ))}
      {done.length > 0 && <p className="rl-eyebrow !text-[9px]">Settled</p>}
      {done.map((t) => (
        <TicketCard key={t.id} g={g} t={t} />
      ))}
      <p className="pb-1 text-center text-[9.5px] leading-relaxed text-white/30">
        Virtual chips only — no real money. Odds by the Royal Ace model. Data: football-data.org, API-Sports.
      </p>
    </div>
  );
}

/* ───────────── Game ───────────── */

export default function Sportsbook({ active, focus = false, onFocusChange }: { active: boolean; focus?: boolean; onFocusChange?: (v: boolean) => void }) {
  const desktop = useDesktop();
  const g = useSportsbook(active);
  const [sport, setSport] = useState<Sport>("football");
  const [view, setView] = useState<View>("today");
  const [comp, setComp] = useState("all");
  const [side, setSide] = useState<"slip" | "bets">("slip");
  const [sheet, setSheet] = useState<null | "slip" | "bets">(null);
  const { counts, comps } = useList(g, sport, view, comp);

  // Open on Live when something is on.
  const picked = useRef(false);
  useEffect(() => {
    if (picked.current || !g.loaded.football) return;
    picked.current = true;
    if (g.matches.some((m) => m.sport === "football" && isLive(m))) setView("live");
  }, [g.loaded.football, g.matches]);
  useEffect(() => setComp("all"), [sport]);

  // ---- Focus (instant, like the other games)
  const closeRef = useRef(onFocusChange);
  closeRef.current = onFocusChange;
  useEffect(() => {
    if (!focus) return;
    const root = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const wasFullscreen = Boolean(document.fullscreenElement);
    const cancelFs = isNarrowScreen() ? () => {} : requestFullscreenSettled(() => {});
    let entered = false;
    const onFsChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered && !wasFullscreen) closeRef.current?.(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector("[role=dialog][aria-modal=true]")) closeRef.current?.(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelFs();
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      void root;
      if (!wasFullscreen && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    };
  }, [focus]);
  // F toggles focus, like the other games.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || (t && t.closest("input, textarea, select, [contenteditable]"))) return;
      if (e.key.toLowerCase() === "f") window.dispatchEvent(new CustomEvent("royal-ace:toggle-focus"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const messageLine = (
    <p key={g.refused} className={`rl-message truncate ${g.refused ? "rl-shake" : ""}`} role="status">
      {g.message || (g.demo ? "Demo fixtures" : "Pick your odds")}
    </p>
  );
  const sportTabs = (cls: string) =>
    SPORTS.map((s) => {
      const live = g.matches.filter((m) => m.sport === s.id && isLive(m)).length;
      return (
        <button key={s.id} type="button" onClick={() => setSport(s.id)} aria-pressed={sport === s.id} className={`sb-sport ${cls} ${sport === s.id ? "is-on" : ""}`}>
          <span aria-hidden="true">{s.icon}</span>
          <span>{s.label}</span>
          {live > 0 && <em>{live}</em>}
        </button>
      );
    });
  const viewTabs = (
    <div className="rl-tabs !grid-cols-4" role="tablist">
      {VIEWS.map((v) => (
        <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={`rl-tab ${view === v.id ? "is-on" : ""}`}>
          {v.label}
          {counts[v.id] > 0 && <span className="ml-1 opacity-60">{counts[v.id]}</span>}
        </button>
      ))}
    </div>
  );
  const demoNote = g.demo && (
    <p className="sb-demo">Demo fixtures — real matches appear once the API keys are set in Vercel.</p>
  );
  const frame = (lite: boolean) =>
    `rl-root sb-root ${lite ? "m-lite" : ""} ${focus ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black" : lite ? "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[500px]" : "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[540px] lg:h-[calc(100dvh-10rem)]"}`;
  const exitKey = focus && (
    <button
      type="button"
      onClick={() => onFocusChange?.(false)}
      aria-label="Exit focus mode"
      style={{ top: "max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
      className="fixed right-4 z-[61] flex h-9 items-center gap-1.5 rounded-full border border-[#d7b45b]/50 bg-black/85 px-3 text-[11px] font-bold uppercase tracking-wider text-[#e5c779]"
    >
      ✕ <span>Exit</span>
    </button>
  );

  // ---- PC
  if (desktop) {
    return (
      <div data-theme="carbon" className={frame(false)}>
        {exitKey}
        <section className={`rl-stage relative flex h-full flex-col overflow-hidden ${focus ? "" : "rounded-3xl border border-white/10"}`}>
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)_minmax(0,clamp(17rem,24vw,22rem))] gap-4 px-5 pb-4 pt-5 xl:gap-5">
            <aside className="flex min-h-0 flex-col gap-3">
              <div className="rl-plaque mx-auto flex flex-col items-center px-5 py-2 text-center">
                <span className="font-display gold-text text-[17px] font-bold tracking-[0.28em]">SPORTSBOOK</span>
                <span className="text-[8.5px] font-bold tracking-[0.3em] text-white/45">REAL MATCHES · LIVE</span>
              </div>
              <div className="flex flex-col gap-1.5">{sportTabs("")}</div>
              <div className="rl-card flex min-h-0 flex-1 flex-col p-2.5">
                <p className="rl-eyebrow mb-1.5 !text-[9px]">Competitions</p>
                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  <button type="button" onClick={() => setComp("all")} className={`sb-compkey ${comp === "all" ? "is-on" : ""}`}>
                    <span className="truncate">All competitions</span>
                  </button>
                  {comps.map((c) => (
                    <button key={c.id} type="button" onClick={() => setComp(c.id)} className={`sb-compkey ${comp === c.id ? "is-on" : ""}`}>
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      {c.live > 0 && <i className="sb-dot" />}
                      <span className="text-white/35">{c.n}</span>
                    </button>
                  ))}
                  {!comps.length && <p className="px-1 text-[11px] text-white/35">—</p>}
                </div>
              </div>
            </aside>
            <div className="flex min-h-0 flex-col gap-3">
              <div className={`flex items-center justify-between gap-3 ${focus ? "pr-24" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="rl-announce max-w-full">{messageLine}</div>
                </div>
                <div className="rl-window rl-window--sm !min-w-[9rem] !py-1">
                  <span className="rl-window__label">Credit</span>
                  <span className="rl-window__value">
                    <span className="rl-window__cur">◈</span>
                    <Counter value={g.balance} />
                  </span>
                </div>
              </div>
              {viewTabs}
              {demoNote}
              <div className="sb-list min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                <MatchList g={g} sport={sport} view={view} comp={comp} lite={false} />
              </div>
            </div>
            <aside className="rl-card flex min-h-0 flex-col p-3">
              <div className="rl-tabs !grid-cols-2" role="tablist">
                <button type="button" role="tab" aria-selected={side === "slip"} onClick={() => setSide("slip")} className={`rl-tab ${side === "slip" ? "is-on" : ""}`}>
                  Ticket{g.slip.length ? ` · ${g.slip.length}` : ""}
                </button>
                <button type="button" role="tab" aria-selected={side === "bets"} onClick={() => setSide("bets")} className={`rl-tab ${side === "bets" ? "is-on" : ""}`}>
                  My bets{g.openCount ? ` · ${g.openCount}` : ""}
                  {g.unseen > 0 && <i className="sb-badge">{g.unseen}</i>}
                </button>
              </div>
              <div className="mt-2.5 flex min-h-0 flex-1 flex-col">{side === "slip" ? <Slip g={g} lite={false} /> : <MyBets g={g} />}</div>
            </aside>
          </div>
        </section>
      </div>
    );
  }

  // ---- Phones / tablets (light version)
  return (
    <div data-theme="carbon" className={frame(true)}>
      {exitKey}
      <section
        className={`rl-stage relative flex h-full flex-col overflow-hidden ${focus ? "" : "rounded-3xl border border-white/10"}`}
        style={focus ? { paddingTop: "max(3.25rem, calc(env(safe-area-inset-top) + 3rem))" } : undefined}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-2 pt-2">
          <div className="grid grid-cols-3 gap-1">{sportTabs("is-sm")}</div>
          {viewTabs}
          <div className="flex h-5 items-center justify-center">{messageLine}</div>
          {demoNote}
          <div className="sb-list min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <MatchList g={g} sport={sport} view={view} comp="all" lite />
          </div>
        </div>
        <div className="rl-console grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 px-2 pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}>
          <button type="button" onClick={() => setSheet("slip")} className={`rl-spin !flex-row !justify-between !px-3 !py-2 ${g.slip.length ? "is-ready" : ""}`}>
            <span className="text-[12px] !tracking-[0.1em]">TICKET · {g.slip.length}</span>
            <span className="text-[11px] font-black !tracking-[0.06em]">{g.slip.length ? `×${fmtOdds(g.slipOdds)} · ◈ ${compact(g.potential)}` : "Tap odds"}</span>
          </button>
          <button type="button" onClick={() => setSheet("bets")} className="rl-key relative !h-auto px-3">
            My bets{g.openCount ? ` · ${g.openCount}` : ""}
            {g.unseen > 0 && <i className="sb-badge">{g.unseen}</i>}
          </button>
        </div>
      </section>
      {sheet && <Sheet g={g} tab={sheet} setTab={setSheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Sheet({ g, tab, setTab, onClose }: { g: SportsGame; tab: "slip" | "bets"; setTab: (t: "slip" | "bets") => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const tabs: [typeof tab, ReactNode][] = [
    ["slip", `Ticket${g.slip.length ? ` · ${g.slip.length}` : ""}`],
    ["bets", `My bets${g.openCount ? ` · ${g.openCount}` : ""}`],
  ];
  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div role="dialog" aria-modal="true" aria-label="Bet slip" className="rl-sheet safe-y absolute inset-x-0 bottom-0 flex h-[78dvh] flex-col">
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="rl-tabs !grid-cols-2 flex-1" role="tablist">
            {tabs.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rl-tab ${tab === id ? "is-on" : ""}`}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="rl-icon-key" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mt-1.5 truncate px-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9dcb8]" role="status">
          {g.message}
        </p>
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">{tab === "slip" ? <Slip g={g} lite /> : <MyBets g={g} />}</div>
      </div>
    </div>
  );
}
