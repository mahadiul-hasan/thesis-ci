/**
 * Reproduce.
 *
 *   npm run reproduce
 *
 * Refetches every source, recomputes every metric, and diffs the result against
 * the committed snapshot. Two outcomes, both useful:
 *
 *   - hash matches      → the pipeline is deterministic and nothing was edited
 *   - hash differs      → you get a field-by-field diff of what moved and by how much
 *
 * A snapshot is a photograph, not a live feed. Re-running later is expected to
 * show drift; what matters is that the drift is visible and attributable.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fetchSource, sourceManifest, type FetchedSource } from "../src/lib/sources";
import { computeMetrics } from "../src/lib/metrics";
import { canonicalJson, sha256 } from "../src/lib/hash";
import type { Snapshot } from "../src/lib/types";

const DATA = join(process.cwd(), "data");

const C = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

function pct(a: number | null, b: number | null): number | null {
  if (a === null || b === null || a === 0) return null;
  return ((b - a) / Math.abs(a)) * 100;
}

async function main() {
  const path = join(DATA, "latest.json");
  if (!existsSync(path)) {
    console.error("No committed snapshot. Run `npx tsx scripts/collect.ts` first.");
    process.exit(1);
  }
  const previous = JSON.parse(readFileSync(path, "utf8")) as Snapshot;

  console.log(`\n  ${C.bold("thesis-ci · reproduce")}`);
  console.log(`  snapshot   ${previous.id}`);
  console.log(`  committed  ${previous.generatedAt}`);
  console.log(`  hash       ${previous.hash}\n`);

  // Check 1 — offline integrity. Recompute the hash from the committed file
  // itself. No network, no clock, no drift: this must always pass, and if it
  // does not, the snapshot was edited after it was written.
  const localHash = sha256(
    canonicalJson({
      chain: previous.chain,
      metrics: previous.metrics,
      sources: previous.sources,
    }),
  );
  const integrityOk = localHash === previous.hash;
  console.log(
    `  ${C.bold("check 1")} ${C.dim("offline integrity")}  ` +
      (integrityOk ? C.green("OK") : C.red("FAILED")),
  );
  console.log(
    `          ${C.dim("sha256 of the committed {chain, metrics, sources}")}`,
  );
  if (!integrityOk) {
    console.log(`          ${C.red(`claimed ${previous.hash}`)}`);
    console.log(`          ${C.red(`got     ${localHash}`)}`);
  }
  console.log("");

  const manifest = sourceManifest();
  const fetched: FetchedSource[] = [];
  for (const entry of manifest) {
    process.stdout.write(`  → ${entry.id.padEnd(28)}`);
    try {
      const src = await fetchSource(entry.id, entry.label, entry.url, entry.init);
      fetched.push(src);
      console.log(C.dim(`ok ${src.sha256.slice(0, 12)}`));
    } catch (err) {
      console.log(C.red("FAIL"));
      throw err;
    }
  }

  const generatedAt = new Date().toISOString();
  const raw: Record<string, FetchedSource> = Object.fromEntries(fetched.map((f) => [f.id, f]));
  const { metrics } = computeMetrics(raw, generatedAt);

  const rpcStatus = raw["near-rpc-status"]?.json as any;
  const chain = {
    name: "mainnet" as const,
    blockHeight: Number(rpcStatus?.result?.sync_info?.latest_block_height ?? 0),
    protocolVersion: Number(rpcStatus?.result?.protocol_version ?? 0),
  };
  const sources = fetched.map(({ json, ...rest }) => rest);
  const hash = sha256(canonicalJson({ chain, metrics, sources }));

  console.log(`\n  ${C.bold("metric diff")}\n`);

  const ids = Object.keys(metrics).sort();
  let moved = 0;
  let missing = 0;

  for (const id of ids) {
    const before = previous.metrics[id];
    const after = metrics[id];
    if (!before) {
      console.log(`  ${C.yellow("new ")} ${id}`);
      continue;
    }
    const a = before.value;
    const b = after.value;
    if (a === null && b === null) continue;

    const drift = pct(a, b);
    const changed =
      a === null || b === null ? true : Math.abs(a - b) > Math.max(1e-9, Math.abs(a) * 1e-6);

    if (changed) {
      moved++;
      const p = drift === null ? "" : ` (${drift > 0 ? "+" : ""}${drift.toFixed(2)}%)`;
      console.log(
        `  ${C.yellow("~")} ${id.padEnd(26)} ${fmt(a).padStart(14)} → ${fmt(b).padStart(14)}${p}`,
      );
    }
  }

  for (const id of Object.keys(previous.metrics)) {
    if (!metrics[id]) {
      missing++;
      console.log(`  ${C.red("gone")} ${id}`);
    }
  }

  if (moved === 0 && missing === 0) {
    console.log(`  ${C.dim("no metric moved")}`);
  }

  console.log(`\n  ${C.bold("verdict")}\n`);
  console.log(
    `  ${C.dim("check 1  integrity")}  ` +
      (integrityOk ? C.green("OK") : C.red("FAILED")) +
      `  ${C.dim("the committed file was not edited after collection")}`,
  );
  if (hash === previous.hash) {
    console.log(
      `  ${C.dim("check 2  live")}       ${C.green("HASH MATCH")}` +
        `  ${C.dim("inputs identical to the committed snapshot")}`,
    );
  } else {
    console.log(
      `  ${C.dim("check 2  live")}       ${C.yellow("DRIFT")}` +
        `  ${C.dim(`${moved} metric(s) moved since the snapshot`)}`,
    );
    console.log(
      `           ${C.dim("expected when re-running against live data;")}`,
    );
    console.log(
      `           ${C.dim("the diff above names every field that moved")}`,
    );
  }

  console.log(`\n  committed  ${previous.hash}`);
  console.log(`  recomputed ${hash}\n`);
  console.log(
    `  ${C.dim(`${fetched.length} sources refetched · block ${chain.blockHeight.toLocaleString("en-US")}`)}\n`,
  );
}

function fmt(n: number | null): string {
  if (n === null) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(3)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(3)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  if (a >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

main().catch((err) => {
  console.error("\n  reproduce failed:", err);
  process.exit(1);
});
