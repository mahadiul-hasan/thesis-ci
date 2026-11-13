import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Snapshot } from "./types";

const DATA = join(process.cwd(), "data");

export function getSnapshot(): Snapshot {
  const path = join(DATA, "latest.json");
  if (!existsSync(path)) {
    throw new Error(
      "No snapshot found. Run `npx tsx scripts/collect.ts` to create data/latest.json before building.",
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as Snapshot;
}

export type RunLogEntry = {
  id: string;
  generatedAt: string;
  hash: string;
  blockHeight: number;
  takeRateBps: number | null;
  pfMultiple: number | null;
  chainFees1y: number | null;
};

export function getRuns(): RunLogEntry[] {
  const path = join(DATA, "runs.json");
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, "utf8")) as RunLogEntry[];
  } catch {
    return [];
  }
}

export type Attestation = {
  hash: string;
  account: string;
  network: "mainnet" | "testnet";
  txHash: string;
  at: string;
};

export function getAttestations(): Attestation[] {
  const path = join(DATA, "attestations.json");
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Attestation[];
  } catch {
    return [];
  }
}
