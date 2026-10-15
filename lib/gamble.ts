/**
 * Gamble : après un gain, tu peux le doubler en devinant la couleur d'une carte (rouge ou noir).
 * C'est un pile ou face équitable : une chance sur deux de doubler, une sur deux de tout perdre.
 */
export type CardColor = "red" | "black";
export const GAMBLE_MAX_ROUNDS = 3;
/** Le gamble n'est proposé que pour des gains jusqu'à ce multiple de la mise. */
export const GAMBLE_MAX_MULT = 50;
export const SUITS: Record<CardColor, string[]> = { red: ["♥", "♦"], black: ["♠", "♣"] };

export function canGamble(total: number, bet: number, bonusOrVault: boolean) {
  return total > 0 && !bonusOrVault && total <= GAMBLE_MAX_MULT * bet;
}

/** Tire une carte : renvoie sa couleur, sa famille, et si le joueur a deviné juste. */
export function drawGambleCard(rng: () => number, guess: CardColor) {
  const color: CardColor = rng() < 0.5 ? "red" : "black";
  const suits = SUITS[color];
  return { color, suit: suits[Math.floor(rng() * suits.length)], won: color === guess };
}