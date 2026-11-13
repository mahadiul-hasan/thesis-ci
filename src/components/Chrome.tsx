"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Claims", note: "14 falsifiable statements" },
  { href: "/model", label: "Model", note: "price the take rate" },
  { href: "/reproduce", label: "Reproduce", note: "sources, hashes, run log" },
];

export function Nav({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = active ?? pathname;

  // Close on navigation, on Escape, and lock the page behind the panel.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

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
              data-active={current === l.href}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <a
          className="nav-cta"
          href="https://github.com/mahadiul-hasan/thesis-ci"
          target="_blank"
          rel="noreferrer noopener"
        >
          Source ↗
        </a>

        <button
          type="button"
          className="nav-toggle"
          data-open={open}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden />
          <span aria-hidden />
          <span aria-hidden />
        </button>
      </div>

      <div id="mobile-nav" className="mobile-panel" data-open={open} hidden={!open}>
        <div className="shell mobile-panel-inner">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="mobile-link"
              data-active={current === l.href}
              onClick={() => setOpen(false)}
            >
              <span>{l.label}</span>
              <span className="arrow mono">{l.note} →</span>
            </Link>
          ))}
          <a
            className="mobile-link"
            href="https://github.com/mahadiul-hasan/thesis-ci"
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => setOpen(false)}
          >
            <span>Source</span>
            <span className="arrow mono">GitHub ↗</span>
          </a>
        </div>
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
