import { getSnapshot } from "@/lib/snapshot";
import { evaluateAll, summarise } from "@/lib/claims";

// The snapshot only changes at build time, so this endpoint is prerendered.
export const dynamic = "force-static";

/**
 * GET /api/claims
 *
 * The verdict as data: every claim with its measured value, threshold and
 * status. This is what the dashboard renders, in the form a script can consume.
 */
export async function GET() {
  const snapshot = getSnapshot();
  const claims = evaluateAll(snapshot);
  const summary = summarise(claims);

  return Response.json(
    {
      snapshot: {
        id: snapshot.id,
        hash: snapshot.hash,
        generatedAt: snapshot.generatedAt,
        blockHeight: snapshot.chain.blockHeight,
      },
      summary,
      claims: claims.map((c) => ({
        id: c.id,
        index: c.index,
        title: c.title,
        claim: c.claim,
        group: c.group,
        status: c.status,
        value: c.value,
        unit: snapshot.metrics[c.metricId]?.unit ?? null,
        comparator: c.comparator,
        threshold: c.threshold,
        thresholdLabel: c.thresholdLabel,
        weight: c.weight,
        deadline: c.deadline,
        kill: c.kill,
      })),
    },
    {
      headers: {
        "cache-control": "public, max-age=0, must-revalidate",
        "x-snapshot-hash": snapshot.hash,
      },
    },
  );
}
