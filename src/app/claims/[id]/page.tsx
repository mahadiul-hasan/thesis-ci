import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { Nav, Footer } from "@/components/Chrome";
import { StatusPill, STATUS_COLOR } from "@/components/StatusPill";
import { getSnapshot } from "@/lib/snapshot";
import { CLAIMS, evaluateClaim } from "@/lib/claims";
import { formatMetric, formatDateTime, shortHash } from "@/lib/format";
import type { MetricUnit } from "@/lib/types";

export function generateStaticParams() {
  return CLAIMS.map((c) => ({ id: c.id }));
}

const GROUP_LABEL: Record<string, string> = {
  flow: "Flow",
  capture: "Capture",
  depth: "Depth",
  decentralisation: "Decentralisation",
  build: "Build",
};

function fmtInput(v: number | string | null): string {
  if (v === null) return "—";
  if (typeof v === "string") return v;
  const a = Math.abs(v);
  if (a >= 1e9) return `${(v / 1e9).toFixed(3)}B`;
  if (a >= 1e6) return `${(v / 1e6).toFixed(3)}M`;
  if (a >= 1e3) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return v.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = CLAIMS.find((c) => c.id === id);
  if (!claim) notFound();

  const snapshot = getSnapshot();
  const evaluated = evaluateClaim(claim, snapshot);
  const metric = snapshot.metrics[claim.metricId];
  const unit: MetricUnit = metric?.unit ?? "count";
  const source = snapshot.sources.find((s) => s.id === metric?.sourceId);
  const color = STATUS_COLOR[evaluated.status];

  const idx = CLAIMS.findIndex((c) => c.id === claim.id);
  const prev = CLAIMS[idx - 1];
  const next = CLAIMS[idx + 1];

  const pct =
    evaluated.value === null || claim.threshold === 0
      ? 0
      : Math.max(
          0.02,
          Math.min(
            1,
            (claim.comparator === ">" || claim.comparator === ">="
              ? evaluated.value / claim.threshold
              : claim.threshold / evaluated.value) || 0,
          ),
        );

  return (
    <>
      <Nav active="/" />

      <main className="shell" style={{ paddingTop: 44 }}>
        <Link href="/" className="backlink">
          ← All claims
        </Link>

        <div style={{ marginTop: 26 }} className="detail-grid">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <span className="eyebrow">
                {claim.index} · {GROUP_LABEL[claim.group] ?? claim.group}
              </span>
              <StatusPill status={evaluated.status} />
              <span className="eyebrow">Deadline {claim.deadline}</span>
            </div>

            <h1 className="big-claim">{claim.claim}</h1>

            {/* measurement */}
            <div
              className="card"
              style={{ marginTop: 30, padding: "22px 24px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    Measured
                  </div>
                  <div
                    className="num"
                    style={{ fontSize: 34, color, letterSpacing: "-0.03em" }}
                  >
                    {formatMetric(evaluated.value, unit)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    Required
                  </div>
                  <div className="num" style={{ fontSize: 20, color: "var(--ink-dim)" }}>
                    {claim.thresholdLabel}
                  </div>
                </div>
              </div>

              <div className="claim-bar" style={{ marginTop: 20, height: 4 }}>
                <i style={{ width: `${pct * 100}%`, background: color }} />
              </div>

              <div
                className="mono"
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span>
                  {evaluated.headroom === null
                    ? "not comparable"
                    : `${evaluated.headroom > 0 ? "+" : ""}${evaluated.headroom}% headroom`}
                </span>
                <span>weight {claim.weight} / 3</span>
              </div>
            </div>

            {/* argument */}
            <div style={{ marginTop: 34 }} className="stack-22">
              <div>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  Why an investor should care
                </div>
                <p className="prose">{claim.why}</p>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  Kill criterion — what would prove this wrong
                </div>
                <p className="prose" style={{ color: "var(--ink)" }}>
                  {claim.kill}
                </p>
              </div>
            </div>

            {/* arithmetic */}
            <div style={{ marginTop: 40 }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                How this number is made
              </div>
              <div className="code" style={{ marginBottom: 14 }}>
                {metric?.method ?? "no method recorded"}
              </div>
              <div className="kv" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                {Object.entries(metric?.inputs ?? {}).map(([k, v]) => (
                  <Fragment key={k}>
                    <span className="k">{k.replace(/_/g, " ")}</span>
                    <span className="v">{fmtInput(v)}</span>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* sidebar: provenance */}
          <aside className="stack-22">
            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                Provenance
              </div>
              <div className="kv">
                <span className="k">source</span>
                <span className="v" style={{ fontSize: 12 }}>
                  {source?.label ?? "—"}
                </span>
                <span className="k">fetched</span>
                <span className="v" style={{ fontSize: 12 }}>
                  {source ? formatDateTime(source.fetchedAt) : "—"}
                </span>
                <span className="k">http</span>
                <span className="v" style={{ fontSize: 12 }}>
                  {source?.httpStatus ?? "—"}
                </span>
                <span className="k">bytes</span>
                <span className="v" style={{ fontSize: 12 }}>
                  {source ? source.bytes.toLocaleString("en-US") : "—"}
                </span>
                <span className="k">sha-256</span>
                <span className="v" style={{ fontSize: 11, wordBreak: "break-all" }}>
                  {source ? shortHash(source.sha256, 18) : "—"}
                </span>
                <span className="k">snapshot</span>
                <span className="v" style={{ fontSize: 11 }}>
                  {snapshot.hash.slice(0, 18)}
                </span>
                <span className="k">block</span>
                <span className="v" style={{ fontSize: 12 }}>
                  {snapshot.chain.blockHeight.toLocaleString("en-US")}
                </span>
              </div>

              {source ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn"
                  style={{ marginTop: 18, width: "100%", justifyContent: "center" }}
                >
                  Open raw source ↗
                </a>
              ) : null}
            </div>

            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                Re-run this claim
              </div>
              <div className="code">
                <span className="c">$</span> npm run reproduce
                <br />
                <span className="c"># refetches every source,</span>
                <br />
                <span className="c"># recomputes, diffs the hash</span>
              </div>
              <Link
                href="/reproduce"
                className="backlink"
                style={{ display: "inline-block", marginTop: 14 }}
              >
                See the run log →
              </Link>
            </div>

            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                Navigate
              </div>
              <div className="stack-8">
                {prev ? (
                  <Link href={`/claims/${prev.id}`} className="backlink" style={{ display: "block" }}>
                    ← {prev.index} {prev.title}
                  </Link>
                ) : null}
                {next ? (
                  <Link href={`/claims/${next.id}`} className="backlink" style={{ display: "block" }}>
                    {next.index} {next.title} →
                  </Link>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer hash={snapshot.hash} />
    </>
  );
}
