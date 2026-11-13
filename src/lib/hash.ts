import { createHash } from "node:crypto";

/**
 * Deterministic JSON: keys sorted at every level, no whitespace variance.
 * Two runs that produced the same numbers must produce the same hash.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}
