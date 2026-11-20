/**
 * Demo fixtures, used only when the real feeds cannot be reached
 * (local preview, or before the API keys are set). Clearly labelled
 * "Demo" in the interface. Scores follow the clock deterministically.
 */
import { hashRand } from "../hashRand";
import type { Match, Sport, Standings } from "./types";

const FB: [string, string, string[]][] = [
  ["PL", "Premier League", ["Arsenal", "Chelsea", "Liverpool", "Man City", "Tottenham", "Newcastle", "Aston Villa", "Brighton"]],
  ["FL1", "Ligue 1", ["Paris SG", "Marseille", "Lyon", "Monaco", "Lille", "Lens", "Nice", "Rennes"]],
  ["PD", "LaLiga", ["Real Madrid", "Barcelona", "Atlético", "Sevilla", "Betis", "Villarreal"]],
  ["CL", "Champions League", ["Inter", "Bayern", "Benfica", "Porto", "Dortmund", "Napoli"]],
];
const BK: [string, string, string[]][] = [
  ["12", "NBA", ["Lakers", "Celtics", "Warriors", "Bucks", "Nuggets", "Knicks", "Heat", "Suns"]],
  ["120", "Euroleague", ["Real Madrid", "Olympiacos", "Fenerbahçe", "Monaco"]],
];
const HK: [string, string, string[]][] = [["57", "NHL", ["Rangers", "Bruins", "Oilers", "Avalanche", "Maple Leafs", "Canadiens"]]];

const h = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);

function goalsBy(seed: number, minutes: number, rate: number, length: number) {
  let n = 0;
  for (let i = 0; i < 9; i++) {
    const t = hashRand(seed + i * 101) * length * 1.6;
    if (t < length && hashRand(seed + i * 7) < rate && t <= minutes) n++;
  }
  return n;
}

export function demoMatches(now: number): Match[] {
  const out: Match[] = [];
  const hour = 3600000;
  const base = Math.floor(now / hour) * hour;
  const offsets = [-2.5, -0.9, -0.4, 0.5, 1.5, 3, 5, 26, 27.5, 50];
  const add = (sport: Sport, defs: [string, string, string[]][], length: number, rate: number, prefix: string) => {
    let k = 0;
    for (const [cid, cname, teams] of defs) {
      for (let i = 0; i + 1 < teams.length; i += 2) {
        const off = offsets[k++ % offsets.length];
        const kickoff = base + off * hour + (sport === "football" ? 0 : 30 * 60000);
        const seed = h(teams[i] + teams[i + 1]);
        const wall = (now - kickoff) / 60000;
        const ht = sport === "football" ? 15 : 0;
        const played = sport === "football" ? (wall > 45 + ht ? wall - ht : Math.min(wall, 45)) : wall * 0.6;
        const total = sport === "football" ? length + 3 : length;
        const status = wall < 0 ? "pre" : played >= total ? "done" : sport === "football" && wall > 45 && wall < 45 + ht ? "break" : "live";
        const mins = Math.max(0, Math.min(total, played));
        const sh = status === "pre" ? 0 : goalsBy(seed, mins, rate, total);
        const sa = status === "pre" ? 0 : goalsBy(seed + 999, mins, rate * 0.85, total);
        const half = { h: goalsBy(seed, Math.min(45, mins), rate, total), a: goalsBy(seed + 999, Math.min(45, mins), rate * 0.85, total) };
        let score = { h: sh, a: sa };
        if (sport === "basketball") {
          const pace = cname === "NBA" ? 2.4 : 2.05;
          score = { h: Math.round(mins * pace * (0.95 + hashRand(seed) * 0.12)), a: Math.round(mins * pace * (0.92 + hashRand(seed + 3) * 0.12)) };
          if (status === "done" && score.h === score.a) score.h += 3;
        }
        const per = sport === "football" ? 45 : length / (sport === "hockey" ? 3 : 4);
        const period = Math.min(sport === "football" ? 2 : sport === "hockey" ? 3 : 4, Math.floor(mins / per) + 1);
        out.push({
          id: `${prefix}:demo${seed}`,
          sport,
          comp: { id: cid, name: cname, country: "Demo", season: "2025" },
          home: { id: teams[i], name: teams[i] },
          away: { id: teams[i + 1], name: teams[i + 1] },
          kickoff,
          status,
          clock:
            status === "live" || status === "break"
              ? { period, minute: Math.floor(sport === "football" ? mins : mins - (period - 1) * per), label: status === "break" ? "HT" : sport === "football" ? `${Math.floor(mins)}'` : `${sport === "hockey" ? "P" : "Q"}${period} ${Math.floor(mins - (period - 1) * per)}'` }
              : undefined,
          score: status === "pre" ? null : score,
          ht: sport === "football" && mins >= 45 ? half : null,
          regular: status === "done" ? score : null,
        });
      }
    }
  };
  add("football", FB, 90, 0.33, "fb");
  add("basketball", BK, 48, 0, "bk");
  add("hockey", HK, 60, 0.6, "hk");
  return out;
}

export function demoForms(teams: string[], sport: Sport): Standings {
  const out: Standings = {};
  for (const t of teams) {
    const r = hashRand(h(t));
    const r2 = hashRand(h(t) + 5);
    if (sport === "football") out[t] = { played: 12, scored: 0.8 + r * 1.4, conceded: 0.7 + r2 * 1.1 };
    else if (sport === "hockey") out[t] = { played: 20, scored: 2.4 + r * 1.2, conceded: 2.4 + r2 * 1.1 };
    else out[t] = { played: 15, scored: 105 + r * 16, conceded: 105 + r2 * 14 };
  }
  return out;
}
