/**
 * The valuation model.
 *
 * Deliberately small and legible: one line of arithmetic, no spreadsheet, no
 * hidden tabs. If the reader disagrees with a number they can change it and the
 * output moves in front of them.
 *
 *   implied FDV = projected annual volume × take rate × fee multiple
 */

export type ModelInputs = {
  /** Trailing 12-month Intents settlement volume, USD. */
  volume1y: number;
  /** Basis points of settled volume captured as chain fees. */
  takeRateBps: number;
  /** Assumed growth in annual volume over the next twelve months, percent. */
  volumeGrowthPct: number;
  /** What the market is assumed to pay per dollar of annual fee revenue. */
  feeMultiple: number;
  /** Current market capitalisation, USD. */
  marketCap: number;
};

export type ModelOutput = {
  projectedVolume: number;
  projectedFees: number;
  impliedFdv: number;
  upside: number;
  /** Multiple the current market cap implies at these assumptions. */
  impliedMultipleNow: number;
};

export function runModel(i: ModelInputs): ModelOutput {
  const projectedVolume = i.volume1y * (1 + i.volumeGrowthPct / 100);
  const projectedFees = (projectedVolume * i.takeRateBps) / 10_000;
  const impliedFdv = projectedFees * i.feeMultiple;
  const upside = i.marketCap > 0 ? impliedFdv / i.marketCap - 1 : 0;
  const impliedMultipleNow = projectedFees > 0 ? i.marketCap / projectedFees : 0;
  return { projectedVolume, projectedFees, impliedFdv, upside, impliedMultipleNow };
}

/** Take rate the market must believe in to justify today's cap at a given multiple. */
export function requiredTakeRateBps(
  marketCap: number,
  projectedVolume: number,
  feeMultiple: number,
): number {
  if (projectedVolume <= 0 || feeMultiple <= 0) return 0;
  const requiredFees = marketCap / feeMultiple;
  return (requiredFees / projectedVolume) * 10_000;
}

/** The multiple the market is paying right now for current fee revenue. */
export function impliedMultiple(marketCap: number, fees: number): number {
  if (fees <= 0) return 0;
  return marketCap / fees;
}

export const TAKE_RATE_STEPS = [1, 2, 3.5, 5, 7.5, 10, 15, 20];
export const MULTIPLE_STEPS = [50, 100, 200, 300, 500];

export function sensitivityGrid(base: ModelInputs) {
  return TAKE_RATE_STEPS.map((bps) => ({
    takeRateBps: bps,
    cells: MULTIPLE_STEPS.map((multiple) => {
      const out = runModel({ ...base, takeRateBps: bps, feeMultiple: multiple });
      return {
        multiple,
        impliedFdv: out.impliedFdv,
        upside: out.upside,
      };
    }),
  }));
}
