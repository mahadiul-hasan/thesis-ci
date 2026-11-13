# Ship it — demo, post, submit

Everything in this file is for the human. Total time: about 90 minutes, most of it
waiting for a video to upload.

Deadline: **14 Nov 2026, 23:59 UTC** — 15 Nov, 05:59 in Bangladesh.

---

## 0. Before you record (10 min)

```bash
npm install
npm run build
npm start          # production build, no dev badge in the corner
```

Open <http://localhost:3000>. Check four things:

1. Hero shows `$32.93B` settled and `$1.15M` captured.
2. Verdict strip shows `4 / 14`.
3. `/model` slider moves the implied value.
4. `/reproduce` shows 10 sources with SHA-256 fingerprints.

Close every other tab. Hide bookmarks. Set the browser to 1280×800 or wider.

---

## 1. The demo video (target 75 seconds, hard cap 2 minutes)

Record with OBS, Loom, or Windows `Win+G`. **No intro slide. No architecture
diagram.** Start on the product.

| Time | On screen | Say |
|---|---|---|
| 0:00–0:08 | Home page, hero visible | "NEAR settled thirty-three billion dollars last year. It kept one point one five million of it. That is zero point three five basis points." |
| 0:08–0:18 | Scroll to the verdict strip | "Everyone else in this track will show you a dashboard proving NEAR is good. I built the opposite — a test suite for the thesis, designed so it can fail." |
| 0:18–0:32 | Scroll the claim grid slowly | "Fourteen claims. Four pass, ten fail. Flow is arriving, capture is not." |
| 0:32–0:50 | Click **C-02** | "Here is the crux. Measured: zero point three five basis points. Required: five. It fails by ninety-three percent. And here is the exact formula, both raw inputs, and the fingerprint of the payload the number came from." |
| 0:50–1:08 | Go to **Model**, drag take rate to 5 bps | "Now the model. At five basis points — fourteen times better than today — NEAR is worth about two point one billion against a four point six billion cap. To justify today's price at a hundred times fees, you need ten point eight basis points." |
| 1:08–1:22 | Terminal: `npm run reproduce` | "Every number is reproducible. One command refetches all ten sources, recomputes, and diffs. If I cherry-picked anything, this is where you would catch me." |
| 1:22–1:30 | Back to home, then the repo | "A thesis you cannot lose is not a thesis. Hashed sources, pre-registered thresholds, one command to check my work." |

**Rules that matter more than the script:**

- Show the cursor. Judges need to see it is a real product, not a mockup.
- One complete moment beats five half-shown features. If you run long, cut the
  reproduce section, not the claim detail.
- No music. No stock footage. Screen + voice only.

---

## 2. The X post

Publish **before** you submit the form — the form needs the link.

Requirements from the rules: say it was built at NEAR HACKATHON, tag
`@NEARProtocol`, include `#NEARHackathon`, attach the video.

### Draft A — short

> NEAR settled $32.9B over the last year and captured $1.15M in fees. That's 0.35 basis points.
>
> So I built **thesis-ci**: the NEAR investment thesis as a 14-claim test suite. Every threshold pre-registered, every source SHA-256 hashed, one command to reproduce.
>
> 4 of 14 claims hold. Flow is arriving. Capture is not.
>
> Built at NEAR HACKATHON. Repo 👇
>
> @NEARProtocol #NEARHackathon

### Draft B — longer

> Most "investment thesis" submissions will be a dashboard proving the chain is good.
>
> I built the opposite: a scorecard designed to fail.
>
> **thesis-ci** turns the NEAR thesis into 14 falsifiable claims, each settled by a public number:
>
> • Intents settles $32.9B/yr → PASS
> • NEAR captures 0.35 bps of it → FAIL
> • Market cap = 3,998× annual fees → FAIL
> • 90-day TVL trend +55.9% → PASS
> • 354 validators → FAIL
>
> The pattern is the argument: **flow and capital are arriving, capture is not.** NEAR is not a fee business today — it's an option on becoming one, priced at 4,000× revenue.
>
> The model page prices that option. At a 100× fee multiple, today's $4.6B cap implies a take rate near 10.8 bps. The network delivers 0.35.
>
> Why you can check my work: every HTTP response is SHA-256 fingerprinted at fetch time, thresholds live in a git-tracked file, and `npm run reproduce` refetches all 10 sources and diffs the result.
>
> Built at NEAR HACKATHON · repo + demo below
>
> @NEARProtocol #NEARHackathon

Attach: the video. Optionally 2 screenshots (claim suite + model).
Optional tags for reach: `@NearLegion` `@NearBuilders`.

---

## 3. Publish the repo

```bash
git remote add origin https://github.com/<you>/thesis-ci.git
git branch -M main
git push -u origin main
```

**The repository must be public by 14 Nov 23:59 UTC.** Judges cannot open a
private one, and the AI screeners will try.

Then deploy for the hosted-demo bonus (optional but worth it):

1. Go to <https://vercel.com/new>, import the repo.
2. Framework: Next.js. No environment variables needed.
3. Deploy. Add the URL to the top of the README.

Keep the deployment up until **25 Nov**.

---

## 4. Submit

Form: <https://nearhackathon.com/#apply>

| Field | Value |
|---|---|
| Project name | `thesis-ci` |
| Team lead | *your name* |
| Email | *yours* |
| Team size | `1` (or your real size) |
| Tracks | `Investment Thesis` + `Open Innovation` |
| NEAR wallet | *your mainnet account, e.g. `you.near`* |
| Repository link | `https://github.com/<you>/thesis-ci` |
| Demo post link | the X post URL |
| Consent | tick |

### Description to paste (≈1,000 characters)

> thesis-ci turns the NEAR investment thesis into 14 falsifiable claims, each
> settled by a public number instead of conviction. Every threshold is
> pre-registered in a git-tracked file, every HTTP payload is SHA-256
> fingerprinted at fetch time, and `npm run reproduce` refetches all ten sources,
> recomputes every metric and diffs the result against the committed snapshot.
>
> The finding: NEAR Intents settles $32.9B a year and NEAR captures $1.15M in
> chain fees — 0.35 basis points, a 3,998× market-cap-to-fees multiple. 4 of 14
> claims hold. The pattern is that flow and capital are arriving while capture is
> not, which reframes the thesis as an option on take rate rather than a fee
> business. A model page prices that option: at a 100× fee multiple, today's
> valuation requires ~10.8 bps of capture.
>
> NEAR is used for live mainnet RPC reads (block height, protocol version,
> validator set and stake concentration) and optional on-chain attestation of
> each snapshot hash via social.near. Data: DefiLlama, NEAR Blocks, NEAR RPC,
> GitHub.

### Two warnings

- **One submission per project. It cannot be edited.** Check the repo and demo
  links are live and public *before* you press submit.
- If you do make a mistake, do **not** resubmit — use
  <https://nearhackathon.com/request-changes>.

---

## 5. Final checklist

- [ ] Repo public, README renders, LICENSE present
- [ ] `npm install && npm run build` works from a clean clone
- [ ] Home page shows 4/14 and the `$32.93B → $1.15M` line
- [ ] Demo video uploaded and visible in the X post
- [ ] X post contains "NEAR HACKATHON", `@NEARProtocol`, `#NEARHackathon`
- [ ] X post links the repo
- [ ] Submission form sent, screenshot of the confirmation saved
