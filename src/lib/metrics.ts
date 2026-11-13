import type { FetchedSource } from "./sources";
import type { Metric, SeriesPoint } from "./types";

type Any = any;

const num = (v: Any): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const arr = (v: Any): Any[] => (Array.isArray(v) ? v : []);

/** Sum the most recent `days` entries of a daily series. */
function windowSum(chart: SeriesPoint[], days: number, offset = 0): number | null {
  if (chart.length < days + offset) return null;
  const end = chart.length - offset;
  const slice = chart.slice(end - days, end);
  if (!slice.length) return null;
  return slice.reduce((s, p) => s + p.v, 0);
}

function toSeries(rows: Any[], tKey: string, vKey: string): SeriesPoint[] {
  return rows
    .map((r) => ({ t: Number(r?.[tKey]), v: Number(r?.[vKey]) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);
}

function trim(series: SeriesPoint[], max = 730): SeriesPoint[] {
  return series.length > max ? series.slice(-max) : series;
}

function pctChange(from: number | null, to: number | null): number | null {
  if (from === null || to === null || from === 0) return null;
  return ((to - from) / from) * 100;
}

function valueNDaysAgo(series: SeriesPoint[], days: number): number | null {
  if (series.length < days + 1) return null;
  return series[series.length - 1 - days]?.v ?? null;
}

/**
 * Mean of a trailing window, `offset` days back from the end.
 * Point-to-point changes on volatile series are cherry-pickable; comparing two
 * adjacent 90-day means is harder to game and harder to fool yourself with.
 */
function windowAvg(series: SeriesPoint[], days: number, offset = 0): number | null {
  const end = series.length - offset;
  const start = end - days;
  if (start < 0 || end > series.length || end - start === 0) return null;
  const slice = series.slice(start, end);
  if (!slice.length) return null;
  return slice.reduce((s, p) => s + p.v, 0) / slice.length;
}

export type Computed = {
  metrics: Record<string, Metric>;
  series: Record<string, SeriesPoint[]>;
};

export function computeMetrics(
  raw: Record<string, FetchedSource>,
  generatedAt: string,
): Computed {
  const metrics: Record<string, Metric> = {};
  const series: Record<string, SeriesPoint[]> = {};

  const add = (
    id: string,
    label: string,
    value: number | null,
    unit: Metric["unit"],
    sourceId: string,
    method: string,
    inputs: Metric["inputs"],
  ) => {
    metrics[id] = { id, label, value, unit, sourceId, method, inputs, asOf: generatedAt };
  };

  // ---------------------------------------------------------------- fees
  const fees = raw["llama-chain-fees"]?.json as Any;
  const feesChart = toSeries(arr(fees?.totalDataChart).map((p: Any) => ({ t: p[0], v: p[1] })), "t", "v");
  series["fees_daily"] = trim(feesChart);

  const fees1y = num(fees?.total1y);
  const fees30d = num(fees?.total30d) ?? windowSum(feesChart, 30);
  const feesPrev30d = windowSum(feesChart, 30, 30);
  const feesGrowth = pctChange(feesPrev30d, fees30d);

  add("chain_fees_1y", "Chain fee revenue, trailing 12m", fees1y, "usd-per-year", "llama-chain-fees",
    "DefiLlama total1y for the NEAR chain fee feed", { total1y: fees1y });
  add("chain_fees_30d", "Chain fees, last 30d", fees30d, "usd", "llama-chain-fees",
    "sum of the last 30 daily fee points", { total30d: fees30d });
  add("chain_fees_prev_30d", "Chain fees, prior 30d", feesPrev30d, "usd", "llama-chain-fees",
    "sum of the 30 daily fee points before that", { prior30d: feesPrev30d });
  add("chain_fees_growth_30d", "Chain fee growth, 30d vs prior 30d", feesGrowth, "pct", "llama-chain-fees",
    "(last 30d − prior 30d) ÷ prior 30d", { last30d: fees30d, prior30d: feesPrev30d });

  // -------------------------------------------------------------- intents
  const dexs = raw["llama-intents-volume"]?.json as Any;
  const intentsChart = toSeries(arr(dexs?.totalDataChart).map((p: Any) => ({ t: p[0], v: p[1] })), "t", "v");
  series["intents_volume_daily"] = trim(intentsChart);

  const intents1y = num(dexs?.total1y);
  const intents30d = num(dexs?.total30d) ?? windowSum(intentsChart, 30);
  const intentsPrev30d = windowSum(intentsChart, 30, 30);
  const intentsGrowth = pctChange(intentsPrev30d, intents30d);

  add("intents_volume_1y", "Intents settlement volume, trailing 12m", intents1y, "usd", "llama-intents-volume",
    "DefiLlama total1y for NEAR Intents (dex volume feed)", { total1y: intents1y });
  add("intents_volume_30d", "Intents volume, last 30d", intents30d, "usd", "llama-intents-volume",
    "sum of the last 30 daily volume points", { total30d: intents30d });
  add("intents_volume_prev_30d", "Intents volume, prior 30d", intentsPrev30d, "usd", "llama-intents-volume",
    "sum of the 30 daily volume points before that", { prior30d: intentsPrev30d });
  add("intents_volume_growth_30d", "Intents volume growth, 30d vs prior 30d", intentsGrowth, "pct", "llama-intents-volume",
    "(last 30d − prior 30d) ÷ prior 30d", { last30d: intents30d, prior30d: intentsPrev30d });

  // ------------------------------------------------------------- capture
  const takeRate = fees1y && intents1y ? (fees1y / intents1y) * 10_000 : null;
  add("take_rate_bps", "Take rate on settled volume", takeRate, "bps", "llama-chain-fees",
    "chain fees ÷ Intents volume × 10,000 (an upper bound: some fees come from non-Intents activity)",
    { chain_fees_1y: fees1y, intents_volume_1y: intents1y });

  // ------------------------------------------------------------- network
  const nb = raw["nearblocks-stats"]?.json as Any;
  const stats = arr(nb?.stats)[0] ?? {};
  const price = num(stats.near_price);
  const mcap = num(stats.market_cap);
  const circulating = num(stats.circulating_supply);
  const totalSupply = num(stats.total_supply);

  add("near_price", "NEAR price", price, "usd", "nearblocks-stats", "spot price reported by NEAR Blocks", {});
  add("market_cap", "Market capitalisation", mcap, "usd", "nearblocks-stats", "price × circulating supply", {
    price, circulating_supply: circulating,
  });

  const pf = mcap && fees1y ? mcap / fees1y : null;
  add("pf_multiple", "Market cap ÷ annualised fees", pf, "multiple", "nearblocks-stats",
    "market cap ÷ trailing 12m chain fees", { market_cap: mcap, chain_fees_1y: fees1y });

  const status = raw["near-rpc-status"]?.json as Any;
  add("block_height", "Latest block height", num(status?.result?.sync_info?.latest_block_height), "count", "near-rpc-status",
    "RPC status.sync_info.latest_block_height", {});

  // ----------------------------------------------------------------- tvl
  const tvlRows = arr(raw["llama-near-tvl"]?.json);
  const tvlSeries = toSeries(tvlRows, "date", "tvl");
  series["tvl_daily"] = trim(tvlSeries);
  const tvlNow = tvlSeries.length ? tvlSeries[tvlSeries.length - 1].v : null;
  const tvl90 = valueNDaysAgo(tvlSeries, 90);

  add("tvl", "Total value locked", tvlNow, "usd", "llama-near-tvl", "latest daily TVL point", {});
  add("tvl_change_90d", "TVL change, 90d (point to point)", pctChange(tvl90, tvlNow), "pct", "llama-near-tvl",
    "(today − 90d ago) ÷ 90d ago", { now: tvlNow, ago: tvl90 });

  const tvlTrend = pctChange(windowAvg(tvlSeries, 90, 90), windowAvg(tvlSeries, 90, 0));
  add("tvl_trend_90d", "TVL trend, 90d average vs prior 90d", tvlTrend, "pct", "llama-near-tvl",
    "(mean of last 90 days − mean of prior 90 days) ÷ prior mean", {
      last_90d_avg: windowAvg(tvlSeries, 90, 0),
      prior_90d_avg: windowAvg(tvlSeries, 90, 90),
    });

  const chains = arr(raw["llama-chain-tvl-ranking"]?.json)
    .map((c: Any) => ({ name: String(c?.name ?? ""), tvl: num(c?.tvl) ?? 0 }))
    .sort((a: Any, b: Any) => b.tvl - a.tvl);
  const tvlRank = chains.findIndex((c: Any) => c.name.toLowerCase() === "near") + 1;
  add("tvl_rank", "TVL rank among chains", tvlRank || null, "count", "llama-chain-tvl-ranking",
    "position among all chains ranked by TVL", { chains_ranked: chains.length });

  // ---------------------------------------------------------- stablecoins
  const stRows = arr(raw["llama-near-stables"]?.json);
  const stSeries = stRows
    .map((r: Any) => ({ t: Number(r?.date), v: Number(r?.totalCirculatingUSD?.peggedUSD) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);
  series["stable_supply_daily"] = trim(stSeries);
  const stNow = stSeries.length ? stSeries[stSeries.length - 1].v : null;
  const st90 = valueNDaysAgo(stSeries, 90);

  add("stable_supply", "Stablecoin supply on NEAR", stNow, "usd", "llama-near-stables",
    "latest daily totalCirculatingUSD.peggedUSD", {});
  add("stable_growth_90d", "Stablecoin supply change, 90d (point to point)", pctChange(st90, stNow), "pct", "llama-near-stables",
    "(today − 90d ago) ÷ 90d ago", { now: stNow, ago: st90 });

  const stableTrend = pctChange(windowAvg(stSeries, 90, 90), windowAvg(stSeries, 90, 0));
  add("stable_trend_90d", "Stablecoin trend, 90d average vs prior 90d", stableTrend, "pct", "llama-near-stables",
    "(mean of last 90 days − mean of prior 90 days) ÷ prior mean", {
      last_90d_avg: windowAvg(stSeries, 90, 0),
      prior_90d_avg: windowAvg(stSeries, 90, 90),
    });

  // --------------------------------------------------------- validators
  const v = raw["near-rpc-validators"]?.json as Any;
  const validators = arr(v?.result?.current_validators).map((x: Any) => ({ stake: num(x?.stake) ?? 0 }));
  const count = validators.length || null;
  const totalStaked = validators.reduce((s: number, x: Any) => s + x.stake, 0);
  const top10 = [...validators].sort((a: Any, b: Any) => b.stake - a.stake).slice(0, 10)
    .reduce((s: number, x: Any) => s + x.stake, 0);
  const top10pct = totalStaked > 0 ? (top10 / totalStaked) * 100 : null;

  add("validator_count", "Active validators", count, "count", "near-rpc-validators",
    "length of current_validators", {});
  add("top10_stake_pct", "Top-10 validator share of stake", top10pct, "pct", "near-rpc-validators",
    "sum of the 10 largest stakes ÷ total stake", { validators: count });
  add("staked_near", "Total staked", totalStaked, "near", "near-rpc-validators",
    "sum of current validator stakes", {});
  add("staked_pct", "Share of circulating supply staked",
    totalStaked && circulating ? (totalStaked / circulating) * 100 : null, "pct", "near-rpc-validators",
    "total staked ÷ circulating supply", { total_staked: totalStaked, circulating });
  add("circulating_supply", "Circulating supply", circulating, "near", "nearblocks-stats",
    "NEAR Blocks circulating_supply", {});
  add("total_supply", "Total supply", totalSupply, "near", "nearblocks-stats",
    "NEAR Blocks total_supply", {});

  // --------------------------------------------------------------- build
  const commits = arr(raw["github-nearcore-commits"]?.json);
  add("commits_30d", "nearcore commits, last 30d", commits.length || null, "count", "github-nearcore-commits",
    "count of commits returned for the last 30 days (API page size caps this at 100, so read it as a floor)",
    { returned: commits.length });

  // -------------------------------------------------------------- extras
  const feeRanking = arr((raw["llama-chain-fees-ranking"]?.json as Any)?.protocols)
    .filter((p: Any) => p?.category === "Chain" && num(p?.total1y))
    .sort((a: Any, b: Any) => (num(b.total1y) ?? 0) - (num(a.total1y) ?? 0));
  const feeRank = feeRanking.findIndex((p: Any) => String(p?.name ?? "").toLowerCase() === "near") + 1;
  const solana = feeRanking.find((p: Any) => String(p?.name ?? "").toLowerCase() === "solana");
  add("fee_rank", "Rank among chains by annual fees", feeRank || null, "count", "llama-chain-fees-ranking",
    "position among chains ranked by trailing 12m fees", { chains_ranked: feeRanking.length });
  add("solana_fees_1y", "Solana chain fees, trailing 12m", num(solana?.total1y), "usd-per-year", "llama-chain-fees-ranking",
    "DefiLlama total1y for Solana, used as a scale reference", {});

  return { metrics, series };
}
