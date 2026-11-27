import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Chrysonyx",
    short_name: "Chrysonyx",
    description: "A free casino with virtual chips: slots, blackjack, roulette, poker and sports. No real money.",
    lang: "en",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    display_override: ["fullscreen", "standalone"],
    orientation: "any",
    background_color: "#080808",
    theme_color: "#0b100e",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Blackjack", url: "/#blackjack", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Sports betting", short_name: "Sports", url: "/#sports", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Penalty", url: "/#penalty", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Roulette", url: "/#roulette", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
