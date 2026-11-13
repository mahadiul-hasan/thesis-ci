import { getSnapshot } from "@/lib/snapshot";

/**
 * GET /api/snapshot
 *
 * The machine-readable version of the site. Same numbers, same hash, no
 * rendering. Useful for a judge who would rather diff JSON than trust a chart.
 */
export async function GET() {
  const snapshot = getSnapshot();
  return Response.json(snapshot, {
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
      "x-snapshot-hash": snapshot.hash,
      "x-snapshot-id": snapshot.id,
    },
  });
}
