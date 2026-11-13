import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "thesis-ci — the NEAR thesis, as a test suite",
  description:
    "Fourteen falsifiable claims about NEAR, computed from raw on-chain data, hashed, and reproducible with one command.",
  openGraph: {
    title: "thesis-ci — the NEAR thesis, as a test suite",
    description:
      "Fourteen falsifiable claims about NEAR. Every number hashed and re-runnable.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "thesis-ci — the NEAR thesis, as a test suite",
    description:
      "$32.93B settled, $1.15M captured, 0.35 bps take rate. 4 of 14 claims hold.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
