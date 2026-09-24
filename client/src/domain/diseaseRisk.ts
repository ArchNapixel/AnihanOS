import type { WeatherDaily } from '../api/weatherApi'

// Source: "Sugarcane Weather Impact & Yield Forecasting Guide" — its one
// clearly-quantified disease trigger is ">85% RH + warm nights for 3+ days
// flags fungal disease risk" (covers Leaf Scald, Red Rot, Smut, and Borer
// collectively — the guide doesn't give separate numeric triggers precise
// enough to tell them apart from daily-average weather alone, so this
// reports one combined risk flag rather than per-disease guesses).
const HUMIDITY_THRESHOLD_PCT = 85
const WARM_NIGHT_MIN_TEMP_C = 22
const CONSECUTIVE_DAYS_REQUIRED = 3

export type DiseaseRiskLevel = 'low' | 'elevated' | 'unknown'

export type DiseaseRisk = {
  level: DiseaseRiskLevel
  consecutiveDays: number
}

export function computeDiseaseRisk(weatherDays: WeatherDaily[]): DiseaseRisk {
  const hasHumidityData = weatherDays.some((d) => d.humidity_pct != null)
  if (!hasHumidityData) {
    return { level: 'unknown', consecutiveDays: 0 }
  }

  let streak = 0
  let maxStreak = 0
  for (const day of [...weatherDays].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    const isHumidWarmNight =
      day.humidity_pct != null &&
      day.humidity_pct >= HUMIDITY_THRESHOLD_PCT &&
      day.temp_min_c != null &&
      day.temp_min_c >= WARM_NIGHT_MIN_TEMP_C
    streak = isHumidWarmNight ? streak + 1 : 0
    maxStreak = Math.max(maxStreak, streak)
  }

  return { level: maxStreak >= CONSECUTIVE_DAYS_REQUIRED ? 'elevated' : 'low', consecutiveDays: maxStreak }
}
