/**
 * Craps, Las Vegas rules.
 *
 * Line bets
 * - Pass: come-out 7/11 wins, 2/3/12 loses, else the point is set; then the
 *   point wins and 7 loses. Even money. A contract bet once the point is on.
 * - Don't Pass: come-out 2/3 wins, 12 pushes (bar 12), 7/11 loses; then 7
 *   wins and the point loses. Even money.
 * - Come / Don't Come: the same, starting on the roll after they are made;
 *   a come bet "travels" to the number thrown.
 * - Odds behind any of them, at true odds (no house edge), up to 3-4-5×:
 *   4/10 pay 2:1, 5/9 3:2, 6/8 6:5 (lay odds the reverse, up to 6×).
 *   Odds on come bets are off on the come-out roll (returned on a 7).
 *
 * Box and centre bets
 * - Place 4–10: the number before a 7. 9:5 (4/10), 7:5 (5/9), 7:6 (6/8).
 *   Off on the come-out roll; they stay up after a win.
 * - Hardways: the double before a 7 or the easy way. Hard 4/10 7:1,
 *   hard 6/8 9:1. Off on the come-out; they stay up after a win.
 * - Field (one roll): 3, 4, 9, 10, 11 pay 1:1, 2 pays 2:1, 12 pays 3:1.
 * - One-roll props: Any 7 4:1, Any Craps 7:1, 2 and 12 30:1, 3 and 11 15:1.
 */

export type BoxNum = 4 | 5 | 6 | 8 | 9 | 10;
export const BOX: BoxNum[] = [4, 5, 6, 8, 9, 10];
export const HARD: (4 | 6 | 8 | 10)[] = [4, 6, 8, 10];

/** Bets on the layout. Come points are "come6", their odds "comeOdds6"… */
export type Bets = Record<string, number>;

export const PROP_KEYS = ["any7", "anyCraps", "two", "three", "eleven", "twelve"] as const;
export const PROPS: Record<(typeof PROP_KEYS)[number], { label: string; pays: number; wins: (t: number) => boolean }> = {
  any7: { label: "Any 7", pays: 4, wins: (t) => t === 7 },
  anyCraps: { label: "Any craps", pays: 7, wins: (t) => t === 2 || t === 3 || t === 12 },
  two: { label: "Snake eyes", pays: 30, wins: (t) => t === 2 },
  three: { label: "Ace-deuce", pays: 15, wins: (t) => t === 3 },
  eleven: { label: "Yo-leven", pays: 15, wins: (t) => t === 11 },
  twelve: { label: "Boxcars", pays: 30, wins: (t) => t === 12 },
};
export const HARD_PAYS: Record<number, number> = { 4: 7, 6: 9, 8: 9, 10: 7 };
/** Place pays as [win, per stake]. */
export const PLACE_PAYS: Record<BoxNum, [number, number]> = { 4: [9, 5], 10: [9, 5], 5: [7, 5], 9: [7, 5], 6: [7, 6], 8: [7, 6] };
/** True odds for "take" odds (pass / come). */
export const TAKE_PAYS: Record<BoxNum, [number, number]> = { 4: [2, 1], 10: [2, 1], 5: [3, 2], 9: [3, 2], 6: [6, 5], 8: [6, 5] };
/** 3-4-5× odds. */
export const ODDS_MULT: Record<BoxNum, number> = { 4: 3, 10: 3, 5: 4, 9: 4, 6: 5, 8: 5 };

/** Winnings (not counting the stake), whole chips only, rounded down. */
export const ratio = (stake: number, [w, per]: [number, number]) => Math.floor((stake * w) / per);

export const LIMITS = { line: 200000, field: 200000, place: 200000, hard: 50000, prop: 50000 } as const;
export const MIN_BET = 10;

export type Kind = "pass" | "dontPass" | "come" | "dontCome" | "field" | "place" | "hard" | "prop" | "passOdds" | "dontPassOdds" | "comeOdds" | "dcOdds" | "comePoint" | "dcPoint";
export function kindOf(key: string): Kind {
  if (key === "pass" || key === "dontPass" || key === "come" || key === "dontCome" || key === "field" || key === "passOdds" || key === "dontPassOdds") return key;
  if (key.startsWith("place")) return "place";
  if (key.startsWith("hard")) return "hard";
  if (key.startsWith("comeOdds")) return "comeOdds";
  if (key.startsWith("dcOdds")) return "dcOdds";
  if (key.startsWith("come")) return "comePoint";
  if (key.startsWith("dc")) return "dcPoint";
  return "prop";
}
export const numOf = (key: string) => Number(key.replace(/\D/g, "")) as BoxNum;

/** Readable bet names. */
export function betName(key: string): string {
  const k = kindOf(key);
  const n = numOf(key);
  switch (k) {
    case "pass":
      return "Pass line";
    case "dontPass":
      return "Don't pass";
    case "come":
      return "Come";
    case "dontCome":
      return "Don't come";
    case "field":
      return "Field";
    case "passOdds":
      return "Pass odds";
    case "dontPassOdds":
      return "Don't pass odds";
    case "place":
      return `Place ${n}`;
    case "hard":
      return `Hard ${n}`;
    case "comePoint":
      return `Come ${n}`;
    case "dcPoint":
      return `Don't come ${n}`;
    case "comeOdds":
      return `Come ${n} odds`;
    case "dcOdds":
      return `Don't come ${n} odds`;
    default:
      return PROPS[key as keyof typeof PROPS]?.label ?? key;
  }
}

/** The most odds a line or come bet may take. */
export function maxOdds(flat: number, n: BoxNum, lay: boolean) {
  // Lay odds are sized so the win equals 3-4-5× the flat bet: 6× on every number.
  return lay ? flat * 6 : flat * ODDS_MULT[n];
}

export type Line = { key: string; stake: number; result: "win" | "lose" | "push" | "move" | "off"; win: number; note?: string };
export type RollResult = {
  dice: [number, number];
  total: number;
  /** Bets left on the table after the roll. */
  bets: Bets;
  point: BoxNum | null;
  /** What happened to each bet in play. */
  lines: Line[];
  /** Paid back to the player (stakes that come down + winnings). */
  returned: number;
  /** Lost stakes. */
  lost: number;
  /** Winnings only (excluding returned stakes). */
  won: number;
  /** "Seven out", "Point is 6", "Winner 11"… */
  call: string;
  event: "natural" | "craps" | "pointSet" | "pointMade" | "sevenOut" | "roll";
};

/** Resolve one roll of the dice against the table. */
export function resolve(bets: Bets, point: BoxNum | null, d1: number, d2: number): RollResult {
  const t = d1 + d2;
  const hard = d1 === d2;
  const comeOut = point === null;
  const next: Bets = { ...bets };
  const lines: Line[] = [];
  let returned = 0;
  let lost = 0;
  let won = 0;
  const win = (key: string, stake: number, amount: number, stays: boolean, note?: string) => {
    lines.push({ key, stake, result: "win", win: amount, note });
    won += amount;
    returned += amount + (stays ? 0 : stake);
    if (!stays) delete next[key];
  };
  const lose = (key: string, stake: number) => {
    lines.push({ key, stake, result: "lose", win: 0 });
    lost += stake;
    delete next[key];
  };
  const push = (key: string, stake: number, comesDown: boolean, note?: string) => {
    lines.push({ key, stake, result: "push", win: 0, note });
    if (comesDown) {
      returned += stake;
      delete next[key];
    }
  };

  for (const [key, stake] of Object.entries(bets)) {
    if (!stake) continue;
    const k = kindOf(key);
    const n = numOf(key);
    switch (k) {
      case "pass":
        if (comeOut) {
          if (t === 7 || t === 11) win(key, stake, stake, true);
          else if (t === 2 || t === 3 || t === 12) lose(key, stake);
        } else if (t === point) win(key, stake, stake, true);
        else if (t === 7) lose(key, stake);
        break;
      case "dontPass":
        if (comeOut) {
          if (t === 2 || t === 3) win(key, stake, stake, true);
          else if (t === 12) push(key, stake, false, "Bar 12");
          else if (t === 7 || t === 11) lose(key, stake);
        } else if (t === 7) win(key, stake, stake, true);
        else if (t === point) lose(key, stake);
        break;
      case "passOdds":
        if (point && t === point) win(key, stake, ratio(stake, TAKE_PAYS[point]), false);
        else if (point && t === 7) lose(key, stake);
        break;
      case "dontPassOdds":
        if (point && t === 7) win(key, stake, ratio(stake, [TAKE_PAYS[point][1], TAKE_PAYS[point][0]]), false);
        else if (point && t === point) lose(key, stake);
        break;
      case "come":
        if (t === 7 || t === 11) win(key, stake, stake, false);
        else if (t === 2 || t === 3 || t === 12) lose(key, stake);
        else {
          // Travels to the number (adds to a come bet already there).
          delete next[key];
          next[`come${t}`] = (next[`come${t}`] ?? 0) + stake;
          lines.push({ key, stake, result: "move", win: 0, note: `to ${t}` });
        }
        break;
      case "dontCome":
        if (t === 2 || t === 3) win(key, stake, stake, false);
        else if (t === 12) push(key, stake, false, "Bar 12");
        else if (t === 7 || t === 11) lose(key, stake);
        else {
          delete next[key];
          next[`dc${t}`] = (next[`dc${t}`] ?? 0) + stake;
          lines.push({ key, stake, result: "move", win: 0, note: `to ${t}` });
        }
        break;
      case "comePoint":
        if (t === n) win(key, stake, stake, false);
        else if (t === 7) lose(key, stake);
        break;
      case "dcPoint":
        if (t === 7) win(key, stake, stake, false);
        else if (t === n) lose(key, stake);
        break;
      case "comeOdds":
        // Off on the come-out: a 7 returns them, the number pays.
        if (t === n) win(key, stake, ratio(stake, TAKE_PAYS[n]), false);
        else if (t === 7) {
          if (comeOut) push(key, stake, true, "Odds off");
          else lose(key, stake);
        }
        break;
      case "dcOdds":
        if (t === 7) win(key, stake, ratio(stake, [TAKE_PAYS[n][1], TAKE_PAYS[n][0]]), false);
        else if (t === n) lose(key, stake);
        break;
      case "field":
        if (t === 2) win(key, stake, stake * 2, false, "Pays double");
        else if (t === 12) win(key, stake, stake * 3, false, "Pays triple");
        else if ([3, 4, 9, 10, 11].includes(t)) win(key, stake, stake, false);
        else lose(key, stake);
        break;
      case "place":
        if (comeOut) break; // off
        if (t === n) win(key, stake, ratio(stake, PLACE_PAYS[n]), true);
        else if (t === 7) lose(key, stake);
        break;
      case "hard":
        if (comeOut) break; // off
        if (t === n && hard) win(key, stake, stake * HARD_PAYS[n], true);
        else if (t === 7 || t === n) lose(key, stake);
        break;
      case "prop": {
        const p = PROPS[key as keyof typeof PROPS];
        if (!p) break;
        if (p.wins(t)) win(key, stake, stake * p.pays, false);
        else lose(key, stake);
        break;
      }
    }
  }

  // The point.
  let newPoint: BoxNum | null = point;
  let event: RollResult["event"] = "roll";
  let call = `${t}`;
  if (comeOut) {
    if (t === 7 || t === 11) {
      event = "natural";
      call = `Winner ${t}`;
    } else if (t === 2 || t === 3 || t === 12) {
      event = "craps";
      call = `Craps ${t}`;
    } else {
      newPoint = t as BoxNum;
      event = "pointSet";
      call = `Point is ${t}`;
    }
  } else if (t === point) {
    newPoint = null;
    event = "pointMade";
    call = `Winner! ${t} the point`;
  } else if (t === 7) {
    newPoint = null;
    event = "sevenOut";
    call = "Seven out";
  } else if (hard && (t === 4 || t === 6 || t === 8 || t === 10)) call = `${t} the hard way`;
  else call = `${t}${t === 11 ? " yo" : t === 2 ? " craps" : t === 3 ? " craps" : t === 12 ? " craps" : ""}`;

  // Pass odds come down with the point; nothing behind a line bet that left.
  if (newPoint === null) {
    delete next.passOdds;
    delete next.dontPassOdds;
  }
  return { dice: [d1, d2], total: t, bets: next, point: newPoint, lines, returned, lost, won, call, event };
}

/** Fair die from crypto (rejection sampling). */
export function rollDie(): number {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const b = new Uint8Array(1);
    do c.getRandomValues(b);
    while (b[0] >= 252);
    return (b[0] % 6) + 1;
  }
  return Math.floor(Math.random() * 6) + 1;
}

/** Can this bet be made now? Returns a reason when not. */
export function canPlace(key: string, bets: Bets, point: BoxNum | null): string | null {
  const k = kindOf(key);
  if (k === "pass" || k === "dontPass") return point === null ? null : "Line bets go on during the come-out roll";
  if (k === "come" || k === "dontCome") return point !== null ? null : "Come bets open once a point is set";
  if (k === "passOdds") return point !== null && bets.pass ? null : "Odds go behind a Pass bet once the point is set";
  if (k === "dontPassOdds") return point !== null && bets.dontPass ? null : "Lay odds go behind a Don't pass bet once the point is set";
  if (k === "comeOdds") return bets[`come${numOf(key)}`] ? null : "No come bet on that number";
  if (k === "dcOdds") return bets[`dc${numOf(key)}`] ? null : "No don't come bet on that number";
  if (k === "comePoint" || k === "dcPoint") return "Come bets travel on their own";
  return null;
}

/** Highest stake allowed on a bet given what is already on the table. */
export function limitFor(key: string, bets: Bets, point: BoxNum | null): number {
  const k = kindOf(key);
  if (k === "passOdds" && point) return maxOdds(bets.pass ?? 0, point, false);
  if (k === "dontPassOdds" && point) return maxOdds(bets.dontPass ?? 0, point, true);
  if (k === "comeOdds") return maxOdds(bets[`come${numOf(key)}`] ?? 0, numOf(key), false);
  if (k === "dcOdds") return maxOdds(bets[`dc${numOf(key)}`] ?? 0, numOf(key), true);
  if (k === "pass" || k === "dontPass" || k === "come" || k === "dontCome") return LIMITS.line;
  if (k === "field") return LIMITS.field;
  if (k === "place") return LIMITS.place;
  if (k === "hard") return LIMITS.hard;
  return LIMITS.prop;
}

/** Bets the player may take back between rolls (not contract bets). */
export function removable(key: string, point: BoxNum | null): boolean {
  const k = kindOf(key);
  if (k === "pass" || k === "dontPass") return point === null;
  if (k === "comePoint" || k === "dcPoint") return false;
  return true;
}

export const totalOf = (b: Bets) => Object.values(b).reduce((a, v) => a + v, 0);

/** House edge of each bet (per roll resolved), for the info panel. */
export const EDGES: [string, string][] = [
  ["Pass / Come", "1.41%"],
  ["Don't pass / Don't come", "1.36%"],
  ["Odds", "0% — true odds"],
  ["Place 6 / 8", "1.52%"],
  ["Place 5 / 9", "4.00%"],
  ["Place 4 / 10", "6.67%"],
  ["Field (2×, 3×)", "2.78%"],
  ["Hard 6 / 8", "9.09%"],
  ["Hard 4 / 10", "11.11%"],
  ["Any 7", "16.67%"],
  ["Any craps", "11.11%"],
  ["2, 3, 11, 12", "13.89% / 11.11%"],
];
