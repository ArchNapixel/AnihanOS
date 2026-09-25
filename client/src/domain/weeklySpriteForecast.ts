import type { CropCycle } from '../features/crops/cropCyclesApi'
import type { FieldActivity } from '../features/crops/fieldActivitiesApi'
import type { WeatherDaily } from '../api/weatherApi'
import { computeWeatherOutlook } from './sugarcaneForecast'
import { getWeekRange } from '../lib/weekRange'
import { todayIso } from '../lib/dateUtils'
import { computeWeedRisk, type WeedRiskLevel } from './weedRisk'
import { closestThreat, computeDiseaseRisk, type DiseaseRisk } from './diseaseRisk'

export type SpriteMood = 'happy' | 'neutral' | 'worried'

export type WeeklySpriteForecast = {
  mood: SpriteMood
  lines: string[]
  /** The calendar week this read covers, e.g. "Sep 21 – 27". */
  weekLabel: string
}

// Short form of the week range for the announcer's header. getWeekRange's own
// label ("September 21, 2026 - September 27, 2026") is too long for a badge.
function shortWeekLabel(start: string, end: string): string {
  const fmt = (iso: string, withMonth: boolean) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined,
      withMonth ? { month: 'short', day: 'numeric' } : { day: 'numeric' })
  const sameMonth = start.slice(0, 7) === end.slice(0, 7)
  return `${fmt(start, true)} – ${fmt(end, !sameMonth)}`
}

const isActiveSugarcane = (cycle: CropCycle) =>
  cycle.status !== 'harvested' && cycle.crop_types.name.trim().toLowerCase() === 'sugarcane'

const OUTLOOK_SEVERITY: Record<string, number> = {
  favorable: 0,
  on_track: 1,
  insufficient_data: 1,
  possible_delay: 2,
}

const dayCount = (n: number) => `${n} day${n === 1 ? '' : 's'}`

const chancePhrase = (signal: { estimatedChancePct: number | null }) =>
  signal.estimatedChancePct != null ? `, around a ${Math.round(signal.estimatedChancePct)}% chance this season` : ''

// Names the specific disease the weather is pointing at, gives a plain-language
// chance, and says what to look for. Deliberately free of thresholds and units
// — the farmer reading this wants "a dry spell", not "under 5mm".
function buildDiseaseLine(disease: DiseaseRisk): string {
  if (disease.level === 'unknown') {
    return "Can't judge disease risk yet — weather readings only started recently, so give it a few more days."
  }

  const elevated = disease.signals.filter((s) => s.elevated)
  if (elevated.length > 0) {
    const lead = elevated.reduce((a, b) => (b.consecutiveDays > a.consecutiveDays ? b : a))
    return `${lead.label} weather has held for ${dayCount(lead.consecutiveDays)} running${chancePhrase(lead)}. Go look for ${lead.watchFor}.`
  }

  const close = closestThreat(disease)
  if (close && close.needsNext) {
    return `${close.label} is the one to watch${chancePhrase(close)}. It would only take ${close.needsNext} to bring the risk up.`
  }

  const leading = disease.signals.reduce((a, b) => (b.favourability > a.favourability ? b : a))
  return `No disease weather building this week${chancePhrase(leading)}.`
}

export function buildWeeklySpriteForecast(
  cycles: CropCycle[],
  weatherDays: WeatherDaily[],
  fieldActivities: FieldActivity[],
): WeeklySpriteForecast {
  // The announcer speaks about the calendar week it currently sits in, and
  // rolls over to the next one on its own as the date moves — so everything
  // below is scoped to that segment rather than a rolling lookback.
  const week = getWeekRange(todayIso())
  const weekLabel = shortWeekLabel(week.start, week.end)
  const thisWeek = weatherDays.filter((d) => d.date >= week.start && d.date <= week.end)

  const activeSugarcane = cycles.filter(isActiveSugarcane)

  if (activeSugarcane.length === 0) {
    return {
      mood: 'neutral',
      weekLabel,
      lines: ['No active sugarcane cycles yet — plant one to get a weekly forecast here.'],
    }
  }

  if (thisWeek.length === 0) {
    return {
      mood: 'neutral',
      weekLabel,
      lines: ['No weather readings for this week yet — check back after the next daily sync.'],
    }
  }

  // Conditions come from this week's slice; the full series still goes in so
  // the drought streak inside can look back past the week boundary.
  const outlooks = activeSugarcane.map((cycle) => ({
    cycle,
    outlook: computeWeatherOutlook(cycle.planting_date, weatherDays, thisWeek),
  }))
  const worst = outlooks.reduce((a, b) =>
    OUTLOOK_SEVERITY[b.outlook.timingOutlook] > OUTLOOK_SEVERITY[a.outlook.timingOutlook] ? b : a,
  )

  const yieldLine =
    worst.outlook.timingOutlook === 'possible_delay'
      ? `Heads up on ${worst.cycle.plots.name}: ${worst.outlook.riskNotes[0] ?? 'this week’s weather could slow growth down'}`
      : worst.outlook.timingOutlook === 'favorable'
        ? `Good news — conditions on ${worst.cycle.plots.name} are favorable this week.`
        : 'Your sugarcane is on track this week.'

  const disease = computeDiseaseRisk(thisWeek)
  const diseaseLine = buildDiseaseLine(disease)

  const lastWeedingByPlot = new Map<string, string>()
  for (const activity of fieldActivities) {
    if (activity.activity_type !== 'weeding') continue
    const existing = lastWeedingByPlot.get(activity.plot_id)
    if (!existing || activity.date > existing) lastWeedingByPlot.set(activity.plot_id, activity.date)
  }
  const weedLevels = activeSugarcane
    .map((cycle) =>
      computeWeedRisk(cycle.planting_date, cycle.crop_types.canopy_closure_days, lastWeedingByPlot.get(cycle.plot_id) ?? null),
    )
    .filter((level): level is WeedRiskLevel => level != null)
  const highWeedCount = weedLevels.filter((l) => l === 'high').length
  const weedLine =
    weedLevels.length === 0
      ? null
      : highWeedCount > 0
        ? weedLevels.length === 1
          ? 'Weeds are getting ahead on your field — worth weeding soon.'
          : `Weeds are getting ahead on ${highWeedCount} of your ${weedLevels.length} fields — worth weeding soon.`
        : weedLevels.includes('medium')
          ? 'Weeds are worth keeping an eye on.'
          : 'Weeds are under control right now.'

  const mood: SpriteMood =
    disease.level === 'elevated' || highWeedCount > 0 || worst.outlook.timingOutlook === 'possible_delay'
      ? 'worried'
      : worst.outlook.timingOutlook === 'favorable'
        ? 'happy'
        : 'neutral'

  return { mood, weekLabel, lines: [yieldLine, diseaseLine, ...(weedLine ? [weedLine] : [])] }
}
