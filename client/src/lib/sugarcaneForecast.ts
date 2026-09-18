import type { WeatherDaily } from './weatherApi'

// Derived from the "Sugarcane Weather Impact & Yield Forecasting Guide"
// (Philippines context) provided by the user. Stage boundaries use the
// midpoint of each stage's stated duration range, measured in days from
// planting. Ripening is treated as open-ended (runs until actual harvest)
// since the guide's per-stage durations don't cleanly sum to its separately
// stated 12-18 month total cycle length.
export type SugarcaneStage = 'germination' | 'tillering' | 'grand_growth' | 'ripening'

const STAGE_BOUNDARIES: { stage: SugarcaneStage; startDay: number }[] = [
  { stage: 'germination', startDay: 0 },
  { stage: 'tillering', startDay: 15 }, // midpoint of 10-20 day germination
  { stage: 'grand_growth', startDay: 60 }, // 15 + midpoint of 30-60 day tillering (45)
  { stage: 'ripening', startDay: 180 }, // 60 + midpoint of 90-150 day grand growth (120)
]

const STAGE_LABELS: Record<SugarcaneStage, string> = {
  germination: 'Germination',
  tillering: 'Tillering',
  grand_growth: 'Grand Growth',
  ripening: 'Ripening',
}

export function getSugarcaneStage(daysSincePlanting: number): SugarcaneStage {
  let current: SugarcaneStage = 'germination'
  for (const boundary of STAGE_BOUNDARIES) {
    if (daysSincePlanting >= boundary.startDay) {
      current = boundary.stage
    }
  }
  return current
}

function averageTemp(days: WeatherDaily[]): number | null {
  const temps = days
    .filter((d) => d.temp_min_c != null && d.temp_max_c != null)
    .map((d) => (d.temp_min_c! + d.temp_max_c!) / 2)
  if (temps.length === 0) return null
  return temps.reduce((sum, t) => sum + t, 0) / temps.length
}

function averageDailyRainfall(days: WeatherDaily[]): number | null {
  const values = days.filter((d) => d.precipitation_mm != null).map((d) => d.precipitation_mm!)
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// Temperature Factor — table 5 of the guide. Ripening prefers cooler temps
// (boosts sucrose); other stages use the general growing-season curve.
function temperatureFactor(avgTempC: number, stage: SugarcaneStage): number {
  if (stage === 'ripening') {
    if (avgTempC <= 22) return 1.1
    if (avgTempC <= 24) return 1.0
    if (avgTempC <= 28) return 0.95
    return 0.9
  }
  if (avgTempC < 18) return 0.85
  if (avgTempC <= 26) return 1.0
  if (avgTempC <= 28) return 0.95
  return 0.9
}

// Rainfall Factor — the guide's grand-growth figures (1,200-1,500mm optimal)
// are stated per the ~120-day grand growth window, prorated here to a daily
// rate so they can be compared against whatever days of data are available.
const GRAND_GROWTH_DAYS = 120
function rainfallFactor(avgDailyMm: number): number {
  const dailyOptimalLow = 1200 / GRAND_GROWTH_DAYS
  const dailyOptimalHigh = 1500 / GRAND_GROWTH_DAYS
  const dailyGoodHigh = 2000 / GRAND_GROWTH_DAYS
  const dailyDeficitLow = 1000 / GRAND_GROWTH_DAYS

  if (avgDailyMm >= dailyOptimalLow && avgDailyMm <= dailyOptimalHigh) return 1.0
  if (avgDailyMm > dailyOptimalHigh && avgDailyMm <= dailyGoodHigh) return 0.98
  if (avgDailyMm > dailyGoodHigh) return 0.92
  if (avgDailyMm >= dailyDeficitLow) return 0.8
  return 0.6 // sustained deficit well below the guide's <1,000mm case
}

export type SugarcaneForecast = {
  stage: SugarcaneStage
  stageLabel: string
  daysSincePlanting: number
  weatherDaysUsed: number
  avgTempC: number | null
  avgDailyRainfallMm: number | null
  temperatureFactor: number | null
  rainfallFactor: number | null
  diseaseFactor: number
  baseYieldTonsPerHa: number
  estimatedYieldTonsPerHa: number | null
  timingOutlook: 'on_track' | 'possible_delay' | 'favorable' | 'insufficient_data'
  riskNotes: string[]
}

export function forecastSugarcane(
  plantingDate: string,
  weatherDays: WeatherDaily[],
  baseYieldTonsPerHa = 75,
): SugarcaneForecast {
  const daysSincePlanting = Math.floor((Date.now() - new Date(`${plantingDate}T00:00:00`).getTime()) / 86_400_000)
  const stage = getSugarcaneStage(daysSincePlanting)

  const avgTempC = averageTemp(weatherDays)
  const avgDailyRainfallMm = averageDailyRainfall(weatherDays)
  const diseaseFactor = 1.0 // no disease tracking yet — assumed healthy

  const tempFactor = avgTempC != null ? temperatureFactor(avgTempC, stage) : null
  const rainFactor = avgDailyRainfallMm != null ? rainfallFactor(avgDailyRainfallMm) : null

  const estimatedYieldTonsPerHa =
    tempFactor != null && rainFactor != null
      ? baseYieldTonsPerHa * tempFactor * rainFactor * diseaseFactor
      : null

  const riskNotes: string[] = []
  let timingOutlook: SugarcaneForecast['timingOutlook'] = 'insufficient_data'

  if (weatherDays.length === 0) {
    riskNotes.push('No weather data available yet for this plot.')
  } else {
    timingOutlook = 'on_track'

    if (avgTempC != null && avgTempC < 15 && stage === 'grand_growth') {
      riskNotes.push('Mean temperature below 15°C during Grand Growth — growth may have stalled.')
      timingOutlook = 'possible_delay'
    }
    if (avgTempC != null && avgTempC > 32) {
      riskNotes.push('Mean temperature above 32°C — fiber may harden prematurely, reducing sucrose.')
    }
    if (stage === 'ripening' && avgTempC != null && avgTempC > 24) {
      riskNotes.push('Ripening-phase temperature is running above the 16-22°C ideal — harvest may be delayed and sugar accumulation slowed.')
      timingOutlook = 'possible_delay'
    }
    if (stage === 'ripening' && avgTempC != null && avgTempC <= 20) {
      riskNotes.push('Cool ripening-phase nights are favorable — sucrose accumulation likely boosted.')
      timingOutlook = 'favorable'
    }
    if (stage === 'grand_growth' && rainFactor != null && rainFactor <= 0.6) {
      riskNotes.push('Rainfall well below the Grand Growth requirement — significant yield risk if this persists.')
    }
    if (stage === 'ripening' && avgDailyRainfallMm != null && avgDailyRainfallMm * 30 > 100) {
      riskNotes.push('Rainfall during ripening may dilute sugar content (lower brix).')
    }
  }

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    daysSincePlanting,
    weatherDaysUsed: weatherDays.length,
    avgTempC,
    avgDailyRainfallMm,
    temperatureFactor: tempFactor,
    rainfallFactor: rainFactor,
    diseaseFactor,
    baseYieldTonsPerHa,
    estimatedYieldTonsPerHa,
    timingOutlook,
    riskNotes,
  }
}
