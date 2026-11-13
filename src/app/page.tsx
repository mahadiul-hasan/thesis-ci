import Link from "next/link";
import { Nav, Footer } from "@/components/Chrome";
import { ClaimCard } from "@/components/ClaimCard";
import { AreaChart } from "@/components/AreaChart";
import { getSnapshot } from "@/lib/snapshot";
import { evaluateAll, summarise } from "@/lib/claims";
import { formatMetric } from "@/lib/format";

export default function Home() {
  const snapshot = getSnapshot();
  const claims = evaluateAll(snapshot);
  const s = summarise(claims);
  const m = snapshot.metrics;

  const settled = m.intents_volume_1y?.value ?? null;
  const captured = m.chain_fees_1y?.value ?? null;
  const takeRate = m.take_rate_bps?.value ?? null;
  const pf = m.pf_multiple?.value ?? null;

  return (
    <>
      <Nav active="/" />

      <main>
        {/* ------------------------------------------------------------ hero */}
        <section className="shell hero">
          <div className="hero-top">
            <span className="eyebrow">
              Snapshot <b>{snapshot.id.replace("snapshot-", "")}</b> · Block{" "}
              <b>{snapshot.chain.blockHeight.toLocaleString("en-US")}</b> · Hash{" "}
              <b>{snapshot.hash.slice(0, 10)}</b>
            </span>
            <span className="eyebrow">
              NEAR Hackathon · Investment Thesis + Open Innovation
            </span>
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display">
                The NEAR thesis,
                <br />
                <em>as a test suite.</em>
              </h1>
              <p className="lede" style={{ marginTop: 26 }}>
                Thirteen statements that a number can settle. Each one is computed
                from a public source, hashed, and re-runnable by anyone with the
                repository. A thesis you cannot lose is not a thesis — it is a
                press release.
              </p>
              <div className="hero-actions">
                <a href="#claims" className="btn btn-primary">
                  Read the {s.total} claims
                </a>
                <Link href="/model" className="btn">
                  Open the model
                </Link>
                <Link href="/reproduce" className="btn">
                  Reproduce this
                </Link>
              </div>
            </div>

            <div className="flowbox">
              <div className="flowrow">
                <span className="flowlabel">Intents settled · 12m</span>
                <span className="flowval good">{formatMetric(settled, "usd")}</span>
              </div>
              <div className="flowrow">
                <span className="flowlabel">Chain fees captured · 12m</span>
                <span className="flowval hot">{formatMetric(captured, "usd")}</span>
              </div>
              <div className="flowrow">
                <span className="flowlabel">Take rate</span>
                <span className="flowval hot">{formatMetric(takeRate, "bps")}</span>
              </div>
              <div className="flowrow">
                <span className="flowlabel">Market cap ÷ fees</span>
                <span className="flowval hot">{formatMetric(pf, "multiple")}</span>
              </div>
              <p className="flow-caption">
                NEAR settles roughly <strong>{formatMetric(settled, "usd")}</strong> of
                cross-chain volume a year and keeps{" "}
                <strong>{formatMetric(captured, "usd")}</strong> of it. The entire bull
                case is a bet that this ratio changes. Nothing else in this document
                matters as much.
              </p>
            </div>
          </div>

          <div className="verdict">
            <div className="verdict-cell">
              <div className="k">Claims holding</div>
              <div className="v v-ink">
                {s.pass}
                <span style={{ color: "var(--ink-mute)", fontSize: 18 }}> / {s.total}</span>
              </div>
              <div className="s">{s.fail} failing · {s.early} too early</div>
            </div>
            <div className="verdict-cell">
              <div className="k">Evidence score</div>
              <div className="v v-ink">
                {s.score}
                <span style={{ color: "var(--ink-mute)", fontSize: 18 }}> / 100</span>
              </div>
              <div className="s">weighted by materiality</div>
            </div>
            <div className="verdict-cell">
              <div className="k">Sources hashed</div>
              <div className="v v-ink">{snapshot.sources.length}</div>
              <div className="s">every payload fingerprinted</div>
            </div>
            <div className="verdict-cell">
              <div className="k">Network</div>
              <div className="v v-ink" style={{ fontSize: 22 }}>
                {snapshot.chain.name}
              </div>
              <div className="s">protocol {snapshot.chain.protocolVersion}</div>
            </div>
          </div>

          <p className="prose" style={{ marginTop: 24, maxWidth: "82ch" }}>
            <strong>A low score is not a sell call.</strong> It is a statement about{" "}
            <em>which</em> thesis is actually true. NEAR today is not a fee business —
            it is an option on becoming one, priced at {formatMetric(pf, "multiple")}{" "}
            annual fees. Everything below measures whether that option is being
            exercised, quarter by quarter, with the kill criteria written down in
            advance.
          </p>
        </section>

        {/* ---------------------------------------------------------- claims */}
        <section id="claims" className="section shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                01 / Claim suite
              </div>
              <h2 className="section-title">Thirteen statements that can lose</h2>
            </div>
            <p className="section-note">
              Thresholds were written down before the numbers were read. Click any
              claim to see the exact formula, the raw inputs, and the fingerprint of
              the payload it came from.
            </p>
          </div>

          <div className="claim-grid">
            {claims.map((c) => (
              <ClaimCard
                key={c.id}
                claim={c}
                unit={m[c.metricId]?.unit ?? "count"}
              />
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- flow chart */}
        <section className="section shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                02 / Flow versus capture
              </div>
              <h2 className="section-title">Two curves, one order of magnitude apart</h2>
            </div>
            <p className="section-note">
              Daily Intents settlement volume against daily chain fees. The shapes
              correlate; the vertical scales are roughly four orders of magnitude
              apart. That gap is the investment question.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 18,
              marginTop: 26,
            }}
          >
            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <div className="chart-title">Intents settlement · daily</div>
                  <div className="chart-value" style={{ color: "var(--pass)" }}>
                    {formatMetric(m.intents_volume_30d?.value ?? null, "usd")}
                    <span style={{ fontSize: 11, color: "var(--ink-mute)", marginLeft: 8 }}>
                      last 30d
                    </span>
                  </div>
                </div>
                <span className="pill" data-s="pass">
                  Flow
                </span>
              </div>
              <AreaChart
                id="intents"
                points={snapshot.series.intents_volume_daily ?? []}
                color="#7fe0a1"
                height={190}
              />
            </div>

            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <div className="chart-title">Chain fees · daily</div>
                  <div className="chart-value" style={{ color: "var(--fail)" }}>
                    {formatMetric(m.chain_fees_30d?.value ?? null, "usd")}
                    <span style={{ fontSize: 11, color: "var(--ink-mute)", marginLeft: 8 }}>
                      last 30d
                    </span>
                  </div>
                </div>
                <span className="pill" data-s="fail">
                  Capture
                </span>
              </div>
              <AreaChart
                id="fees"
                points={snapshot.series.fees_daily ?? []}
                color="#ff6f5e"
                height={190}
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ method */}
        <section className="section shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                03 / Method
              </div>
              <h2 className="section-title">Why you should trust a number here</h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              marginTop: 26,
            }}
          >
            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Pre-registered
              </div>
              <p className="prose">
                The thresholds live in{" "}
                <span className="mono" style={{ fontSize: 12 }}>
                  src/lib/claims.ts
                </span>
                . Moving one after seeing the data is a visible git diff, not a quiet
                edit. That is the entire point.
              </p>
            </div>
            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Fingerprinted
              </div>
              <p className="prose">
                Every HTTP response is hashed with SHA-256 at fetch time. The snapshot
                hash commits to the sources <em>and</em> the derived metrics, so a
                re-run either reproduces it exactly or shows you what moved.
              </p>
            </div>
            <div className="card card-pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Re-runnable
              </div>
              <p className="prose">
                <span className="mono" style={{ fontSize: 12 }}>
                  npm run reproduce
                </span>{" "}
                refetches everything and diffs the result against this page. If a
                number is wrong, the pipeline is wrong, and the pipeline is in git.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer hash={snapshot.hash} />
    </>
  );
}
