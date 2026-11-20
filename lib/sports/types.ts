/** Shared shapes for the sportsbook (server route and client). */

export type Sport = "football" | "basketball" | "hockey";

export type MatchStatus = "pre" | "live" | "break" | "done" | "void";

export type Score = { h: number; a: number };

export type Match = {
  /** Unique across sports: "fb:123", "bk:456", "hk:789". */
  id: string;
  sport: Sport;
  comp: { id: string; name: string; country?: string; season?: string };
  home: { id: string; name: string };
  away: { id: string; name: string };
  /** Kick-off, ms since epoch. */
  kickoff: number;
  status: MatchStatus;
  /** Live clock: period 1..n and minute when known. */
  clock?: { period: number; minute?: number; label: string };
  score: Score | null;
  /** Half-time score (football). */
  ht?: Score | null;
  /** Score that settles bets: regular time for football, 60 minutes for hockey. */
  regular?: Score | null;
};

/** Team strength read from standings, per game averages. */
export type TeamForm = { played: number; scored: number; conceded: number; winPct?: number };
export type Standings = Record<string, TeamForm>;

export type Feed = { matches: Match[]; error?: string; at: number };
export type StandingsFeed = { teams: Standings; error?: string; at: number };
