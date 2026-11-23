import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Royal Ace",
    short_name: "Royal Ace",
    description: "Une salle de jeu virtuelle privée — jetons virtuels uniquement",
    lang: "fr",
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
      { name: "Paris sportifs", short_name: "Paris", url: "/#sports", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Penalty", url: "/#penalty", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Roulette", url: "/#roulette", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
