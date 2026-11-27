import { DOMAIN } from "./domain";

/** Server only: the site's base URL. Previews keep their own URL. */
export const SITE =
  process.env.VERCEL_ENV === "production"
    ? `https://${DOMAIN}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
