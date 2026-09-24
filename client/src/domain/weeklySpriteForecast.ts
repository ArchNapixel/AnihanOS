import type { CropCycle } from '../features/crops/cropCyclesApi'
import type { FieldActivity } from '../features/crops/fieldActivitiesApi'
import type { WeatherDaily } from '../api/weatherApi'
import { toDateStr } from '../lib/dateUtils'
import { computeWeatherOutlook } from './sugarcaneForecast'
import { computeWeedRisk, type WeedRiskLevel } from './weedRisk'
import { computeDiseaseRisk } from './diseaseRisk'

export type SpriteMood = 'happy' | 'neutral' | 'worried'

export type WeeklySpriteForecast = {
  mood: SpriteMood
  lines: string[]
}

const isActiveSugarcane = (cycle: CropCycle) =>
  cycle.status !== 'harvested' && cycle.crop_types.name.trim().toLowerCase() === 'sugarcane'

// Only "this week" of weather, not the farm's entire accumulated history —
// listWeatherForFarm returns every row ever synced, but a headline about
// disease/timing "this week" should only look at recent + forecast days.
function recentWindow(weatherDays: WeatherDaily[]): WeatherDaily[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 2)
  const cutoffStr = toDateStr(cutoff)
  return weatherDays.filter((d) => d.date >= cutoffStr)
}

const OUTLOOK_SEVERITY: Record<string, number> = {
  favorable: 0,
  on_track: 1,
  insufficient_data: 1,
  possible_delay: 2,
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

  const thisWeek = recentWindow(weatherDays)
  if (thisWeek.length === 0) {
    return { mood: 'neutral', lines: ["No weather data yet for your farm — check back after the next daily sync."] }
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

  const disease = computeDiseaseRisk(thisWeek)
  const diseaseLine =
    disease.level === 'elevated'
      ? `Humidity's been high with warm nights for ${disease.consecutiveDays} days straight — fungal disease risk is elevated, worth a close look at your fields.`
      : disease.level === 'unknown'
        ? "Disease risk isn't available yet — needs a few more days of humidity data."
        : 'Disease risk looks low this week.'

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
        ? `Weed risk is High on ${highWeedCount} of ${weedLevels.length} field${weedLevels.length === 1 ? '' : 's'} — consider weeding soon.`
        : weedLevels.includes('medium')
          ? 'Weed risk is Medium — keep an eye on it.'
          : 'Weed risk is Low right now.'

  const mood: SpriteMood =
    disease.level === 'elevated' || highWeedCount > 0 || worst.outlook.timingOutlook === 'possible_delay'
      ? 'worried'
      : worst.outlook.timingOutlook === 'favorable'
        ? 'happy'
        : 'neutral'

  return { mood, lines: [yieldLine, diseaseLine, ...(weedLine ? [weedLine] : [])] }
}
