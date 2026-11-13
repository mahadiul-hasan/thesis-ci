import type { MetricUnit } from "./types";

const usd = (n: number, digits = 2): string => {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(digits)}K`;
  return `$${n.toFixed(digits)}`;
};

export function formatMetric(value: number | null, unit: MetricUnit): string {
  if (value === null || Number.isNaN(value)) return "—";
  switch (unit) {
    case "usd":
      return usd(value);
    case "usd-per-year":
      return `${usd(value)}/yr`;
    case "pct":
      return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    case "bps":
      return `${value.toFixed(2)} bps`;
    case "multiple":
      return `${value >= 1000 ? Math.round(value).toLocaleString("en-US") : value.toFixed(1)}×`;
    case "count":
      return Math.round(value).toLocaleString("en-US");
    case "near": {
      const n = value / 1e24; // yoctoNEAR
      if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B NEAR`;
      if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M NEAR`;
      if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K NEAR`;
      return `${n.toFixed(2)} NEAR`;
    }
    case "usd-per-tx":
      return `${usd(value, 4)}/tx`;
    default:
      return String(value);
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function shortHash(hash: string, n = 10): string {
  return `${hash.slice(0, n)}…${hash.slice(-4)}`;
}

/** Turns a raw bps rate into a readable take-rate string. */
export function bpsToPct(bps: number): string {
  return `${(bps / 100).toFixed(4)}%`;
}
