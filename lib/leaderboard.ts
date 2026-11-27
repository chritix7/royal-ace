import { useSyncExternalStore } from "react";
import { MAX_BATCH, toRound, type Round } from "./board";
import { onRound } from "./career";
import { cloud } from "./cloud";
import { wallet } from "./wallet";

/**
 * The real weekly ranking: every settled round of a signed-in player is
 * queued here and sent to /api/board in small batches. The queue lives
 * outside the cloud save (its key has no "royalace:" prefix) so a restore
 * on another device never sends the same rounds twice.
 */
export type BoardRow = { pos: number; name: string; score: number; you: boolean; founder?: boolean };
export type BoardMe = { rank: number; score: number; rounds: number; status: "ok" | "review" | "hidden" };
export type ReviewRow = { uid: string; name: string; score: number; rounds: number; why: string };
export type BoardState = {
  loaded: boolean;
  loading: boolean;
  error: boolean;
  week: string;
  ends: number;
  total: number;
  rows: BoardRow[];
  me: BoardMe | null;
  admin: boolean;
  review: ReviewRow[];
};

const QKEY = "chrysonyx:lb-queue";
const MAX_QUEUE = 600;
let state: BoardState = { loaded: false, loading: false, error: false, week: "", ends: 0, total: 0, rows: [], me: null, admin: false, review: [] };
const listeners = new Set<() => void>();
const set = (p: Partial<BoardState>) => {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
};

let queue: Round[] = [];
let started = false;
let sending = false;
let lastRefresh = 0;

const save = () => {
  try {
    localStorage.setItem(QKEY, JSON.stringify(queue));
  } catch {}
};

async function flush(keepalive = false) {
  if (sending || !queue.length || !cloud.get().linked) return;
  sending = true;
  const batch = queue.slice(0, MAX_BATCH);
  try {
    const r = await fetch("/api/board", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "report", rounds: batch }),
      keepalive,
    });
    // Sent (or refused for good): drop the batch. Keep it on network/server trouble.
    if (r.ok || r.status === 400 || r.status === 413) {
      queue = queue.slice(batch.length);
      save();
    } else if (r.status === 401) {
      queue = [];
      save();
    }
  } catch {
  } finally {
    sending = false;
  }
  if (!keepalive && queue.length >= MAX_BATCH) void flush();
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch("/api/board", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const d = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(d.error || "unavailable");
  return d;
}

export const board = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Once, in the browser. */
  start() {
    if (started || typeof window === "undefined") return;
    started = true;
    try {
      const q = JSON.parse(localStorage.getItem(QKEY) || "[]");
      if (Array.isArray(q)) queue = q.slice(-MAX_QUEUE);
    } catch {}
    onRound((game, wagered, net) => {
      if (!cloud.get().linked) return;
      const r = toRound(game, wagered, net);
      if (!r) return;
      queue.push(r);
      if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
      save();
      if (queue.length >= 40) void flush();
    });
    window.setInterval(() => void flush(), 20_000);
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && void flush(true));
    window.addEventListener("pagehide", () => void flush(true));
  },
  /** soft: skip if refreshed in the last minute (the lobby calls it on every visit). */
  async refresh(soft = false) {
    if (soft && Date.now() - lastRefresh < 60_000) return;
    lastRefresh = Date.now();
    set({ loading: true });
    await flush();
    try {
      const r = await fetch("/api/board", { cache: "no-store" });
      const d = (await r.json()) as Partial<BoardState> & { review?: ReviewRow[] };
      set({ loaded: true, loading: false, error: !r.ok, week: d.week ?? "", ends: d.ends ?? 0, total: d.total ?? 0, rows: d.rows ?? [], me: d.me ?? null, admin: !!d.admin, review: d.review ?? [] });
    } catch {
      set({ loaded: true, loading: false, error: true });
    }
  },
  /** Admin only: chips for the admin's own wallet. Logged on the server, never counted in the ranking. */
  async grant(amount: number) {
    const r = await post<{ amount: number }>({ op: "grant", amount });
    wallet.add(r.amount);
    return r.amount;
  },
  async review(uid: string, action: "approve" | "hide") {
    await post({ op: "review", uid, action });
    await board.refresh();
  },
};

export const useBoard = () => useSyncExternalStore(board.subscribe, board.get, () => state);
