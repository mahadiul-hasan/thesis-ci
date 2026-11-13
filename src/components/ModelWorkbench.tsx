"use client";

import { useMemo, useState } from "react";
import {
  runModel,
  requiredTakeRateBps,
  sensitivityGrid,
  MULTIPLE_STEPS,
} from "@/lib/model";
import { formatMetric } from "@/lib/format";

type Props = {
  volume1y: number;
  marketCap: number;
  measuredTakeRateBps: number;
  fees1y: number;
};

export function ModelWorkbench({
  volume1y,
  marketCap,
  measuredTakeRateBps,
  fees1y,
}: Props) {
  const [takeRateBps, setTakeRate] = useState(round2(measuredTakeRateBps));
  const [volumeGrowthPct, setGrowth] = useState(30);
  const [feeMultiple, setMultiple] = useState(100);

  const inputs = { volume1y, takeRateBps, volumeGrowthPct, feeMultiple, marketCap };
  const out = useMemo(() => runModel(inputs), [volume1y, takeRateBps, volumeGrowthPct, feeMultiple, marketCap]);

  const required = requiredTakeRateBps(marketCap, out.projectedVolume, feeMultiple);
  const grid = useMemo(() => sensitivityGrid(inputs), [volume1y, volumeGrowthPct, feeMultiple, marketCap]);

  const upsideColor =
    out.upside > 0 ? "var(--pass)" : out.upside > -0.5 ? "var(--watch)" : "var(--fail)";

  return (
    <div className="model-grid">
      {/* ------------------------------------------------------- controls */}
      <div className="card card-pad">
        <div className="eyebrow" style={{ marginBottom: 20 }}>
          Assumptions
        </div>

        <div className="control">
          <div className="control-head">
            <span className="control-label">Take rate</span>
            <span className="control-value">{takeRateBps.toFixed(2)} bps</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={25}
            step={0.05}
            value={takeRateBps}
            onChange={(e) => setTakeRate(Number(e.target.value))}
            aria-label="Take rate in basis points"
          />
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-mute)", marginTop: 8 }}>
            measured today: {measuredTakeRateBps.toFixed(2)} bps
          </div>
        </div>

        <div className="control">
          <div className="control-head">
            <span className="control-label">Volume growth · next 12m</span>
            <span className="control-value">
              {volumeGrowthPct > 0 ? "+" : ""}
              {volumeGrowthPct}%
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={200}
            step={5}
            value={volumeGrowthPct}
            onChange={(e) => setGrowth(Number(e.target.value))}
            aria-label="Volume growth percent"
          />
        </div>

        <div className="control" style={{ marginBottom: 8 }}>
          <div className="control-head">
            <span className="control-label">Fee multiple</span>
            <span className="control-value">{feeMultiple}×</span>
          </div>
          <input
            type="range"
            min={10}
            max={600}
            step={10}
            value={feeMultiple}
            onChange={(e) => setMultiple(Number(e.target.value))}
            aria-label="Fee multiple"
          />
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-mute)", marginTop: 8 }}>
            what the market pays per $1 of annual fees
          </div>
        </div>

        <hr className="hr" style={{ margin: "22px 0" }} />

        <button
          className="btn"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => {
            setTakeRate(round2(measuredTakeRateBps));
            setGrowth(30);
            setMultiple(100);
          }}
        >
          Reset to measured
        </button>

        <div className="kv" style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <span className="k">volume · 12m</span>
          <span className="v">{formatMetric(volume1y, "usd")}</span>
          <span className="k">fees · 12m</span>
          <span className="v">{formatMetric(fees1y, "usd")}</span>
          <span className="k">market cap</span>
          <span className="v">{formatMetric(marketCap, "usd")}</span>
        </div>
      </div>

      {/* -------------------------------------------------------- outputs */}
      <div className="stack-22">
        <div className="big-out">
          <div className="k">Implied fully-diluted value</div>
          <div className="v" style={{ color: upsideColor }}>
            {formatMetric(out.impliedFdv, "usd")}
          </div>
          <div className="sub">
            {out.upside >= 0 ? "Upside" : "Downside"}{" "}
            <strong style={{ color: upsideColor }}>
              {(out.upside * 100).toFixed(0)}%
            </strong>{" "}
            versus a {formatMetric(marketCap, "usd")} market cap.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 18,
              marginTop: 26,
              paddingTop: 20,
              borderTop: "1px solid var(--line)",
            }}
          >
            <Stat label="Projected volume" value={formatMetric(out.projectedVolume, "usd")} />
            <Stat label="Projected fees" value={formatMetric(out.projectedFees, "usd")} />
            <Stat
              label="Multiple implied today"
              value={formatMetric(out.impliedMultipleNow, "multiple")}
            />
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            What the market is being asked to believe
          </div>
          <p className="prose">
            At a <strong>{feeMultiple}×</strong> fee multiple and{" "}
            <strong>
              {volumeGrowthPct > 0 ? "+" : ""}
              {volumeGrowthPct}%
            </strong>{" "}
            volume growth, today&apos;s{" "}
            <strong>{formatMetric(marketCap, "usd")}</strong> market cap requires a take
            rate of{" "}
            <strong style={{ color: "var(--accent)" }}>{required.toFixed(2)} bps</strong>{" "}
            — {required > measuredTakeRateBps ? "higher" : "lower"} than the{" "}
            {measuredTakeRateBps.toFixed(2)} bps NEAR actually captures.{" "}
            {required > measuredTakeRateBps
              ? "That is the gap the bull case has to close."
              : "The market is pricing less capture than the network already delivers."}
          </p>
        </div>

        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Sensitivity · implied value
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="grid-table">
              <thead>
                <tr>
                  <th>take rate</th>
                  {MULTIPLE_STEPS.map((m) => (
                    <th key={m}>{m}×</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row) => (
                  <tr key={row.takeRateBps}>
                    <td>{row.takeRateBps} bps</td>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.multiple}
                        style={{
                          color:
                            cell.upside > 0
                              ? "var(--pass)"
                              : cell.upside > -0.5
                                ? "var(--watch)"
                                : "var(--fail)",
                          background:
                            cell.upside > 0
                              ? "rgba(127,224,161,0.07)"
                              : "transparent",
                        }}
                      >
                        {formatMetric(cell.impliedFdv, "usd")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-mute)", marginTop: 12 }}>
            volume held at {formatMetric(out.projectedVolume, "usd")} · green means the
            implied value clears today&apos;s market cap
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div className="num" style={{ fontSize: 18 }}>
        {value}
      </div>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
