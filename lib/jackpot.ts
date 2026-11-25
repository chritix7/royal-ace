/**
 * Jackpots progressifs à 4 niveaux.
 *
 * Les cagnottes sont exprimées en MULTIPLES DE LA MISE : la valeur affichée est donc
 * « multiple × ta mise actuelle ». Le retour au joueur est ainsi identique à toutes les mises.
 * Chaque tour payant fait grossir les 4 cagnottes ; quand l'une est gagnée, elle repart de sa valeur de départ.
 */
export type JackpotTier = "mini" | "minor" | "major" | "kingpin";
export const JACKPOT_TIERS: JackpotTier[] = ["mini", "minor", "major", "kingpin"];

export const JACKPOTS: Record<JackpotTier, { label: string; seed: number; growth: number }> = {
  mini: { label: "MINI", seed: 5, growth: 0.0083 },
  minor: { label: "MINOR", seed: 20, growth: 0.005 },
  major: { label: "MAJOR", seed: 100, growth: 0.003 },
  kingpin: { label: "KINGPIN", seed: 500, growth: 0.0005 },
};

export type Pools = Record<JackpotTier, number>;

export const freshPools = (): Pools => ({
  mini: JACKPOTS.mini.seed,
  minor: JACKPOTS.minor.seed,
  major: JACKPOTS.major.seed,
  kingpin: JACKPOTS.kingpin.seed,
});

/** À chaque tour payant, chaque cagnotte grossit un peu. */
export const growPools = (p: Pools): Pools => ({
  mini: p.mini + JACKPOTS.mini.growth,
  minor: p.minor + JACKPOTS.minor.growth,
  major: p.major + JACKPOTS.major.growth,
  kingpin: p.kingpin + JACKPOTS.kingpin.growth,
});

/** Remet une cagnotte à sa valeur de départ après un gain. */
export const resetPool = (p: Pools, tier: JackpotTier): Pools => ({ ...p, [tier]: JACKPOTS[tier].seed });

/** Relit des cagnottes sauvegardées en vérifiant qu'elles sont valides. */
export function sanitizePools(raw: unknown): Pools {
  const base = freshPools();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  for (const t of JACKPOT_TIERS) {
    const v = r[t];
    if (typeof v === "number" && Number.isFinite(v) && v >= JACKPOTS[t].seed) base[t] = v;
  }
  return base;
}

/*
 * The casino floor: the pools also grow with time, as if other players were
 * spinning (one small step every few seconds, up to an hour's worth). The
 * growth is folded into the saved pools at the next paid spin.
 */
const NET_KEY = "royalace:jp-net";
export const NET_STEP_MS = 4000;
const NET_MAX_STEPS = 900;
function netAt(): number {
  try {
    const v = Number(localStorage.getItem(NET_KEY));
    if (Number.isFinite(v) && v > 0) return v;
    const now = Date.now();
    localStorage.setItem(NET_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}
const netSteps = (now: number) => Math.min(NET_MAX_STEPS, Math.max(0, Math.floor((now - netAt()) / NET_STEP_MS)));
/** The pools as they stand now, the floor's growth included. */
export function livePools(p: Pools, now = Date.now()): Pools {
  const k = netSteps(now);
  if (!k) return p;
  return {
    mini: p.mini + JACKPOTS.mini.growth * k,
    minor: p.minor + JACKPOTS.minor.growth * k,
    major: p.major + JACKPOTS.major.growth * k,
    kingpin: p.kingpin + JACKPOTS.kingpin.growth * k,
  };
}
/** Folds the floor's growth into the pools (and restarts its clock). */
export function foldLive(p: Pools, now = Date.now()): Pools {
  const out = livePools(p, now);
  try {
    localStorage.setItem(NET_KEY, String(now));
  } catch {}
  return out;
}
