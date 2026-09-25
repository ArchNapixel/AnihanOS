import { supabaseAdmin } from '../lib/supabaseClient.js'
import { averageLocation, fetchDailyWeather } from '../lib/weather.js'

export type WeatherSyncResult = {
  synced: number
  skipped: number
  errors: { farmId: string; message: string }[]
}

// Loops every farm, derives a representative location (farmer-set province,
// else averaged from plots), and upserts the next week of weather (plus
// yesterday's observed values) into weather_daily. Farms with neither a set
// location nor any plots are skipped before ever costing an Open-Meteo call.
export async function syncAllFarmsWeather(): Promise<WeatherSyncResult> {
  const { data: farms, error: farmsError } = await supabaseAdmin
    .from('farms')
    .select('id, latitude, longitude')
  if (farmsError) throw farmsError

  // One batched lookup instead of a per-farm query, so a farm with no plots
  // and no explicit location never costs more than this single shared call.
  const { data: allPlots, error: plotsError } = await supabaseAdmin
    .from('plots')
    .select('farm_id, latitude, longitude')
  if (plotsError) throw plotsError

  const plotsByFarmId = new Map<string, { latitude: number | null; longitude: number | null }[]>()
  for (const plot of allPlots ?? []) {
    const list = plotsByFarmId.get(plot.farm_id) ?? []
    list.push({ latitude: plot.latitude, longitude: plot.longitude })
    plotsByFarmId.set(plot.farm_id, list)
  }

  let synced = 0
  let skipped = 0
  const errors: { farmId: string; message: string }[] = []

  for (const farm of farms ?? []) {
    try {
      // A farmer-set location takes priority over the plot-derived estimate,
      // since it's available even before any plot boundary has been drawn.
      const location: { latitude: number; longitude: number } | null =
        farm.latitude != null && farm.longitude != null
          ? { latitude: farm.latitude, longitude: farm.longitude }
          : averageLocation(plotsByFarmId.get(farm.id) ?? [])

      if (!location) {
        skipped += 1
        continue
      }

      const daily = await fetchDailyWeather(location.latitude, location.longitude)

      const rows = daily.map((d) => ({
        farm_id: farm.id,
        date: d.date,
        temp_min_c: d.temp_min_c,
        temp_max_c: d.temp_max_c,
        precipitation_mm: d.precipitation_mm,
        humidity_pct: d.humidity_pct,
        et0_mm: d.et0_mm,
        source: d.source,
      }))

      const { error: upsertError } = await supabaseAdmin
        .from('weather_daily')
        .upsert(rows, { onConflict: 'farm_id,date' })

      if (upsertError) throw upsertError

      synced += 1
    } catch (err) {
      errors.push({ farmId: farm.id, message: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return { synced, skipped, errors }
}
