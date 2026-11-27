import type { Metadata, Viewport } from "next";
import { Cinzel, Geist, Geist_Mono, UnifrakturMaguntia, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import { SITE } from "../lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for the wordmark, panel titles, dealer calls and the
// court cards: engraved Roman capitals. Used through the `font-display`
// class (see globals.css).
const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
});

// Fallback blackletter for the dealer shoe's "CHRYSONYX" wordmark.
// Drop a Cloister Black .woff2 into /public/fonts/ and add an @font-face
// in globals.css if you want the real Cloister Black — the component's
// font stack lists it first and falls back to this one.
const unifrakturMaguntia = UnifrakturMaguntia({
  variable: "--font-blackletter",
  weight: "400",
  subsets: ["latin"],
});

// Futuristic console face for the "READY" status line on the shoe LCD.
const shareTechMono = Share_Tech_Mono({
  variable: "--font-tech-mono",
  weight: "400",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Chrysonyx is a free online casino with virtual chips: slot machines, blackjack, roulette, Hold'em poker, craps, penalty shoot-out and sports betting on real matches. No sign-up, no real money. 18+.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Chrysonyx · Free casino with virtual chips", template: "%s · Chrysonyx" },
  description: DESCRIPTION,
  applicationName: "Chrysonyx",
  verification: { google: "2StTLGlxR5b6XE8JepRdQzfzF2YKVJvat8g8iZfVOo4" },
  keywords: ["free casino", "social casino", "free slots", "blackjack", "roulette", "poker", "virtual chips", "casino gratuit", "machine à sous gratuite"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Chrysonyx",
    title: "Chrysonyx · Your free casino",
    description: "Slots, blackjack, roulette, poker and sports betting with virtual chips. 100% free, no sign-up, no real money.",
    url: "/",
    locale: "en_US",
    alternateLocale: ["fr_FR"],
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Chrysonyx: the Royal Bells slot machine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chrysonyx · Your free casino",
    description: "Slots, blackjack, roulette, poker and sports betting with virtual chips. 100% free, no real money.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Chrysonyx",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b100e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${unifrakturMaguntia.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Splash when launched from the home screen: the crest on black,
            gone after a moment (CSS only, nothing to load). */}
        <div className="app-splash" aria-hidden="true">
          <img src="/icon-192.png" alt="" width={96} height={96} loading="lazy" decoding="async" />
          <span>CHRYSONYX</span>
        </div>
        {children}
        <ServiceWorkerRegistrar />
        <PwaInstallBanner />
      </body>
    </html>
  );
}
