import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { BagProvider } from "@/components/Bag";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const font = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font" });

export const metadata: Metadata = {
  title: "Tintashift — Wearable Beauty Technology",
  description: "Colour-changing smart press-on nails, powered by the TINTAShifter. Live in colour.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <head>
        {/* the first hero picture: start fetching it before any script runs */}
        {["device", "device-m", "si001", "si001-m"].map((f) => <link key={f} rel="preload" as="image" type="image/webp" href={`/hero/${f}.webp`} />)}
      </head>
      <body>
        <BagProvider>{children}</BagProvider>
        {/* real-visitor numbers in the Vercel dashboard: page views, and how fast the page loads and responds */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
