import type { Metadata } from "next";
import { DemoPlayer } from "@/components/DemoPlayer";
import { getSnapshot } from "@/lib/snapshot";
import "./demo.css";

export const metadata: Metadata = {
  title: "thesis-ci — demo player",
  robots: { index: false, follow: false },
};

/**
 * A recording aid, not a product page: it walks the real site in the order of
 * the DEMO.md shot list so the video can be captured in one clean take.
 */
export default function DemoPage() {
  const snapshot = getSnapshot();
  return <DemoPlayer hash={snapshot.hash} />;
}
