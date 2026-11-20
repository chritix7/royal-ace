/**
 * Petit bus d'événements : les jeux annoncent ce qui se passe (un spin, une main gagnée...)
 * et les missions/succès écoutent. Ainsi les jeux ne connaissent pas les récompenses.
 */
export type GameEvent =
  | "spin" // un tour payant à la machine
  | "slotWin" // un tour gagnant
  | "bigWin" // un gain d'au moins 20 fois la mise
  | "bonus" // free spins déclenchés ou achetés
  | "vault" // le coffre s'ouvre
  | "jackpot" // un jackpot gagné
  | "wildExpand" // le Boss s'étend sur un rouleau
  | "respin" // un re-spin déclenché
  | "gambleWin" // un gamble gagné
  | "bjHand" // une main de blackjack jouée
  | "bjWin" // une main de blackjack gagnée
  | "bjBlackjack" // un blackjack naturel
  | "bjDouble" // un double gagné
  | "bjSplit" // une main splittée gagnée
  | "bjCorrect" // une décision conforme à la stratégie de base
  | "bjMistake" // une décision contraire à la stratégie de base
  | "pairWin" // un Perfect Pairs gagné
  | "suitedWin" // un 21+3 gagné
  | "bjStreak" // série actuelle de manches gagnées
  | "rouletteSpin" // un tour de roulette joué
  | "rouletteWin" // un tour de roulette gagnant
  | "rouletteStraight" // un numéro plein touché
  | "rouletteZero" // gagné avec le zéro
  | "rouletteLightning" // un multiplicateur Lightning touché
  | "rouletteBigWin" // un gain d'au moins 10 fois la mise
  | "pokerHand" // une main de Casino Hold'em jouée
  | "pokerWin" // une main de Casino Hold'em gagnée
  | "pokerBonus" // un AA Bonus payé
  | "pokerFlush" // couleur ou mieux en main finale (main suivie)
  | "pokerBigWin" // un gain d'au moins 10 fois l'Ante
  | "crapsRoll" // un lancer de dés au craps
  | "crapsWin" // un lancer gagnant au craps
  | "crapsPoint" // un point gagné avec une mise Pass
  | "crapsHard" // un hardway gagné
  | "crapsBigWin" // une mise payée au moins 10 contre 1
  | "penaltyRound" // une série de penalties jouée
  | "penaltyGoal" // des buts marqués (amount = nombre)
  | "penaltyCashout" // un cash-out gagnant
  | "penaltyBigWin" // un cash-out après au moins 4 buts (×15.36)
  | "penaltyPerfect" // 5 buts sur 5
  | "betPlaced" // un ticket de paris sportifs validé
  | "betCombo" // un combiné d'au moins 3 sélections validé
  | "betLive" // un pari pris en direct
  | "betWon" // un ticket gagnant
  | "betComboWon" // un combiné d'au moins 3 sélections gagnant
  | "betBigWin" // un ticket gagnant à cote 10 ou plus
  | "betCashout"; // un cash-out sur un ticket

type Listener = (event: GameEvent, amount: number) => void;
const listeners = new Set<Listener>();

export function track(event: GameEvent, amount = 1) {
  if (amount <= 0) return;
  listeners.forEach((l) => l(event, amount));
}

export function onEvent(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
