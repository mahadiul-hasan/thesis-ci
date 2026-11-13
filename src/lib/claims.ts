import type { Claim, EvaluatedClaim, ClaimStatus, Snapshot } from "./types";

/**
 * The thesis under test.
 *
 * A thesis is only an investment thesis if it can lose. Each claim below is a
 * statement that a number can settle, paired with the number that would settle
 * it and the criterion that would falsify it.
 *
 * Thresholds are set by the analyst before the data is read (see README:
 * "pre-registration"). Moving a threshold after seeing the number is cheating,
 * which is why every change is a new git commit against this file.
 */
export const CLAIMS: Claim[] = [
  {
    id: "flow-scale",
    index: "F-01",
    title: "Intents settles at scale",
    claim: "NEAR Intents settles more than $10B of cross-chain volume per year.",
    why: "The entire agent-economy story is a story about flow. If flow is small, there is nothing to capture.",
    kill: "If annual Intents volume is below $10B, the network is not a settlement venue at meaningful scale.",
    metricId: "intents_volume_1y",
    comparator: ">",
    threshold: 10_000_000_000,
    thresholdLabel: "> $10B / yr",
    deadline: "2026-12-31",
    weight: 3,
    group: "flow",
  },
  {
    id: "flow-growth",
    index: "F-02",
    title: "Flow is compounding",
    claim: "Intents 30-day volume grows more than 10% versus the prior 30 days.",
    why: "Scale without growth is a terminal business. A settlement network must compound or it decays.",
    kill: "Two consecutive quarters of flat-to-negative 30-day volume means flow has stalled.",
    metricId: "intents_volume_growth_30d",
    comparator: ">",
    threshold: 10,
    thresholdLabel: "> +10% MoM",
    deadline: "2027-01-31",
    weight: 2,
    group: "flow",
  },
  {
    id: "capture-fees",
    index: "C-01",
    title: "Chain fees reach $10M/yr",
    claim: "NEAR chain fee revenue exceeds $10M per year.",
    why: "Fees are the only cash flow a token holder can be paid from. Everything else is a narrative.",
    kill: "Below $10M/yr, NEAR is a subsidy-funded network and the token is a claim on future policy, not on revenue.",
    metricId: "chain_fees_1y",
    comparator: ">",
    threshold: 10_000_000,
    thresholdLabel: "> $10M / yr",
    deadline: "2027-06-30",
    weight: 3,
    group: "capture",
  },
  {
    id: "capture-take-rate",
    index: "C-02",
    title: "NEAR captures its own flow",
    claim: "NEAR captures more than 5 basis points of the value it settles.",
    why: "This is the crux. $33B of flow that pays 0.35 bps is a public utility, not a business.",
    kill: "Under 5 bps, even 10x volume growth leaves fee revenue under $20M — too small to underwrite a multi-billion valuation.",
    metricId: "take_rate_bps",
    comparator: ">",
    threshold: 5,
    thresholdLabel: "> 5.00 bps",
    deadline: "2027-06-30",
    weight: 3,
    group: "capture",
  },
  {
    id: "capture-growth",
    index: "C-03",
    title: "Fee revenue is compounding",
    claim: "30-day chain fees grow more than 20% versus the prior 30 days.",
    why: "A take-rate that is rising is a business finding pricing power. A falling one is a race to zero.",
    kill: "Fees flat or falling while volume grows means the network is being commoditised in real time.",
    metricId: "chain_fees_growth_30d",
    comparator: ">",
    threshold: 20,
    thresholdLabel: "> +20% MoM",
    deadline: "2027-01-31",
    weight: 2,
    group: "capture",
  },
  {
    id: "capture-valuation",
    index: "C-04",
    title: "Valuation is underwritten by fees",
    claim: "Market cap is less than 500x annualised chain fees.",
    why: "500x is already a growth premium. Above it, the market is paying for something other than fees.",
    kill: "Above 500x, a fee-based valuation cannot explain the price. The thesis must name a different asset.",
    metricId: "pf_multiple",
    comparator: "<",
    threshold: 500,
    thresholdLabel: "< 500×",
    deadline: "2026-12-31",
    weight: 3,
    group: "capture",
  },
  {
    id: "depth-tvl",
    index: "D-01",
    title: "Capital is parked on NEAR",
    claim: "Total value locked on NEAR exceeds $500M.",
    why: "Settlement flow passes through. TVL stays. Sticky capital is what makes a chain more than a pipe.",
    kill: "Below $500M TVL, NEAR is a routing layer for other people's liquidity, not a venue.",
    metricId: "tvl",
    comparator: ">",
    threshold: 500_000_000,
    thresholdLabel: "> $500M",
    deadline: "2027-06-30",
    weight: 2,
    group: "depth",
  },
  {
    id: "depth-tvl-rank",
    index: "D-02",
    title: "NEAR is a top-15 chain by TVL",
    claim: "NEAR ranks in the top 15 chains by total value locked.",
    why: "Rank is relative. A chain can grow and still lose, and relative position is what liquidity providers price.",
    kill: "Outside the top 15, NEAR competes for integrators on subsidies rather than on depth.",
    metricId: "tvl_rank",
    comparator: "<=",
    threshold: 15,
    thresholdLabel: "rank ≤ 15",
    deadline: "2027-06-30",
    weight: 1,
    group: "depth",
  },
  {
    id: "depth-stables",
    index: "D-03",
    title: "Dollar rails have depth",
    claim: "Stablecoin supply on NEAR exceeds $500M.",
    why: "Payroll, invoicing and agent payments all need dollars that already live on the chain.",
    kill: "Below $500M, every real-world payment product is a bridge wrapper, and the margin leaks elsewhere.",
    metricId: "stable_supply",
    comparator: ">",
    threshold: 500_000_000,
    thresholdLabel: "> $500M",
    deadline: "2027-06-30",
    weight: 2,
    group: "depth",
  },
  {
    id: "depth-stables-growth",
    index: "D-04",
    title: "Dollar rails are growing",
    claim:
      "Stablecoin supply on NEAR is more than 20% above its prior-quarter average.",
    why: "Stablecoin growth is the cleanest leading indicator that real payment volume is arriving.",
    kill: "Flat stablecoin supply over a quarter means the real-world-money thesis is not happening yet.",
    metricId: "stable_trend_90d",
    comparator: ">",
    threshold: 20,
    thresholdLabel: "> +20% · 90d avg",
    deadline: "2027-03-31",
    weight: 2,
    group: "depth",
  },
  {
    id: "depth-tvl-trend",
    index: "D-05",
    title: "Capital is arriving, not leaving",
    claim:
      "Average TVL over the last 90 days is more than 10% above the average of the prior 90 days.",
    why: "Point-to-point TVL is noise. Comparing two adjacent 90-day means is the cheapest honest way to ask whether capital is actually accumulating.",
    kill: "A flat or falling 90-day average means the TVL chart is oscillation, not growth.",
    metricId: "tvl_trend_90d",
    comparator: ">",
    threshold: 10,
    thresholdLabel: "> +10% · 90d avg",
    deadline: "2027-03-31",
    weight: 2,
    group: "depth",
  },
  {
    id: "decent-validators",
    index: "N-01",
    title: "The validator set is wide",
    claim: "More than 400 validators are producing blocks.",
    why: "A settlement layer for other people's money is only as credible as its ability to resist capture.",
    kill: "Below 400 validators, the set is small enough that coordinated action is a live risk.",
    metricId: "validator_count",
    comparator: ">",
    threshold: 400,
    thresholdLabel: "> 400",
    deadline: "2027-06-30",
    weight: 1,
    group: "decentralisation",
  },
  {
    id: "decent-concentration",
    index: "N-02",
    title: "Stake is not concentrated",
    claim: "The top 10 validators control less than 40% of staked NEAR.",
    why: "Validator count is vanity. Stake concentration is the number that decides who can halt the chain.",
    kill: "Above 40%, ten operators can coordinate a halt or a censorship regime regardless of the headcount.",
    metricId: "top10_stake_pct",
    comparator: "<",
    threshold: 40,
    thresholdLabel: "< 40%",
    deadline: "2027-06-30",
    weight: 2,
    group: "decentralisation",
  },
  {
    id: "build-velocity",
    index: "B-01",
    title: "The protocol is still being built",
    claim: "The nearcore repository receives at least 100 commits per 30 days.",
    why: "A chain that stops shipping stops being a platform. Commit velocity is a cheap proxy for conviction.",
    kill: "Under 100 commits/month, the roadmap is marketing and the protocol is in maintenance.",
    metricId: "commits_30d",
    comparator: ">=",
    threshold: 100,
    thresholdLabel: "≥ 100 / 30d",
    deadline: "2027-01-31",
    weight: 1,
    group: "build",
  },
];

export function evaluateClaim(claim: Claim, snapshot: Snapshot): EvaluatedClaim {
  const metric = snapshot.metrics[claim.metricId];
  const value = metric?.value ?? null;

  let status: ClaimStatus;
  if (claim.premature) {
    status = "too-early";
  } else if (value === null) {
    status = "too-early";
  } else {
    const met =
      claim.comparator === ">"
        ? value > claim.threshold
        : claim.comparator === ">="
          ? value >= claim.threshold
          : claim.comparator === "<"
            ? value < claim.threshold
            : value <= claim.threshold;
    status = met ? "pass" : "fail";
  }

  let headroom: number | null = null;
  if (value !== null && claim.threshold !== 0) {
    const raw =
      claim.comparator === ">" || claim.comparator === ">="
        ? (value - claim.threshold) / Math.abs(claim.threshold)
        : (claim.threshold - value) / Math.abs(claim.threshold);
    headroom = Math.round(raw * 1000) / 10;
  }

  return { ...claim, status, value, headroom };
}

export function evaluateAll(snapshot: Snapshot): EvaluatedClaim[] {
  return CLAIMS.map((c) => evaluateClaim(c, snapshot));
}

export function summarise(claims: EvaluatedClaim[]) {
  const pass = claims.filter((c) => c.status === "pass").length;
  const fail = claims.filter((c) => c.status === "fail").length;
  const early = claims.filter((c) => c.status === "too-early").length;
  const totalWeight = claims.reduce((s, c) => s + c.weight, 0);
  const earnedWeight = claims
    .filter((c) => c.status === "pass")
    .reduce((s, c) => s + c.weight, 0);
  return {
    pass,
    fail,
    early,
    total: claims.length,
    score: totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100),
  };
}
