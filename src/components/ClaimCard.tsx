import Link from "next/link";
import { formatMetric } from "@/lib/format";
import type { EvaluatedClaim, MetricUnit } from "@/lib/types";
import { StatusPill, STATUS_COLOR } from "./StatusPill";

const GROUP_LABEL: Record<string, string> = {
  flow: "Flow",
  capture: "Capture",
  depth: "Depth",
  decentralisation: "Decentralisation",
  build: "Build",
};

/**
 * How close the metric is to clearing its bar, as 0..1.
 * For "greater than" claims the bar is the threshold; for "less than" claims
 * we invert so a smaller number reads as further along.
 */
function progress(claim: EvaluatedClaim): number {
  if (claim.value === null || claim.threshold === 0) return 0;
  const raw =
    claim.comparator === ">" || claim.comparator === ">="
      ? claim.value / claim.threshold
      : claim.threshold / claim.value;
  if (!Number.isFinite(raw)) return 1;
  return Math.max(0.02, Math.min(1, raw));
}

export function ClaimCard({
  claim,
  unit,
}: {
  claim: EvaluatedClaim;
  unit: MetricUnit;
}) {
  const pct = progress(claim);
  const color = STATUS_COLOR[claim.status];

  return (
    <Link href={`/claims/${claim.id}`} className="claim" data-status={claim.status}>
      <div className="claim-top">
        <span className="claim-idx">
          {claim.index} · {GROUP_LABEL[claim.group] ?? claim.group}
        </span>
        <StatusPill status={claim.status} />
      </div>

      <h3 className="claim-title">{claim.title}</h3>
      <p className="claim-statement">{claim.claim}</p>

      <div className="claim-measure">
        <span className="claim-val" style={{ color }}>
          {formatMetric(claim.value, unit)}
        </span>
        <span className="claim-vs">vs {claim.thresholdLabel}</span>
      </div>

      <div className="claim-bar" aria-hidden>
        <i style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </Link>
  );
}
