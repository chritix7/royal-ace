export type Achievement = { id: string; title: string; desc: string };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "bj", title: "Natural", desc: "Get a blackjack" },
  { id: "streak5", title: "Hot streak", desc: "Win 5 rounds in a row" },
  { id: "double", title: "Double trouble", desc: "Win a doubled hand" },
  { id: "split", title: "Split decision", desc: "Win a hand after a split" },
  { id: "pair", title: "Seeing double", desc: "Win a Perfect Pairs bet" },
  { id: "suited", title: "Lucky 21+3", desc: "Win a 21+3 bet" },
  { id: "sharp", title: "Sharp mind", desc: "10 correct decisions in a row" },
  { id: "rich", title: "High roller", desc: "Reach ◈ 10,000" },
];