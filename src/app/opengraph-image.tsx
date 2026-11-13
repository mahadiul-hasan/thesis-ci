import { ImageResponse } from "next/og";
import { getSnapshot } from "@/lib/snapshot";
import { evaluateAll, summarise } from "@/lib/claims";

export const runtime = "nodejs";
export const alt = "thesis-ci — the NEAR thesis, as a test suite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function usd(n: number | null): string {
  if (n === null) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/**
 * The card that shows up when someone pastes the link into X.
 * Built from the live snapshot, so it can never drift from the site.
 */
export default async function OpengraphImage() {
  const snapshot = getSnapshot();
  const claims = evaluateAll(snapshot);
  const s = summarise(claims);
  const m = snapshot.metrics;

  const settled = usd(m.intents_volume_1y?.value ?? null);
  const captured = usd(m.chain_fees_1y?.value ?? null);
  const takeRate = (m.take_rate_bps?.value ?? 0).toFixed(2);

  const stat = (label: string, value: string, color: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 15, letterSpacing: 2.5, color: "#6d6b64" }}>{label}</div>
      <div style={{ fontSize: 44, letterSpacing: -1.5, color }}>{value}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08090a",
          color: "#e9e7e2",
          padding: "58px 68px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#d9ff63",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 17,
            letterSpacing: 3,
            color: "#6d6b64",
          }}
        >
          <div style={{ display: "flex" }}>THESIS-CI</div>
          <div style={{ display: "flex" }}>NEAR HACKATHON · INVESTMENT THESIS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 78, lineHeight: 1.02, letterSpacing: -3 }}>
            The NEAR thesis,
          </div>
          <div style={{ fontSize: 78, lineHeight: 1.02, letterSpacing: -3, color: "#d9ff63" }}>
            as a test suite.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", gap: 64 }}>
            {stat("INTENTS SETTLED · 12M", settled, "#7fe0a1")}
            {stat("FEES CAPTURED · 12M", captured, "#ff6f5e")}
            {stat("TAKE RATE", `${takeRate} bps`, "#ff6f5e")}
            {stat("CLAIMS HOLDING", `${s.pass} / ${s.total}`, "#e9e7e2")}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(232,230,225,0.18)",
              paddingTop: 20,
              fontSize: 17,
              color: "#a6a39b",
            }}
          >
            <div style={{ display: "flex" }}>
              Falsifiable claims · SHA-256 fingerprinted sources · one command to reproduce
            </div>
            <div style={{ display: "flex", color: "#6d6b64" }}>
              {snapshot.hash.slice(0, 12)}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
