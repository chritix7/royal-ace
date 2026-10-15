/**
 * Petit bus d'événements : les jeux annoncent ce qui se passe (un spin, une main gagnée...)
 * et les missions écoutent. Ainsi les jeux ne connaissent pas les missions.
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
  | "bjCorrect"; // une décision conforme à la stratégie de base

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