import type { WeatherDaily } from '../api/weatherApi'
import { recentWeatherDays } from './weatherWindow'

// Weather-driven disease/pest risk for Bukidnon sugarcane.
//
// SOURCED thresholds (from the "Sugarcane Weather Impact & Yield Forecasting
// Guide" the user supplied):
//   - >85% RH sustained 3+ days is the guide's fungal-risk trigger
//   - >30°C is the guide's stated heat-damage inflection point
//
// PROVISIONAL thresholds (marked in the UI as estimates — the guide describes
// these conditions only qualitatively, e.g. "cool/dry + humid nights"):
//   - cool night <= 21°C, warm night >= 22°C, dry <= 5mm/day, wet >= 15mm/day
//
// ponytail: provisional cutoffs, replace with epidemiological thresholds if
// per-disease trigger data ever surfaces. An earlier version gated everything
// behind a single warm-night clause taken from the guide's *crop growth*
// optimum (22-26°C) — at Bukidnon's elevation nights run 19-20°C during the
// humid season, so that trigger could never fire and the feature was inert.
// Hence per-disease splits plus the partial-condition reporting below.
const HUMID_PCT = 85
const COOL_NIGHT_MAX_C = 21
const WARM_NIGHT_MIN_C = 22
const HOT_DAY_MIN_C = 30
const DRY_MAX_MM = 5
const WET_MIN_MM = 15
const CONSECUTIVE_DAYS_REQUIRED = 3

export type DiseaseThreatId = 'smut' | 'red_rot' | 'leaf_scald_borer'
export type DiseaseRiskLevel = 'low' | 'elevated' | 'unknown'

export type ThreatCondition = {
  label: string
  met: boolean
}

export type ThreatSignal = {
  id: DiseaseThreatId
  label: string
  /** True only when every condition held for CONSECUTIVE_DAYS_REQUIRED in a row. */
  elevated: boolean
  consecutiveDays: number
  /** Per-condition status on the most recent day with data — shown so the
   *  farmer can see what's close, instead of a silent all-clear. */
  conditions: ThreatCondition[]
  /** Conditions still unmet on the latest day, for "what it would take" copy. */
  missing: string[]
  /** Natural-language phrasing of the single missing condition, if there is one. */
  needsNext: string | null
  /** Plain-language symptoms to inspect for, if it does take hold. */
  watchFor: string
  /** 0-1. Share of recent days' conditions that were favourable for this
   *  threat — a live, fully-computed number that moves with the weather. */
  favourability: number
  /** Estimated chance this crop sees it, as a percentage. Only produced where
   *  a published incidence RANGE exists: the endpoints are the published
   *  figures and favourability just positions within them, so no part of the
   *  number is invented. Null where only a point estimate is published. */
  estimatedChancePct: number | null
  /** The published regional incidence this was anchored to. */
  publishedIncidencePct: [number, number] | null
  provisional: boolean
}

export type DiseaseRisk = {
  level: DiseaseRiskLevel
  /** Longest streak across all threats — kept for the existing summary UI. */
  consecutiveDays: number
  signals: ThreatSignal[]
}

// The guide states each disease's loss "if it occurs" as a 5-30% range and
// doesn't say what places a given case within it, so this stays a range.
export const DISEASE_YIELD_LOSS_RANGE_PCT: [number, number] = [5, 30]


// `label` reads as a checklist item ("Dry (under 5mm)"); `needs` reads inside
// a sentence ("it would only take a dry spell..."). Same condition, two
// grammatical contexts.
type ConditionCheck = { label: string; needs: string; test: (d: WeatherDaily) => boolean }

// Published regional incidence, used as the anchor for the chance estimate.
// A RANGE is required: favourability positions within the published spread,
// it never extrapolates past it. Threats with only a point estimate get no
// percentage rather than an invented span.
const PUBLISHED_INCIDENCE_PCT: Partial<Record<DiseaseThreatId, [number, number]>> = {
  // PhilSuTech: 7-16% field incidence despite 60-70% area presence.
  smut: [7, 16],
  // Mindanao red rot incidence is published as a single figure (22.01%), not
  // a range — so no positioned estimate for it.
}

const THREATS: { id: DiseaseThreatId; label: string; watchFor: string; checks: ConditionCheck[] }[] = [
  {
    id: 'smut',
    label: 'Smut',
    watchFor: 'black whip-like growths coming out of the top of the cane',
    checks: [
      { label: `Humid (${HUMID_PCT}%+)`, needs: 'humid air', test: (d) => d.humidity_pct != null && d.humidity_pct >= HUMID_PCT },
      { label: `Cool nights (${COOL_NIGHT_MAX_C}°C or below)`, needs: 'cooler nights', test: (d) => d.temp_min_c != null && d.temp_min_c <= COOL_NIGHT_MAX_C },
      { label: `Dry (under ${DRY_MAX_MM}mm)`, needs: 'a dry spell', test: (d) => d.precipitation_mm != null && d.precipitation_mm <= DRY_MAX_MM },
    ],
  },
  {
    id: 'red_rot',
    label: 'Red rot',
    watchFor: 'reddish discolouration inside split stalks, often with a sour smell',
    checks: [
      { label: `Hot days (${HOT_DAY_MIN_C}°C+)`, needs: 'hotter days', test: (d) => d.temp_max_c != null && d.temp_max_c >= HOT_DAY_MIN_C },
      { label: `Wet soil (${WET_MIN_MM}mm+)`, needs: 'heavier rain', test: (d) => d.precipitation_mm != null && d.precipitation_mm >= WET_MIN_MM },
    ],
  },
  {
    id: 'leaf_scald_borer',
    label: 'Leaf scald / borer',
    watchFor: 'white pencil-line streaks on leaves, wilting, or bore holes in the stalks',
    checks: [
      { label: `Humid (${HUMID_PCT}%+)`, needs: 'humid air', test: (d) => d.humidity_pct != null && d.humidity_pct >= HUMID_PCT },
      { label: `Warm nights (${WARM_NIGHT_MIN_C}°C+)`, needs: 'warmer nights', test: (d) => d.temp_min_c != null && d.temp_min_c >= WARM_NIGHT_MIN_C },
    ],
  },
]

export function computeDiseaseRisk(weatherDays: WeatherDaily[]): DiseaseRisk {
  const recent = recentWeatherDays(weatherDays)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  // Humidity is the gating input for two of the three threats, and it only
  // started syncing recently — without it, report unknown rather than a
  // false all-clear.
  const usable = recent.filter((d) => d.humidity_pct != null)
  if (recent.length === 0 || usable.length === 0) {
    return { level: 'unknown', consecutiveDays: 0, signals: [] }
  }

  const latest = recent[recent.length - 1]

  const signals: ThreatSignal[] = THREATS.map(({ id, label, watchFor, checks }) => {
    let streak = 0
    let maxStreak = 0
    let scoreTotal = 0
    for (const day of recent) {
      const metCount = checks.filter((c) => c.test(day)).length
      // Partial credit per day, so the score moves smoothly as weather shifts
      // rather than only flipping when every condition happens to align.
      scoreTotal += metCount / checks.length
      streak = metCount === checks.length ? streak + 1 : 0
      maxStreak = Math.max(maxStreak, streak)
    }

    const favourability = recent.length > 0 ? scoreTotal / recent.length : 0
    const conditions = checks.map((c) => ({ label: c.label, met: c.test(latest) }))
    const unmet = checks.filter((c) => !c.test(latest))
    const published = PUBLISHED_INCIDENCE_PCT[id] ?? null

    return {
      id,
      label,
      watchFor,
      elevated: maxStreak >= CONSECUTIVE_DAYS_REQUIRED,
      consecutiveDays: maxStreak,
      conditions,
      missing: unmet.map((c) => c.label),
      needsNext: unmet.length === 1 ? unmet[0].needs : null,
      favourability,
      publishedIncidencePct: published,
      estimatedChancePct: published
        ? published[0] + favourability * (published[1] - published[0])
        : null,
      provisional: id !== 'leaf_scald_borer',
    }
  })

  const elevatedSignals = signals.filter((s) => s.elevated)

  return {
    level: elevatedSignals.length > 0 ? 'elevated' : 'low',
    consecutiveDays: Math.max(0, ...signals.map((s) => s.consecutiveDays)),
    signals,
  }
}

/** The threat closest to triggering — only counts if it's a single condition
 *  away, so the sprite doesn't cry wolf over something two steps off. */
export function closestThreat(risk: DiseaseRisk): ThreatSignal | null {
  const candidates = risk.signals.filter((s) => !s.elevated && s.missing.length === 1)
  if (candidates.length === 0) return null
  return candidates.reduce((a, b) => (b.conditions.length > a.conditions.length ? b : a))
}
