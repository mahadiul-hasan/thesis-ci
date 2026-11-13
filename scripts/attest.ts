/**
 * Attest a snapshot hash on NEAR.
 *
 *   NEAR_ACCOUNT_ID=you.near NEAR_PRIVATE_KEY=ed25519:... npm run attest
 *
 * Writes the current snapshot hash to the `social.near` contract as a
 * function call, so the timestamp is committed to a public chain and cannot be
 * backdated. Appends the transaction hash to data/attestations.json, which
 * /reproduce renders as a NEAR Blocks link.
 *
 * No SDK: the transaction is borsh-encoded and ed25519-signed with Node's
 * built-in crypto. Costs one function call (~0.01 NEAR deposit).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import { createHash } from "node:crypto";
import type { Snapshot } from "../src/lib/types";

const RPC = process.env.NEAR_RPC_URL ?? "https://rpc.mainnet.near.org";
const NETWORK = (process.env.NEAR_NETWORK ?? "mainnet") as "mainnet" | "testnet";
const SOCIAL = NETWORK === "testnet" ? "v1.social08.testnet" : "social.near";
const GAS = 100_000_000_000_000n; // 100 Tgas
const DEPOSIT = 10_000_000_000_000_000_000_000n; // 0.01 NEAR, storage for the key

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function b58decode(input: string): Buffer {
  const bytes: number[] = [0];
  for (const ch of input) {
    const val = ALPHABET.indexOf(ch);
    if (val < 0) throw new Error(`invalid base58 character: ${ch}`);
    let carry = val;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < input.length && input[i] === "1"; i++) bytes.push(0);
  return Buffer.from(bytes.reverse());
}

function b58encode(buf: Buffer): string {
  const digits: number[] = [0];
  for (const byte of buf) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (let i = 0; i < buf.length && buf[i] === 0; i++) out += "1";
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]];
  return out;
}

const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const u64 = (n: bigint) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(n);
  return b;
};
const u128 = (n: bigint) => {
  const b = Buffer.alloc(16);
  b.writeBigUInt64LE(n & 0xffffffffffffffffn, 0);
  b.writeBigUInt64LE(n >> 64n, 8);
  return b;
};
const bstr = (s: string) => {
  const b = Buffer.from(s, "utf8");
  return Buffer.concat([u32(b.length), b]);
};
const bbytes = (b: Buffer) => Buffer.concat([u32(b.length), b]);

function loadKey(raw: string) {
  const trimmed = raw.trim().replace(/^ed25519:/, "");
  const decoded = b58decode(trimmed);
  if (decoded.length !== 64) {
    throw new Error(`expected a 64-byte ed25519 secret key, got ${decoded.length} bytes`);
  }
  const seed = decoded.subarray(0, 32);
  // PKCS#8 wrapper for an Ed25519 private key.
  const prefix = Buffer.from("302e020100300506032b657004220420", "hex");
  const privateKey = createPrivateKey({
    key: Buffer.concat([prefix, seed]),
    format: "der",
    type: "pkcs8",
  });
  const spki = createPublicKey(privateKey).export({ format: "der", type: "spki" });
  const publicKey = spki.subarray(spki.length - 32);
  return { privateKey, publicKey };
}

async function rpc(method: string, params: unknown) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "thesis-ci-attest", method, params }),
  });
  const json = (await res.json()) as any;
  if (json.error) throw new Error(`${method}: ${JSON.stringify(json.error)}`);
  return json.result;
}

async function main() {
  const accountId = process.env.NEAR_ACCOUNT_ID;
  const secret = process.env.NEAR_PRIVATE_KEY;

  if (!accountId || !secret) {
    console.error(`
  Missing credentials.

  Set these in .env.local (never commit it) or in the shell:

    NEAR_ACCOUNT_ID=you.near
    NEAR_PRIVATE_KEY=ed25519:...

  Then run:  npm run attest
`);
    process.exit(1);
  }

  const snapshot = JSON.parse(
    readFileSync(join(process.cwd(), "data", "latest.json"), "utf8"),
  ) as Snapshot;

  const { privateKey, publicKey } = loadKey(secret);
  const publicKeyString = `ed25519:${b58encode(publicKey)}`;

  console.log(`\n  thesis-ci · attest`);
  console.log(`  snapshot  ${snapshot.id}`);
  console.log(`  hash      ${snapshot.hash}`);
  console.log(`  account   ${accountId} (${NETWORK})\n`);

  const accessKey = await rpc("query", {
    request_type: "access_key",
    finality: "final",
    account_id: accountId,
    public_key: publicKeyString,
  });
  const nonce = BigInt(accessKey.nonce) + 1n;

  const block = await rpc("block", { finality: "final" });
  const blockHash = b58decode(block.header.hash);
  if (blockHash.length !== 32) throw new Error("unexpected block hash length");

  const payload = JSON.stringify({
    hash: snapshot.hash,
    snapshot: snapshot.id,
    block: snapshot.chain.blockHeight,
    take_rate_bps: snapshot.metrics.take_rate_bps?.value ?? null,
    pf_multiple: snapshot.metrics.pf_multiple?.value ?? null,
  });

  const args = {
    data: {
      [accountId]: {
        "thesis-ci": {
          [snapshot.id]: payload,
        },
      },
    },
  };

  const tx = Buffer.concat([
    bstr(accountId),
    Buffer.from([0]),
    publicKey,
    u64(nonce),
    bstr(SOCIAL),
    blockHash,
    u32(1),
    Buffer.from([2]), // Action::FunctionCall
    bstr("set"),
    bbytes(Buffer.from(JSON.stringify(args), "utf8")),
    u64(GAS),
    u128(DEPOSIT),
  ]);

  const txHash = createHash("sha256").update(tx).digest();
  const signature = sign(null, txHash, privateKey);
  const signed = Buffer.concat([tx, Buffer.from([0]), signature]);

  console.log(`  nonce     ${nonce}`);
  console.log(`  block     ${block.header.height} (${block.header.hash.slice(0, 12)}…)`);
  process.stdout.write(`  → broadcasting… `);

  const result = await rpc("broadcast_tx_commit", [signed.toString("base64")]);
  console.log("done");

  const record = {
    hash: snapshot.hash,
    account: accountId,
    network: NETWORK,
    txHash: result.transaction.hash,
    at: new Date().toISOString(),
  };

  const path = join(process.cwd(), "data", "attestations.json");
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : [];
  existing.push(record);
  writeFileSync(path, JSON.stringify(existing, null, 2));

  console.log(`\n  transaction ${result.transaction.hash}`);
  console.log(`  https://nearblocks.io/txns/${result.transaction.hash}`);
  console.log(`  wrote data/attestations.json\n`);
}

main().catch((err) => {
  console.error(`\n  attest failed: ${String(err)}\n`);
  process.exit(1);
});
