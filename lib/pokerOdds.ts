import { freshDeck, settle } from "./poker";
import type { Card } from "./blackjack";

/**
 * Odds of the hand at the flop, by simulation: the turn, the river and the
 * dealer's two cards are drawn many times from the cards left. Gives the
 * chance to win, tie or lose a called hand (a dealer who does not qualify
 * counts as a win), and the value of calling in Antes, against −1 for folding.
 */
export type HandOdds = { win: number; tie: number; lose: number; nq: number; callEv: number; samples: number };

const same = (a: Card, b: Card) => a.rank === b.rank && a.suit === b.suit;

export function handOdds(player: Card[], flop: Card[], samples = 1200): HandOdds {
  const known = [...player, ...flop];
  const rest = freshDeck().filter((c) => !known.some((k) => same(k, c)));
  let win = 0;
  let tie = 0;
  let lose = 0;
  let nq = 0;
  let ev = 0;
  const n = rest.length;
  const pick = [0, 0, 0, 0];
  for (let s = 0; s < samples; s++) {
    // Four distinct cards: turn, river, two for the dealer.
    for (let i = 0; i < 4; i++) {
      let r: number;
      do r = Math.floor(Math.random() * n);
      while (pick.slice(0, i).includes(r));
      pick[i] = r;
    }
    const board = [...flop, rest[pick[0]], rest[pick[1]]];
    const dealer = [rest[pick[2]], rest[pick[3]]];
    const st = settle({ ante: 1, bonus: 0 }, true, player, dealer, board);
    if (st.outcome === "win") win++;
    else if (st.outcome === "noQualify") {
      win++;
      nq++;
    } else if (st.outcome === "push") tie++;
    else lose++;
    ev += st.returned - st.staked;
  }
  return { win: win / samples, tie: tie / samples, lose: lose / samples, nq: nq / samples, callEv: ev / samples, samples };
}
