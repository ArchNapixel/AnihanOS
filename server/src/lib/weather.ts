export type DailyWeather = {
  date: string
  temp_min_c: number | null
  temp_max_c: number | null
  precipitation_mm: number | null
  humidity_pct: number | null
  /** Reference evapotranspiration (FAO-56). Paired with rainfall it gives a
   *  real water balance, so "a dry day" means the crop lost more water than it
   *  received rather than an arbitrary millimetre cutoff. */
  et0_mm: number | null
  source: 'observed' | 'forecast'
}

// The server runs in UTC, but Open-Meteo returns dates in the farm's local
// timezone (timezone=auto — Philippines, UTC+8). Comparing against a plain
// UTC "today" would misclassify observed/forecast near the day boundary, so
// shift the current instant by the fixed PH offset before taking its date.
const PH_OFFSET_MS = 8 * 60 * 60 * 1000
const todayInPhilippines = () => new Date(Date.now() + PH_OFFSET_MS).toISOString().slice(0, 10)

export async function fetchDailyWeather(latitude: number, longitude: number): Promise<DailyWeather[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,et0_fao_evapotranspiration',
  )
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('past_days', '1')
  url.searchParams.set('forecast_days', '7')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`)
  }

  const data = (await response.json()) as {
    daily: {
      time: string[]
      temperature_2m_max: (number | null)[]
      temperature_2m_min: (number | null)[]
      precipitation_sum: (number | null)[]
      relative_humidity_2m_mean: (number | null)[]
      et0_fao_evapotranspiration: (number | null)[]
    }
  }

  const today = todayInPhilippines()

  return data.daily.time.map((date, i) => ({
    date,
    temp_max_c: data.daily.temperature_2m_max[i] ?? null,
    temp_min_c: data.daily.temperature_2m_min[i] ?? null,
    precipitation_mm: data.daily.precipitation_sum[i] ?? null,
    humidity_pct: data.daily.relative_humidity_2m_mean[i] ?? null,
    et0_mm: data.daily.et0_fao_evapotranspiration[i] ?? null,
    source: date < today ? 'observed' : 'forecast',
  }))
}

export function averageLocation(
  points: { latitude: number | null; longitude: number | null }[],
): { latitude: number; longitude: number } | null {
  const located = points.filter(
    (p): p is { latitude: number; longitude: number } => p.latitude != null && p.longitude != null,
  )
  if (located.length === 0) return null

  const sum = located.reduce(
    (acc, p) => ({ latitude: acc.latitude + p.latitude, longitude: acc.longitude + p.longitude }),
    { latitude: 0, longitude: 0 },
  )
  return { latitude: sum.latitude / located.length, longitude: sum.longitude / located.length }
}
