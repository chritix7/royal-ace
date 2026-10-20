import { useEffect, useState } from "react";

export function useBalanceFlash() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const onFlash = () => {
      setFlash(false);
      requestAnimationFrame(() => setFlash(true));
      const t = window.setTimeout(() => setFlash(false), 650);
      return () => window.clearTimeout(t);
    };

    window.addEventListener("balance-flash", onFlash);
    return () => window.removeEventListener("balance-flash", onFlash);
  }, []);

  return flash;
}