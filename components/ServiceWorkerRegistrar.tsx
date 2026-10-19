"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const cleanup = async () => {
      try {
        const registrations =
          await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );

        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.map((name) => caches.delete(name)));
        }
      } catch (error) {
        console.error("Service worker cleanup failed", error);
      }
    };

    if (document.readyState === "complete") {
      cleanup();
    } else {
      window.addEventListener("load", cleanup, { once: true });
      return () => window.removeEventListener("load", cleanup);
    }
  }, []);

  return null;
}