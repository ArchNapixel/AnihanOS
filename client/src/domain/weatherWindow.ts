import type { WeatherDaily } from '../api/weatherApi'
import { toDateStr } from '../lib/dateUtils'

// weather_daily accumulates one row per farm per day forever, and
// listWeatherForFarm returns all of them. Anything reasoning about *current*
// conditions has to trim that history first — otherwise a farm running for six
// months averages half a year of weather into what is meant to be a read on
// this week, and the forecast silently drifts toward a seasonal mean.
//
// 9 days matches what the daily sync actually covers (yesterday + 7 forecast
// days) with a day of slack.
export const WEATHER_WINDOW_DAYS = 9

export function recentWeatherDays(
  weatherDays: WeatherDaily[],
  lookbackDays: number = WEATHER_WINDOW_DAYS,
): WeatherDaily[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - lookbackDays)
  const cutoffStr = toDateStr(cutoff)
  return weatherDays.filter((d) => d.date >= cutoffStr)
}
