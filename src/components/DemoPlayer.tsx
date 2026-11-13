"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Scene = {
  /** Page to load in the frame. */
  src: string;
  /** Selector to bring into view, or null for the top of the page. */
  to: string | null;
  /** Extra pixels past the anchor, for scrolling through a long block. */
  offset?: number;
  /** How long the scroll takes. 0 means jump. */
  scrollMs: number;
  /** How long to sit still afterwards, i.e. how long the narration runs. */
  holdMs: number;
  /** The line to say. Doubles as the teleprompter. */
  caption: string;
};

/**
 * The 80-second cut, matched to the shot list in DEMO.md. Every scene is a real
 * page of the deployed app — the player only scrolls and navigates it.
 */
const SCENES: Scene[] = [
  {
    src: "/",
    to: null,
    scrollMs: 0,
    holdMs: 8000,
    caption:
      "NEAR settled thirty-three billion dollars in the last twelve months. It kept one point one five million of it.",
  },
  {
    src: "/",
    to: ".verdict",
    scrollMs: 1200,
    holdMs: 6800,
    caption:
      "Fourteen claims. Four pass, ten fail. Every threshold was written down before the data arrived.",
  },
  {
    src: "/",
    to: ".claim-grid",
    offset: 820,
    scrollMs: 9000,
    holdMs: 5200,
    caption:
      "Flow is arriving. Capture is not. The scorecard says which is which, and what would have to change.",
  },
  {
    src: "/claims/capture-take-rate",
    to: null,
    scrollMs: 0,
    holdMs: 15000,
    caption:
      "Here is the crux. Measured: zero point three five basis points. Required: five. It fails by ninety-three percent.",
  },
  {
    src: "/model",
    to: ".model-grid",
    scrollMs: 1400,
    holdMs: 12000,
    caption:
      "Now price it. At five basis points — fourteen times better than today — NEAR is worth about two point one billion, against a four point six billion cap.",
  },
  {
    src: "/reproduce",
    to: ".grid-table",
    scrollMs: 1800,
    holdMs: 10000,
    caption:
      "One command refetches all ten sources, recomputes every metric, and diffs. If I cherry-picked anything, this is where you catch me.",
  },
  {
    src: "/",
    to: null,
    scrollMs: 0,
    holdMs: 8000,
    caption:
      "A thesis you cannot lose is not a thesis. Hashed sources, pre-registered thresholds, one command to check my work.",
  },
];

const TOTAL_MS = SCENES.reduce((a, s) => a + s.scrollMs + s.holdMs + 700, 0);

class Cancelled extends Error {}

function clock(ms: number) {
  return `${Math.floor(ms / 1000)}:${String(Math.floor((ms % 1000) / 10)).padStart(2, "0")}`;
}

export function DemoPlayer({ hash }: { hash: string }) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const runRef = useRef(0);
  const srcRef = useRef<string | null>(null);
  const loadWaiters = useRef<Array<() => void>>([]);

  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [hud, setHud] = useState(true);
  const [progress, setProgress] = useState(0);
  const [scene, setScene] = useState(0);
  const [caption, setCaption] = useState(SCENES[0].caption);

  const onFrameLoad = useCallback(() => {
    const waiters = loadWaiters.current;
    loadWaiters.current = [];
    waiters.forEach((resolve) => resolve());
  }, []);

  /** Resolve only if this run is still the current one, so a restart is clean. */
  const sleep = useCallback((ms: number, id: number) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => (id === runRef.current ? resolve() : reject(new Cancelled())), ms);
    });
  }, []);

  const goTo = useCallback(
    async (src: string, id: number) => {
      if (srcRef.current === src) return;
      srcRef.current = src;
      const frame = frameRef.current;
      if (!frame) return;
      const loaded = new Promise<void>((resolve) => loadWaiters.current.push(resolve));
      frame.src = src;
      await loaded;
      if (id !== runRef.current) throw new Cancelled();
      // Let hydration settle so the first scroll measures a stable layout.
      await sleep(450, id);
    },
    [sleep],
  );

  const targetY = useCallback((selector: string | null, offset = 0) => {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow;
    if (!doc || !win || !selector) return 0;
    const el = doc.querySelector(selector);
    if (!el) return 0;
    const top = el.getBoundingClientRect().top + win.scrollY;
    return Math.max(0, Math.round(top - 76 + offset));
  }, []);

  const scrollTo = useCallback((y: number, ms: number, id: number) => {
    return new Promise<void>((resolve, reject) => {
      const win = frameRef.current?.contentWindow;
      if (!win) return resolve();
      const from = win.scrollY;
      if (ms <= 0 || Math.abs(y - from) < 2) {
        win.scrollTo(0, y);
        return resolve();
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        if (id !== runRef.current) return reject(new Cancelled());
        const p = Math.min(1, (now - t0) / ms);
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        win.scrollTo(0, from + (y - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }, []);

  const play = useCallback(async () => {
    const id = ++runRef.current;
    setStarted(true);
    setDone(false);
    setProgress(0);
    setScene(0);

    const t0 = Date.now();
    const timer = setInterval(() => {
      setProgress(Math.min(1, (Date.now() - t0) / TOTAL_MS));
    }, 100);

    try {
      for (let i = 0; i < SCENES.length; i++) {
        const s = SCENES[i];
        setScene(i);
        setCaption(s.caption);
        await goTo(s.src, id);
        await scrollTo(targetY(s.to, s.offset ?? 0), s.scrollMs, id);
        await sleep(s.holdMs, id);
      }
      setProgress(1);
      setDone(true);
    } catch (err) {
      if (!(err instanceof Cancelled)) console.error(err);
    } finally {
      clearInterval(timer);
    }
  }, [goTo, scrollTo, sleep, targetY]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!started || done) void play();
      } else if (e.key === "r" || e.key === "R") {
        void play();
      } else if (e.key === "c" || e.key === "C") {
        setHud((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, done, play]);

  const elapsed = Math.round(progress * TOTAL_MS);

  return (
    <div className="demo">
      <div className="demo-stage">
        <iframe
          ref={frameRef}
          src="/"
          title="thesis-ci"
          onLoad={onFrameLoad}
          // The player never needs to be crawled, and the frame must not be
          // sandboxed: same-origin scripting is the whole mechanism.
        />

        {!started ? (
          <div className="demo-cover">
            <div className="eyebrow" style={{ letterSpacing: "0.22em" }}>
              thesis-ci · demo player
            </div>
            <h1>
              The NEAR thesis,
              <em>as a test suite.</em>
            </h1>
            <button type="button" className="demo-go" onClick={() => void play()}>
              ▶ Start · 80s
            </button>
            <div className="demo-keys">
              <span>
                <b>Space</b> start
              </span>
              <span>
                <b>R</b> restart
              </span>
              <span>
                <b>C</b> captions
              </span>
            </div>
            <p
              className="demo-end-meta"
              style={{ maxWidth: "54ch", margin: 0, textAlign: "center" }}
            >
              Records the real site, in order, at a fixed pace. Press <b>C</b> before you
              start recording if you would rather not have the caption bar in frame.
            </p>
          </div>
        ) : null}

        {done ? (
          <div className="demo-cover">
            <div className="eyebrow" style={{ letterSpacing: "0.22em", color: "var(--accent)" }}>
              end
            </div>
            <h1>
              Hashed sources.
              <em>One command to check my work.</em>
            </h1>
            <div className="demo-end-meta">
              <div>
                snapshot <b>{hash.slice(0, 16)}</b>
              </div>
              <div>
                github.com/<b>mahadiul-hasan/thesis-ci</b>
              </div>
              <div>
                thesis-ci.<b>vercel.app</b>
              </div>
            </div>
            <button type="button" className="demo-go" onClick={() => void play()}>
              ↻ Replay
            </button>
          </div>
        ) : null}
      </div>

      {hud ? (
        <div className="demo-hud">
          <div className="demo-caption">
            <span className="demo-scene">
              {String(scene + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
            </span>
            <span className="demo-line">{caption}</span>
            <span className="demo-time">
              {clock(elapsed)} / {clock(TOTAL_MS)}
            </span>
          </div>
          <div className="demo-track">
            <div className="demo-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
