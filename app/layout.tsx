import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, UnifrakturMaguntia, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fallback blackletter for the dealer shoe's "ROYAL ACE" wordmark.
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

export const metadata: Metadata = {
  title: "Royal Ace",
  description: "A private virtual game room",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Royal Ace",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b100e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${unifrakturMaguntia.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
