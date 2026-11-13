import Link from "next/link";
import { Nav, Footer } from "@/components/Chrome";
import { getSnapshot, getRuns, getAttestations } from "@/lib/snapshot";
import { formatDateTime, shortHash } from "@/lib/format";

export default function ReproducePage() {
  const snapshot = getSnapshot();
  const runs = getRuns();
  const attestations = getAttestations();

  return (
    <>
      <Nav active="/reproduce" />

      <main>
        <section className="shell" style={{ paddingTop: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Provenance · {snapshot.id.replace("snapshot-", "")}
          </div>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4.6vw, 56px)" }}>
            Anyone can
            <br />
            <em>re-run this.</em>
          </h1>
          <p className="lede" style={{ marginTop: 22 }}>
            A dashboard is a claim about the past that you have to take on faith. This
            page is the receipt: every source, every fingerprint, every run.
          </p>

          <div className="provenance-grid">
            <Cell label="Snapshot hash" value={snapshot.hash.slice(0, 24)} mono />
            <Cell
              label="Generated"
              value={formatDateTime(snapshot.generatedAt)}
            />
            <Cell
              label="Block height"
              value={snapshot.chain.blockHeight.toLocaleString("en-US")}
            />
            <Cell label="Sources" value={String(snapshot.sources.length)} />
          </div>
        </section>

        {/* -------------------------------------------------------- steps */}
        <section className="section shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                01 / Verify
              </div>
              <h2 className="section-title">Three commands</h2>
            </div>
            <p className="section-note">
              No API keys, no accounts, no paid tier. Every endpoint is public and
              free.
            </p>
          </div>

          <div style={{ marginTop: 8 }}>
            <div className="step">
              <div className="step-n">01</div>
              <div className="step-t">
                <b>Install.</b> Clone the repository and run{" "}
                <span className="mono">npm install</span>.
              </div>
            </div>
            <div className="step">
              <div className="step-n">02</div>
              <div className="step-t">
                <b>Recompute.</b> Run <span className="mono">npm run reproduce</span>.
                It refetches all {snapshot.sources.length} sources, recomputes every
                metric, and diffs the result against the snapshot on this page.
              </div>
            </div>
            <div className="step">
              <div className="step-n">03</div>
              <div className="step-t">
                <b>Compare.</b> If the hash matches, nothing was cherry-picked. If it
                does not, the diff names every field that moved and by how much.
              </div>
            </div>
          </div>

          <div className="code" style={{ marginTop: 22 }}>
            <span className="c"># reproduce and diff</span>
            <br />
            <span className="g">$</span> npm run reproduce
            <br />
            <br />
            <span className="c"># what the hash commits to</span>
            <br />
            sha256( canonicalJson( {"{"} chain, metrics, sources {"}"} ) )
          </div>
        </section>

        {/* ------------------------------------------------------ sources */}
        <section className="section shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                02 / Sources
              </div>
              <h2 className="section-title">What was read</h2>
            </div>
            <p className="section-note">
              Fingerprints are of the exact response bytes, taken at fetch time.
            </p>
          </div>

          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="grid-table">
              <thead>
                <tr>
                  <th>source</th>
                  <th>http</th>
                  <th>bytes</th>
                  <th>sha-256</th>
                  <th>fetched</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.sources.map((s) => (
                  <tr key={s.id}>
                    <td style={{ textAlign: "left" }}>
                      <a href={s.url} target="_blank" rel="noreferrer noopener">
                        {s.label}
                      </a>
                    </td>
                    <td>{s.httpStatus}</td>
                    <td>{s.bytes.toLocaleString("en-US")}</td>
                    <td style={{ textAlign: "left", color: "var(--ink-mute)" }}>
                      {shortHash(s.sha256, 16)}
                    </td>
                    <td style={{ color: "var(--ink-mute)" }}>
                      {s.fetchedAt.slice(11, 16)}Z
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --------------------------------------------------------- runs */}
        <section className="section shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                03 / Run log
              </div>
              <h2 className="section-title">Every collection, kept</h2>
            </div>
            <p className="section-note">
              Each run appends to{" "}
              <span className="mono" style={{ fontSize: 11 }}>
                data/runs.json
              </span>{" "}
              and commits. History is append-only by convention.
            </p>
          </div>

          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="grid-table">
              <thead>
                <tr>
                  <th>run</th>
                  <th>generated</th>
                  <th>block</th>
                  <th>take rate</th>
                  <th>mcap / fees</th>
                  <th>hash</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "left" }}>
                      no runs recorded
                    </td>
                  </tr>
                ) : (
                  runs.map((r) => (
                    <tr key={`${r.id}-${r.hash}`}>
                      <td style={{ textAlign: "left" }}>{r.id}</td>
                      <td style={{ color: "var(--ink-mute)" }}>
                        {formatDateTime(r.generatedAt)}
                      </td>
                      <td>{r.blockHeight.toLocaleString("en-US")}</td>
                      <td>{r.takeRateBps?.toFixed(2) ?? "—"} bps</td>
                      <td>{Math.round(r.pfMultiple ?? 0).toLocaleString("en-US")}×</td>
                      <td style={{ textAlign: "left", color: "var(--ink-mute)" }}>
                        {shortHash(r.hash, 12)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* -------------------------------------------------- attestation */}
        <section className="section shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                04 / On-chain attestation
              </div>
              <h2 className="section-title">Written to NEAR</h2>
            </div>
            <p className="section-note">
              A snapshot hash committed to NEAR is a timestamp nobody can backdate.
              Run <span className="mono" style={{ fontSize: 11 }}>npm run attest</span>{" "}
              to publish one.
            </p>
          </div>

          {attestations.length === 0 ? (
            <div className="card card-pad" style={{ marginTop: 22 }}>
              <p className="prose">
                No attestation yet for this snapshot. The hash above is still
                verifiable off-chain: it is committed to the repository, so the
                timestamp is the git commit time.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 22 }}>
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>snapshot hash</th>
                    <th>account</th>
                    <th>network</th>
                    <th>transaction</th>
                    <th>at</th>
                  </tr>
                </thead>
                <tbody>
                  {attestations.map((a) => (
                    <tr key={a.txHash}>
                      <td style={{ textAlign: "left" }}>{shortHash(a.hash, 14)}</td>
                      <td style={{ textAlign: "left" }}>{a.account}</td>
                      <td>{a.network}</td>
                      <td style={{ textAlign: "left" }}>
                        <a
                          href={`https://nearblocks.io/txns/${a.txHash}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {shortHash(a.txHash, 12)}
                        </a>
                      </td>
                      <td style={{ color: "var(--ink-mute)" }}>
                        {formatDateTime(a.at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="shell" style={{ paddingTop: 44 }}>
          <Link href="/" className="backlink">
            ← Back to the claims
          </Link>
        </section>
      </main>

      <Footer hash={snapshot.hash} />
    </>
  );
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div
        className={mono ? "num" : ""}
        style={{
          fontSize: mono ? 14 : 16,
          letterSpacing: mono ? "0" : undefined,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}
