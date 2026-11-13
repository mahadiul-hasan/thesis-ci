import { Nav, Footer } from "@/components/Chrome";
import { ModelWorkbench } from "@/components/ModelWorkbench";
import { getSnapshot } from "@/lib/snapshot";
import { formatMetric } from "@/lib/format";

export default function ModelPage() {
  const snapshot = getSnapshot();
  const m = snapshot.metrics;

  const volume1y = m.intents_volume_1y?.value ?? 0;
  const marketCap = m.market_cap?.value ?? 0;
  const measuredTakeRateBps = m.take_rate_bps?.value ?? 0;
  const fees1y = m.chain_fees_1y?.value ?? 0;

  return (
    <>
      <Nav active="/model" />

      <main>
        <section className="shell" style={{ paddingTop: 56, paddingBottom: 8 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Valuation model · {snapshot.id.replace("snapshot-", "")}
          </div>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4.6vw, 56px)" }}>
            One line of arithmetic.
            <br />
            <em>Nothing hidden.</em>
          </h1>
          <p className="lede" style={{ marginTop: 22 }}>
            Most crypto models hide their assumptions in a spreadsheet. This one is a
            function you can read in twenty seconds. Move a slider and the valuation
            moves in front of you.
          </p>

          <div className="code" style={{ marginTop: 28, maxWidth: 720 }}>
            implied FDV = projected annual volume × take rate × fee multiple
            <br />
            <span className="c">
              today: {formatMetric(volume1y, "usd")} × {measuredTakeRateBps.toFixed(2)} bps
              = {formatMetric(fees1y, "usd")} of fees
            </span>
          </div>
        </section>

        <section className="shell" style={{ paddingTop: 34, paddingBottom: 20 }}>
          <ModelWorkbench
            volume1y={volume1y}
            marketCap={marketCap}
            measuredTakeRateBps={measuredTakeRateBps}
            fees1y={fees1y}
          />
        </section>

        <section className="shell" style={{ paddingTop: 40 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                Read the model honestly
              </div>
              <h2 className="section-title">Three things this model does not claim</h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
              gap: 18,
              marginTop: 26,
            }}
          >
            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                01
              </div>
              <p className="prose">
                <strong>Fees are not all Intents.</strong> Chain fee revenue includes
                every transaction on NEAR, so the take rate here is an{" "}
                <em>upper bound</em> on how much Intents flow actually pays the chain.
                The true capture is lower, which makes the gap worse, not better.
              </p>
            </div>
            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                02
              </div>
              <p className="prose">
                <strong>A fee multiple is not a law.</strong> 100× is a convention for
                high-growth infrastructure, not a derivation. That is exactly why it is
                a slider: the conclusion should survive a range, not one number.
              </p>
            </div>
            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                03
              </div>
              <p className="prose">
                <strong>The token may not be a claim on fees.</strong> If NEAR&apos;s
                value comes from being the reserve asset of an agent economy rather than
                from fee cash flow, this model is measuring the wrong thing — and saying
                so out loud is part of the thesis.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer hash={snapshot.hash} />
    </>
  );
}
