import type { SeriesPoint } from "@/lib/types";

type Props = {
  points: SeriesPoint[];
  height?: number;
  color?: string;
  /** Start the y-axis at zero. Honest for volumes, misleading for ratios. */
  zeroBase?: boolean;
  id: string;
};

const W = 900;

/**
 * A deliberately plain SVG area chart. No chart library, no animation, no
 * smoothing that hides volatility — the shape of the data is the argument.
 */
export function AreaChart({
  points,
  height = 190,
  color = "#d9ff63",
  zeroBase = true,
  id,
}: Props) {
  if (!points.length) {
    return <div className="muted mono" style={{ fontSize: 12, padding: "40px 0" }}>no data</div>;
  }

  const values = points.map((p) => p.v);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = zeroBase ? 0 : rawMin;
  const max = rawMax === min ? min + 1 : rawMax;

  const H = height;
  const pad = 2;
  const x = (i: number) => (i / Math.max(1, points.length - 1)) * W;
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  const last = points[points.length - 1];
  const first = points[0];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block", overflow: "visible" }}
        role="img"
        aria-label={`${points.length} daily observations`}
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={H * f}
            y2={H * f}
            stroke="rgba(232,230,225,0.06)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#grad-${id})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        <circle
          cx={x(points.length - 1)}
          cy={y(last.v)}
          r={3}
          fill={color}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div
        className="mono"
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9.5,
          color: "var(--ink-mute)",
          marginTop: 8,
          letterSpacing: "0.06em",
        }}
      >
        <span>{new Date(first.t * 1000).toISOString().slice(0, 10)}</span>
        <span>
          min {fmt(min)} · max {fmt(max)}
        </span>
        <span>{new Date(last.t * 1000).toISOString().slice(0, 10)}</span>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}
