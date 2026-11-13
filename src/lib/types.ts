/**
 * Core data model for Thesis CI.
 *
 * Everything the app renders is derived from a Snapshot: a frozen, hashed
 * bundle of raw source payloads plus the metrics computed from them.
 * A snapshot is the unit of reproducibility.
 */

export type SourceRef = {
  id: string;
  label: string;
  url: string;
  fetchedAt: string;
  httpStatus: number;
  bytes: number;
  /** sha256 of the exact response body we received. */
  sha256: string;
};

export type MetricUnit =
  | "usd"
  | "usd-per-year"
  | "pct"
  | "bps"
  | "multiple"
  | "count"
  | "near"
  | "usd-per-tx";

export type Metric = {
  id: string;
  label: string;
  value: number | null;
  unit: MetricUnit;
  /** Source the number ultimately comes from. */
  sourceId: string;
  /** Human readable formula, so a reader can audit the arithmetic. */
  method: string;
  /** The exact inputs used by the formula. */
  inputs: Record<string, number | string | null>;
  asOf: string;
};

export type SeriesPoint = { t: number; v: number };

export type Snapshot = {
  id: string;
  generatedAt: string;
  chain: {
    name: "mainnet";
    blockHeight: number;
    protocolVersion: number;
  };
  sources: SourceRef[];
  metrics: Record<string, Metric>;
  series: Record<string, SeriesPoint[]>;
  /** sha256 over the canonicalised {chain, metrics, sources} payload. */
  hash: string;
  hashBasis: string;
};

export type ClaimStatus = "pass" | "fail" | "watch" | "too-early";

export type ClaimGroup = "flow" | "capture" | "depth" | "decentralisation" | "build";

export type Claim = {
  id: string;
  index: string;
  title: string;
  /** The falsifiable statement. Must be checkable against a metric. */
  claim: string;
  /** Why an investor should care. */
  why: string;
  /** What would prove this claim wrong. */
  kill: string;
  metricId: string;
  comparator: ">" | ">=" | "<" | "<=";
  threshold: number;
  thresholdLabel: string;
  deadline: string;
  weight: 1 | 2 | 3;
  group: ClaimGroup;
  /** Set when the claim cannot be settled yet regardless of the number. */
  premature?: boolean;
};

export type EvaluatedClaim = Claim & {
  status: ClaimStatus;
  value: number | null;
  /** Distance from threshold, normalised. >0 means meeting the bar. */
  headroom: number | null;
};
