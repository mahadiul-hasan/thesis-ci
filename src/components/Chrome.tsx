import Link from "next/link";

const LINKS = [
  { href: "/", label: "Claims" },
  { href: "/model", label: "Model" },
  { href: "/reproduce", label: "Reproduce" },
];

export function Nav({ active }: { active?: string }) {
  return (
    <header className="nav">
      <div className="shell nav-inner">
        <Link href="/" className="brand" aria-label="thesis-ci home">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">
            thesis<span>-ci</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Sections">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-link"
              data-active={active === l.href}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <a
          className="nav-cta"
          href="https://github.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Source ↗
        </a>
      </div>
    </header>
  );
}

export function Footer({ hash }: { hash?: string }) {
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            thesis-ci
          </div>
          <p className="footer-note">
            Every number on this site is computed from a public source, hashed, and
            reproducible with one command. No spreadsheet, no hand-entered figures.
            {hash ? (
              <>
                {" "}
                Current snapshot hash{" "}
                <span className="mono" style={{ color: "var(--ink-dim)" }}>
                  {hash.slice(0, 16)}
                </span>
                .
              </>
            ) : null}
          </p>
        </div>
        <div className="footer-links">
          <Link className="backlink" href="/reproduce">
            Reproduce
          </Link>
          <Link className="backlink" href="/model">
            Model
          </Link>
          <a
            className="backlink"
            href="https://nearhackathon.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            NEAR Hackathon ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
