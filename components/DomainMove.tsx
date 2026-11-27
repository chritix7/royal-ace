"use client";

import { useEffect, useState } from "react";
import { cloud } from "../lib/cloud";
import { DOMAIN, OLD_HOST } from "../lib/domain";

const MOVED = "ra-moved";

/**
 * Royal Ace moved to its own domain. Progress lives in the browser, per
 * address, so the old address packs the save into the link (after the #,
 * never sent to a server) and the new one unpacks it once.
 */
export default function DomainMove() {
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    if (location.hostname === OLD_HOST) {
      setMoving(true);
      cloud
        .exportCode()
        .then((code) => location.replace(`https://${DOMAIN}/#move=${code}`))
        .catch(() => location.replace(`https://${DOMAIN}/`));
      return;
    }
    if (!location.hash.startsWith("#move=")) return;
    const code = location.hash.slice(6);
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch {}
    try {
      if (localStorage.getItem(MOVED)) return;
      localStorage.setItem(MOVED, "1");
    } catch {
      return;
    }
    setMoving(true);
    cloud.importCode(code).then((ok) => {
      if (!ok) setMoving(false);
    });
  }, []);
  if (!moving) return null;
  return (
    <div className="age-gate" role="status" translate="no">
      <div className="age-gate__card">
        <p className="font-display gold-text text-xl font-bold">Royal Ace</p>
        <p className="mt-2 text-sm text-white/70">Moving to {DOMAIN} with your chips and progress…</p>
      </div>
    </div>
  );
}
