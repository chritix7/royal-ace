"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HAPTIC, haptic } from "./haptics";
import { sfx } from "./sound";
import { ambience } from "./ambience";
import { track } from "./events";
import { sessionStore } from "./sessionStore";
import { useBalance, wallet } from "./wallet";
import { MAX_BET, MAX_SHOTS, MIN_BET, PENALTY_CHIPS, multiplierAt, payout, shoot, type Level, type Shooter, type Zone } from "./penalty";
import { brag } from "./brag";

/**
 * Penalty at the Chrysonyx: the bet leaves the credit at kick-off, every
 * shot is drawn before its animation and saved with the round, so a
 * reload never changes a shot: it resumes the round (or settles a shot
 * that was in the air).
 */

export type PenaltyPhase = "idle" | "aim" | "shooting" | "goal" | "saved" | "cashed";
export type ShotRecord = { aim: Zone; dive: Zone; goal: boolean };
export type RoundRecord = { id: number; at: number; bet: number; goals: number; won: number; cashed: boolean; level?: Level; shooter?: Shooter };
type Round = { id: number; bet: number; shots: ShotRecord[]; inAir: ShotRecord | null; level?: Level; shooter?: Shooter };
export type Records = { streak: number; bestStreak: number; bestCash: number; perfects: number };
type Saved = { chip: number; bet: number; history: RoundRecord[]; round: Round | null; roundId: number; level: Level; shooter: Shooter; records: Records };
const KEY = "royalace:penalty";
const HISTORY_MAX = 40;
const NO_RECORDS: Records = { streak: 0, bestStreak: 0, bestCash: 0, perfects: 0 };
const EMPTY: Saved = { chip: 100, bet: 100, history: [], round: null, roundId: 0, level: "normal", shooter: "striker", records: NO_RECORDS };

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const s = JSON.parse(raw) as Partial<Saved>;
    return {
      chip: PENALTY_CHIPS.includes(s.chip ?? 0) ? (s.chip as number) : EMPTY.chip,
      bet: Math.min(MAX_BET, Math.max(MIN_BET, s.bet ?? EMPTY.bet)),
      history: Array.isArray(s.history) ? s.history.slice(-HISTORY_MAX) : [],
      round: s.round ?? null,
      roundId: s.roundId ?? 0,
      level: s.level === "easy" || s.level === "legend" ? s.level : "normal",
      shooter: s.shooter === "captain" || s.shooter === "wonderkid" ? s.shooter : "striker",
      records: { ...NO_RECORDS, ...(s.records ?? {}) },
    };
  } catch {
    return { ...EMPTY };
  }
}
function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function usePenalty(active: boolean, shotMs: number, slowMo = false) {
  const balance = useBalance();
  const [phase, setPhase] = useState<PenaltyPhase>("idle");
  const [bet, setBetState] = useState(EMPTY.bet);
  const [chip, setChipState] = useState(EMPTY.chip);
  const [round, setRound] = useState<Round | null>(null);
  const [lastShot, setLastShot] = useState<ShotRecord | null>(null);
  const [shotId, setShotId] = useState(0);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [result, setResult] = useState<{ won: number; goals: number; cashed: boolean } | null>(null);
  const [message, setMessage] = useState("Set your bet and kick off");
  const [refused, setRefused] = useState(0);
  const [level, setLevelState] = useState<Level>("normal");
  const [shooter, setShooterState] = useState<Shooter>("striker");
  const [records, setRecords] = useState<Records>(NO_RECORDS);
  const [shotTime, setShotTime] = useState(shotMs);
  const savedRef = useRef<Saved>({ ...EMPTY });
  const persist = (patch: Partial<Saved>) => {
    savedRef.current = { ...savedRef.current, ...patch };
    save(savedRef.current);
  };
  const refuse = (why: string) => {
    setMessage(why);
    setRefused((n) => n + 1);
    haptic(HAPTIC.tick);
    return false;
  };

  const goals = round ? round.shots.filter((s) => s.goal).length : 0;
  const lv: Level = round?.level ?? level;
  const sh: Shooter = round?.shooter ?? shooter;
  const bump = (patch: Partial<Records>) => {
    const next = { ...savedRef.current.records, ...patch };
    next.bestStreak = Math.max(next.bestStreak, next.streak);
    persist({ records: next });
    setRecords(next);
  };

  // ---- End of a round
  const finish = useCallback((r: Round, cashed: boolean, quiet = false) => {
    const g = r.shots.filter((s) => s.goal).length;
    const won = cashed ? payout(r.bet, g, r.level, r.shooter) : 0;
    if (won) wallet.add(won);
    wallet.setLocked(false);
    const rec: RoundRecord = { id: r.id, at: Date.now(), bet: r.bet, goals: g, won, cashed, level: r.level, shooter: r.shooter };
    const rc = savedRef.current.records;
    const nextRec: Records = { ...rc, bestCash: Math.max(rc.bestCash, won), perfects: rc.perfects + (g >= MAX_SHOTS ? 1 : 0) };
    persist({ records: nextRec });
    setRecords(nextRec);
    const nextHistory = [...savedRef.current.history, rec].slice(-HISTORY_MAX);
    persist({ round: null, history: nextHistory });
    setHistory(nextHistory);
    setRound(null);
    setResult({ won, goals: g, cashed });
    window.setTimeout(
      () => {
        sessionStore.recordPenalty(r.bet, won - r.bet);
        track("penaltyRound");
        if (g > 0) track("penaltyGoal", g);
        if (cashed && won > r.bet) track("penaltyCashout");
        if (cashed && g >= 4) {
          track("penaltyBigWin");
          brag({ game: "Penalty", amount: won, mult: won / r.bet });
        }
        if (g >= MAX_SHOTS) track("penaltyPerfect");
      },
      quiet ? 0 : 600,
    );
    return won;
  }, []);

  // ---- Restore
  useEffect(() => {
    const s = load();
    savedRef.current = s;
    setChipState(s.chip);
    setBetState(s.bet);
    setHistory(s.history);
    setLevelState(s.level);
    setShooterState(s.shooter);
    setRecords(s.records);
    const r = s.round;
    if (!r) return;
    // A shot in the air when the page closed: it counts as taken.
    const shots = r.inAir ? [...r.shots, r.inAir] : r.shots;
    const fixed: Round = { ...r, shots, inAir: null };
    const last = shots[shots.length - 1];
    if (last && !last.goal) {
      finish(fixed, false, true);
      setPhase("saved");
      setMessage("Saved by the keeper");
      return;
    }
    const g = shots.filter((x) => x.goal).length;
    if (g >= MAX_SHOTS) {
      finish(fixed, true, true);
      setPhase("cashed");
      return;
    }
    persist({ round: fixed });
    setRound(fixed);
    wallet.setLocked(true);
    setPhase("aim");
    setMessage(g ? `×${multiplierAt(g, fixed.level, fixed.shooter)} · cash out or shoot` : "Pick your corner");
    window.setTimeout(() => window.dispatchEvent(new CustomEvent("royal-ace:goto-tab", { detail: "penalty" })), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => wallet.setLocked(false), []);

  // ---- Bet
  const setBet = (v: number) => {
    if (round) return;
    const b = Math.max(MIN_BET, Math.min(MAX_BET, Math.round(v)));
    setBetState(b);
    persist({ bet: b });
    setResult(null);
  };
  const setChip = (v: number) => {
    setChipState(v);
    persist({ chip: v });
    if (!round) setBet(v);
  };
  const setLevel = (l: Level) => {
    if (round) return;
    setLevelState(l);
    persist({ level: l });
    setResult(null);
  };
  const setShooter = (x: Shooter) => {
    if (round) return;
    setShooterState(x);
    persist({ shooter: x });
    setResult(null);
  };
  const double = () => setBet(bet * 2);
  const half = () => setBet(Math.floor(bet / 2));

  // ---- Round
  const kickOff = () => {
    if (round) return false;
    if (bet > wallet.getBalance()) return refuse("Not enough chips");
    const id = savedRef.current.roundId + 1;
    const r: Round = { id, bet, shots: [], inAir: null, level, shooter };
    wallet.add(-bet);
    wallet.setLocked(true);
    persist({ round: r, roundId: id });
    setRound(r);
    setResult(null);
    setLastShot(null);
    setPhase("aim");
    setMessage("Pick your corner");
    sfx.chip();
    return true;
  };

  const timer = useRef(0);
  const shootAt = (aim: Zone) => {
    if (!round || phase !== "aim" && phase !== "goal") return false;
    const shot = { aim, ...shoot(aim, round.level, round.shooter) };
    const r: Round = { ...round, inAir: shot };
    // The fifth goal plays in slow motion (PC).
    const before = round.shots.filter((x) => x.goal).length;
    const ms = slowMo && shot.goal && before === MAX_SHOTS - 1 ? Math.round(shotMs * 1.9) : shotMs;
    setShotTime(ms);
    persist({ round: r });
    setRound(r);
    setLastShot(shot);
    setShotId((n) => n + 1);
    setPhase("shooting");
    setMessage("…");
    sfx.kick();
    timer.current = window.setTimeout(() => {
      timer.current = 0;
      const done: Round = { ...r, shots: [...r.shots, shot], inAir: null };
      const g = done.shots.filter((x) => x.goal).length;
      if (!shot.goal) {
        bump({ streak: 0 });
        sfx.glove();
        window.setTimeout(() => sfx.lose(), 120);
        haptic(HAPTIC.tick);
        finish(done, false);
        setPhase("saved");
        setMessage("Saved by the keeper");
        return;
      }
      bump({ streak: savedRef.current.records.streak + 1 });
      sfx.net();
      ambience.cheer();
      window.setTimeout(() => sfx.win(), 90);
      haptic(HAPTIC.win);
      if (g >= MAX_SHOTS) {
        const won = finish(done, true);
        window.setTimeout(() => sfx.bigWin(), 200);
        setPhase("cashed");
        setMessage(`Perfect five · ◈ ${won.toLocaleString("en-US")}`);
        return;
      }
      persist({ round: done });
      setRound(done);
      setPhase("goal");
      setMessage(`${aim === "tl" || aim === "tr" ? "Top corner!" : "Goal!"} ×${multiplierAt(g, r.level, r.shooter)} · cash out or shoot`);
    }, ms);
    return true;
  };

  const cashOut = () => {
    if (!round || (phase !== "goal" && phase !== "aim") || goals === 0) return false;
    const won = finish(round, true);
    sfx.coin(8);
    setPhase("cashed");
    setMessage(`Cashed out · ◈ ${won.toLocaleString("en-US")}`);
    return true;
  };

  // Leaving mid-shot: settle it at once.
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  // ---- Keyboard: Space kick off / cash out · 1-5 corners · arrows
  const actions = useRef({ kickOff, shootAt, cashOut, double, half, phase, round });
  actions.current = { kickOff, shootAt, cashOut, double, half, phase, round };
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (document.querySelector("[role=dialog][aria-modal=true]")) return;
      const a = actions.current;
      const k = e.key.toLowerCase();
      const map: Record<string, Zone> = { "1": "tl", "2": "tr", "3": "c", "4": "bl", "5": "br" };
      if (k === " " || k === "enter") {
        if (k === "enter" && t?.closest("button, a")) return;
        e.preventDefault();
        t?.blur?.();
        if (!a.round) a.kickOff();
        else if (a.phase === "goal" || a.phase === "aim") a.cashOut();
      } else if (map[k] && a.round && (a.phase === "aim" || a.phase === "goal")) a.shootAt(map[k]);
      else if (!a.round && k === "x") a.double();
      else if (!a.round && k === "h") a.half();
      else if (k === "f") window.dispatchEvent(new CustomEvent("royal-ace:toggle-focus"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return {
    balance,
    phase,
    bet: round ? round.bet : bet,
    chip,
    round,
    goals,
    lastShot,
    shotId,
    history,
    result,
    message,
    refused,
    level: lv,
    shooter: sh,
    setShooter,
    records,
    shotTime,
    setLevel,
    cashValue: round && goals ? payout(round.bet, goals, lv, sh) : 0,
    nextValue: payout(round ? round.bet : bet, Math.min(MAX_SHOTS, goals + 1), lv, sh),
    setBet,
    setChip,
    double,
    half,
    kickOff,
    shootAt,
    cashOut,
  };
}

export type PenaltyGame = ReturnType<typeof usePenalty>;
