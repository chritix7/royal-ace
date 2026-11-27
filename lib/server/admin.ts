import type { User } from "./account";

/** Owner accounts (by sign-in e-mail), from the ADMIN_EMAILS env var, comma-separated. Server only. */
export const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (u: User | null | undefined) => !!u?.email && adminEmails().includes(u.email.toLowerCase());
