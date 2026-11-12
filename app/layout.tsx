import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { BagProvider } from "@/components/Bag";

const font = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font" });

export const metadata: Metadata = {
  title: "Tintashift — Wearable Beauty Technology",
  description: "Colour-shifting smart press-on nails. One wand, six shades. Live in colour.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body><BagProvider>{children}</BagProvider></body>
    </html>
  );
}
