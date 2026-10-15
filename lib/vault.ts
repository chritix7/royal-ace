import { JACKPOT_TIERS, freshPools, growPools, resetPool, type JackpotTier, type Pools } from "./jackpot";
import { mulberry32 } from "./slots";

/**
 * Bonus « Le coffre » : 12 mallettes, tu en ouvres 3. Chacune contient des chips (multiple de la mise)
 * ou une cagnotte jackpot. C'est le seul moyen de gagner un jackpot.
 */
export const VAULT_CASES = 12;
export const VAULT_PICKS = 3;
/** Chance par tour payant de déclencher le coffre. */
export const VAULT_TRIGGER = 1 / 250;

export type VaultPrize = { kind: "coins"; mult: number } | { kind: "jackpot"; tier: JackpotTier };

/** Chance qu'une mallette contienne chaque jackpot. */
export const CASE_JACKPOT: Record<JackpotTier, number> = { mini: 0.164, minor: 0.0215, major: 0.00167, kingpin: 0.0000833 };
/** Mallettes de chips : [multiple de la mise, poids]. */
export const COIN_TABLE: [number, number][] = [
  [0.5, 30], [1, 25], [1.5, 16], [2, 12], [3, 8], [5, 5], [8, 3], [15, 1],
];
const COIN_WEIGHT = COIN_TABLE.reduce((a, [, w]) => a + w, 0);

export function drawPrize(rng: () => number): VaultPrize {
  let r = rng();
  for (const tier of JACKPOT_TIERS) {
    if (r < CASE_JACKPOT[tier]) return { kind: "jackpot", tier };
    r -= CASE_JACKPOT[tier];
  }
  let w = rng() * COIN_WEIGHT;
  for (const [mult, weight] of COIN_TABLE) {
    if (w < weight) return { kind: "coins", mult };
    w -= weight;
  }
  return { kind: "coins", mult: COIN_TABLE[0][0] };
}

export const drawVault = (rng: () => number): VaultPrize[] => Array.from({ length: VAULT_CASES }, () => drawPrize(rng));

export const prizeValue = (prize: VaultPrize, pools: Pools, bet: number) =>
  prize.kind === "coins" ? prize.mult * bet : Math.round(pools[prize.tier] * bet);

export function settleVault(prizes: VaultPrize[], picks: number[], pools: Pools, bet: number) {
  const items = picks.map((index) => ({ index, prize: prizes[index], value: prizeValue(prizes[index], pools, bet) }));
  return {
    items,
    total: items.reduce((a, i) => a + i.value, 0),
    jackpots: items.flatMap((i) => (i.prize.kind === "jackpot" ? [i.prize.tier] : [])),
  };
}

/** Simule `spins` tours payants : retour des chips du coffre et des jackpots (cagnottes comprises). */
export function simulateVault(spins: number, seed = 1) {
  const rng = mulberry32(seed);
  let pools = freshPools();
  let coin = 0, jackpot = 0, vaults = 0;
  const wins: Record<JackpotTier, number> = { mini: 0, minor: 0, major: 0, kingpin: 0 };
  for (let i = 0; i < spins; i++) {
    pools = growPools(pools);
    if (rng() >= VAULT_TRIGGER) continue;
    vaults++;
    const prizes = drawVault(rng);
    // le joueur ouvre 3 mallettes différentes au hasard
    const order = Array.from({ length: VAULT_CASES }, (_, k) => k).sort(() => rng() - 0.5).slice(0, VAULT_PICKS);
    const res = settleVault(prizes, order, pools, 1);
    for (const it of res.items) {
      if (it.prize.kind === "coins") coin += it.value;
      else jackpot += it.value;
    }
    for (const t of res.jackpots) {
      wins[t]++;
      pools = resetPool(pools, t);
    }
  }
  return {
    rtp: (coin + jackpot) / spins,
    coinRtp: coin / spins,
    jackpotRtp: jackpot / spins,
    vaultEvery: vaults ? spins / vaults : Infinity,
    jackpotEvery: Object.fromEntries(JACKPOT_TIERS.map((t) => [t, wins[t] ? spins / wins[t] : Infinity])) as Record<JackpotTier, number>,
  };
}