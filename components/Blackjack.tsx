"use client";

import { useBlackjack } from "../lib/useBlackjack";
import Sidebar from "./Sidebar";
import Table from "./Table";

export default function Blackjack({ active = true }: { active?: boolean }) {
  const g = useBlackjack(active);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
      <Table g={g} />
      <Sidebar g={g} />
    </div>
  );
}