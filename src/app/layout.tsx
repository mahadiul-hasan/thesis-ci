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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
