/**
 * Collect a snapshot.
 *
 *   npm run collect
 *
 * Fetches every source in the manifest, fingerprints the raw bytes, computes the
 * metrics, and writes an immutable snapshot to data/snapshots/ plus a pointer at
 * data/latest.json. Nothing here is hand-edited: if a number is wrong, the
 * fetcher is wrong, and the fetcher is in git.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fetchSource, sourceManifest, type FetchedSource } from "../src/lib/sources";
import { computeMetrics } from "../src/lib/metrics";
import { canonicalJson, sha256 } from "../src/lib/hash";
import { evaluateAll, summarise } from "../src/lib/claims";
import type { Snapshot } from "../src/lib/types";

const DATA = join(process.cwd(), "data");
const SNAPSHOTS = join(DATA, "snapshots");

async function main() {
  const started = new Date();
  console.log(`\n  thesis-ci · collecting snapshot at ${started.toISOString()}\n`);

  const manifest = sourceManifest();
  const fetched: FetchedSource[] = [];

  for (const entry of manifest) {
    process.stdout.write(`  → ${entry.id.padEnd(28)}`);
    try {
      const src = await fetchSource(entry.id, entry.label, entry.url, entry.init);
      fetched.push(src);
      console.log(`ok  ${String(src.httpStatus).padEnd(4)} ${(src.bytes / 1024).toFixed(1)}kB  ${src.sha256.slice(0, 12)}`);
    } catch (err) {
      console.log(`FAIL ${String(err)}`);
      throw err;
    }
  }

  const generatedAt = new Date().toISOString();
  const raw: Record<string, FetchedSource> = Object.fromEntries(fetched.map((f) => [f.id, f]));

  const { metrics, series } = computeMetrics(raw, generatedAt);

  const rpcStatus = raw["near-rpc-status"]?.json as any;
  const chain = {
    name: "mainnet" as const,
    blockHeight: Number(rpcStatus?.result?.sync_info?.latest_block_height ?? 0),
    protocolVersion: Number(rpcStatus?.result?.protocol_version ?? 0),
  };

  const sources = fetched.map(({ json, ...rest }) => rest);
  const hash = sha256(canonicalJson({ chain, metrics, sources }));

  const snapshot: Snapshot = {
    id: `snapshot-${generatedAt.slice(0, 10)}`,
    generatedAt,
    chain,
    sources,
    metrics,
    series,
    hash,
    hashBasis: "sha256 of canonical JSON over { chain, metrics, sources }",
  };

  mkdirSync(SNAPSHOTS, { recursive: true });
  writeFileSync(join(SNAPSHOTS, `${snapshot.id}.json`), JSON.stringify(snapshot, null, 2));
  writeFileSync(join(DATA, "latest.json"), JSON.stringify(snapshot, null, 2));

  // Keep a run log so /reproduce can show history.
  const logPath = join(DATA, "runs.json");
  const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, "utf8")) : [];
  log.push({
    id: snapshot.id,
    generatedAt,
    hash,
    blockHeight: chain.blockHeight,
    takeRateBps: metrics.take_rate_bps?.value ?? null,
    pfMultiple: metrics.pf_multiple?.value ?? null,
    chainFees1y: metrics.chain_fees_1y?.value ?? null,
  });
  writeFileSync(logPath, JSON.stringify(log, null, 2));

  const claims = evaluateAll(snapshot);
  const s = summarise(claims);

  console.log(`\n  snapshot ${snapshot.id}`);
  console.log(`  block    ${chain.blockHeight.toLocaleString("en-US")}  (protocol ${chain.protocolVersion})`);
  console.log(`  hash     ${hash}`);
  console.log(`\n  claims   ${s.pass} pass · ${s.fail} fail · ${s.early} too early  →  score ${s.score}/100`);
  console.log(`  take rate ${(metrics.take_rate_bps?.value ?? 0).toFixed(2)} bps   P/F ${Math.round(metrics.pf_multiple?.value ?? 0)}×`);
  console.log(`\n  wrote data/snapshots/${snapshot.id}.json\n`);
}

main().catch((err) => {
  console.error("\n  collect failed:", err);
  process.exit(1);
});
