import type { CropCycle } from '../features/crops/cropCyclesApi'
import type { FieldActivity } from '../features/crops/fieldActivitiesApi'
import type { WeatherDaily } from '../api/weatherApi'
import { computeWeatherOutlook } from './sugarcaneForecast'
import { recentWeatherDays } from './weatherWindow'
import { computeWeedRisk, type WeedRiskLevel } from './weedRisk'
import { closestThreat, computeDiseaseRisk, type DiseaseRisk } from './diseaseRisk'

export type SpriteMood = 'happy' | 'neutral' | 'worried'

export type WeeklySpriteForecast = {
  mood: SpriteMood
  lines: string[]
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
    return `${close.label} is the one to watch${chancePhrase(close)}. It would only take ${close.needsNext} to bring the risk up. Watching ${dayCount(disease.daysOfData)} of weather so far.`
  }

  const leading = disease.signals.reduce((a, b) => (b.favourability > a.favourability ? b : a))
  return `No disease weather building this week${chancePhrase(leading)}. Watching ${dayCount(disease.daysOfData)} of weather so far.`
}

export function buildWeeklySpriteForecast(
  cycles: CropCycle[],
  weatherDays: WeatherDaily[],
  fieldActivities: FieldActivity[],
): WeeklySpriteForecast {
  const activeSugarcane = cycles.filter(isActiveSugarcane)

  if (activeSugarcane.length === 0) {
    return { mood: 'neutral', lines: ['No active sugarcane cycles yet — plant one to get a weekly forecast here.'] }
  }

  const thisWeek = recentWeatherDays(weatherDays)
  if (thisWeek.length === 0) {
    return { mood: 'neutral', lines: ['No weather data yet for your farm — check back after the next daily sync.'] }
  }

  const outlooks = activeSugarcane.map((cycle) => ({
    cycle,
    outlook: computeWeatherOutlook(cycle.planting_date, thisWeek),
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

  const disease = computeDiseaseRisk(weatherDays)
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

  return { mood, lines: [yieldLine, diseaseLine, ...(weedLine ? [weedLine] : [])] }
}
