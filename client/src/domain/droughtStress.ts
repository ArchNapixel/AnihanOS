import type { WeatherDaily } from '../api/weatherApi'

// Measured sugarcane drought dose-response (general water-deficit response,
// not specific to any one disease):
//
//   deficit duration    cane yield loss
//   30 days             -6.7%
//   50 days             -17.3%
//   70 days             -29.4%
//
// Zero deficit days means zero drought loss by definition, so (0, 0) is a real
// anchor rather than an invented one. Between anchors this interpolates
// linearly; past 70 days it clamps rather than extrapolating beyond the range
// anyone actually measured.
const CURVE: { days: number; lossPct: number }[] = [
  { days: 0, lossPct: 0 },
  { days: 30, lossPct: 6.7 },
  { days: 50, lossPct: 17.3 },
  { days: 70, lossPct: 29.4 },
]

export type DroughtStress = {
  /** Consecutive days, ending at the latest reading, where the crop lost more
   *  water than it received. */
  deficitDays: number
  /** Interpolated cane yield loss, or null when there isn't enough water-balance
   *  data to say anything honest. */
  yieldLossPct: number | null
  /** Days in the series that actually carry an ET0 reading. */
  daysWithWaterBalance: number
}

function lossForDays(days: number): number {
  if (days <= 0) return 0
  const last = CURVE[CURVE.length - 1]
  if (days >= last.days) return last.lossPct

  for (let i = 1; i < CURVE.length; i++) {
    const prev = CURVE[i - 1]
    const next = CURVE[i]
    if (days <= next.days) {
      const span = next.days - prev.days
      const position = (days - prev.days) / span
      return prev.lossPct + position * (next.lossPct - prev.lossPct)
    }
  }
  return last.lossPct
}

/**
 * Walks backwards from the most recent reading counting consecutive days where
 * rainfall fell short of evapotranspiration.
 *
 * Deliberately reads the FULL history rather than the recent window every other
 * calculation uses — a 30-to-70 day dry spell is by definition longer than that
 * window, so trimming first would make long droughts invisible.
 *
 * `plantingDate` bounds the streak to weather the crop was actually alive for.
 * Weather is stored per farm and accumulates whether or not anything is
 * planted, so without this a cycle planted partway through a dry spell would
 * be charged for the weeks that preceded it.
 */
export function computeDroughtStress(
  allWeatherDays: WeatherDaily[],
  plantingDate?: string,
): DroughtStress {
  const usable = allWeatherDays
    .filter((d) => d.et0_mm != null && d.precipitation_mm != null)
    .filter((d) => !plantingDate || d.date >= plantingDate)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  if (usable.length === 0) {
    return { deficitDays: 0, yieldLossPct: null, daysWithWaterBalance: 0 }
  }

  let deficitDays = 0
  for (let i = usable.length - 1; i >= 0; i--) {
    const day = usable[i]
    if (day.precipitation_mm! < day.et0_mm!) {
      deficitDays++
    } else {
      break
    }
  }

  // A streak can only be trusted as far back as the data goes. If every day on
  // record is a deficit day, the true streak may be longer than we can see, so
  // report what's measurable and let the caller note the limit.
  return {
    deficitDays,
    yieldLossPct: lossForDays(deficitDays),
    daysWithWaterBalance: usable.length,
  }
}
