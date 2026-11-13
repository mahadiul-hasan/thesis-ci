import type { ClaimStatus } from "@/lib/types";

const LABEL: Record<ClaimStatus, string> = {
  pass: "Pass",
  fail: "Fail",
  watch: "Watch",
  "too-early": "Too early",
};

export function StatusPill({ status }: { status: ClaimStatus }) {
  return (
    <span className="pill" data-s={status}>
      {LABEL[status]}
    </span>
  );
}

export const STATUS_COLOR: Record<ClaimStatus, string> = {
  pass: "var(--pass)",
  fail: "var(--fail)",
  watch: "var(--watch)",
  "too-early": "var(--watch)",
};
