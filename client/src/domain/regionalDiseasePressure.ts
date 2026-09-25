// Regional (actuarial) disease drag on expected yield.
//
// Nothing in AnihanOS observes whether a specific plot is actually infected,
// so this is NOT a plot-level diagnosis. It's incidence × loss-if-infected
// using published regional figures — i.e. "what a Mindanao sugarcane field
// loses to disease on average", which is a defensible expected value and is
// labelled as such in the UI.
//
// Only threats with BOTH an incidence figure and a loss figure can go in the
// maths. Threats with a loss figure but no incidence are reported as
// conditional warnings instead (see CONDITIONAL_THREATS) — multiplying a real
// number by an assumed one produces an assumed result.

export type RegionalThreat = {
  id: string
  label: string
  /** Probability a field in this region is affected. */
  incidence: [number, number]
  /** Yield loss if it does occur. */
  lossIfInfected: [number, number]
  source: string
}

export const REGIONAL_THREATS: RegionalThreat[] = [
  {
    id: 'red_rot',
    label: 'Red rot',
    incidence: [0.2201, 0.2201], // PhilSuTech: Mindanao 22.01% (vs Visayas 39.56%, Luzon 28.34%)
    lossIfInfected: [0.1, 0.25],
    source: 'PhilSuTech distribution study (Mindanao incidence); 10-25% loss range',
  },
  {
    id: 'smut',
    label: 'Smut',
    incidence: [0.07, 0.16], // field incidence, despite 60-70% area presence
    // Kenya per-variety field study: susceptible ~38%, immune/highly resistant
    // still 20-25%. Resistance narrows the range, it never zeroes the loss —
    // so 20% is a floor that holds regardless of which variety is planted,
    // which is why this is computable before variety data exists.
    lossIfInfected: [0.2, 0.4],
    source: 'Field incidence 7-16%; per-variety loss 20-40% (resistance narrows, never zeroes)',
  },
]

/** Threats with real loss data but no usable regional incidence — surfaced as
 *  warnings, deliberately kept out of the yield number. */
export const CONDITIONAL_THREATS = [
  {
    id: 'downy_mildew',
    label: 'Downy mildew',
    note: 'Documented in Northern Mindanao. If it occurs, 40-60% yield loss — but no Mindanao incidence figure is published, so it is not in the estimate.',
  },
  {
    id: 'rsd',
    label: 'Ratoon stunting disease',
    note: 'Loss 5-60%, worst under drought and on later ratoons. No Philippine incidence data published, so it is not in the estimate.',
  },
  {
    id: 'rust',
    label: 'Brown rust',
    note: 'Roughly 3-8 tons/ha where infection persists on young leaves, worse early-season. No Mindanao incidence figure, so it is not in the estimate.',
  },
]

export type RegionalDiseaseDrag = {
  /** Compounded expected loss, as a fraction. */
  range: [number, number]
  midpoint: number
  contributions: { label: string; range: [number, number]; source: string }[]
}

/**
 * Compounds independent risks as 1 - Π(1 - loss), NOT a plain sum. Summing
 * lets stacked threats drive the factor to zero or negative (two 50% threats
 * would read as total crop failure); compounding survival rates saturates
 * correctly and matches how independent probabilities actually combine.
 */
export function computeRegionalDiseaseDrag(): RegionalDiseaseDrag {
  let survivalLow = 1
  let survivalHigh = 1
  const contributions: RegionalDiseaseDrag['contributions'] = []

  for (const threat of REGIONAL_THREATS) {
    const low = threat.incidence[0] * threat.lossIfInfected[0]
    const high = threat.incidence[1] * threat.lossIfInfected[1]
    contributions.push({ label: threat.label, range: [low, high], source: threat.source })
    survivalLow *= 1 - low
    survivalHigh *= 1 - high
  }

  const range: [number, number] = [1 - survivalLow, 1 - survivalHigh]
  return { range, midpoint: (range[0] + range[1]) / 2, contributions }
}
