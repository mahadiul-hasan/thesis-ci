import { sha256 } from "./hash";
import type { SourceRef } from "./types";

export type FetchedSource = SourceRef & { json: unknown };

const UA = "thesis-ci/1.0 (+https://github.com/mahadiul-hasan/thesis-ci; reproducible research)";

async function once(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "user-agent": UA,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

/**
 * Fetch a source and fingerprint the exact bytes we got.
 * Retries once on transient failure so a single blip does not void a run.
 */
export async function fetchSource(
  id: string,
  label: string,
  url: string,
  init?: RequestInit,
): Promise<FetchedSource> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await once(url, init);
      const text = await res.text();
      const fetchedAt = new Date().toISOString();
      const record: FetchedSource = {
        id,
        label,
        url,
        fetchedAt,
        httpStatus: res.status,
        bytes: Buffer.byteLength(text, "utf8"),
        sha256: sha256(text),
        json: null,
      };
      if (!res.ok) {
        lastError = new Error(`${id}: HTTP ${res.status}`);
        continue;
      }
      try {
        record.json = JSON.parse(text);
      } catch {
        record.json = null;
      }
      return record;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }

  throw new Error(`source ${id} failed: ${String(lastError)}`);
}

export const RPC = "https://rpc.mainnet.near.org";

export function rpcBody(method: string, params: unknown = []) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "thesis-ci", method, params }),
  } satisfies RequestInit;
}

/** The full source manifest. Order is stable so hashes are stable. */
export function sourceManifest(): Array<{
  id: string;
  label: string;
  url: string;
  init?: RequestInit;
}> {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  return [
    {
      id: "llama-chain-fees",
      label: "DefiLlama · NEAR chain fees",
      url: "https://api.llama.fi/summary/fees/near?dataType=dailyFees",
    },
    {
      id: "llama-intents-volume",
      label: "DefiLlama · NEAR Intents volume",
      url: "https://api.llama.fi/summary/dexs/near-intents?dataType=dailyVolume",
    },
    {
      id: "llama-chain-fees-ranking",
      label: "DefiLlama · fees by chain (ranking)",
      url: "https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true",
    },
    {
      id: "llama-chain-tvl-ranking",
      label: "DefiLlama · TVL by chain (ranking)",
      url: "https://api.llama.fi/v2/chains",
    },
    {
      id: "llama-near-tvl",
      label: "DefiLlama · NEAR TVL history",
      url: "https://api.llama.fi/v2/historicalChainTvl/Near",
    },
    {
      id: "llama-near-stables",
      label: "DefiLlama · NEAR stablecoin supply",
      url: "https://stablecoins.llama.fi/stablecoincharts/Near",
    },
    {
      id: "nearblocks-stats",
      label: "NEAR Blocks · network stats",
      url: "https://api.nearblocks.io/v1/stats",
    },
    {
      id: "near-rpc-status",
      label: "NEAR RPC · status (block height)",
      url: RPC,
      init: rpcBody("status"),
    },
    {
      id: "near-rpc-validators",
      label: "NEAR RPC · validators",
      url: RPC,
      init: rpcBody("validators", [null]),
    },
    {
      id: "github-nearcore-commits",
      label: "GitHub · nearcore commits (30d)",
      url: `https://api.github.com/repos/near/nearcore/commits?since=${since}&per_page=100`,
    },
  ];
}
