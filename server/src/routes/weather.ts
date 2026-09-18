import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabaseClient.js'
import { averageLocation, fetchDailyWeather } from '../lib/weather.js'

const router = Router()

// Triggered by Vercel Cron (see server/vercel.json). Loops every farm,
// derives a representative location from its plots, and upserts the next
// week of weather (plus yesterday's observed values) into weather_daily.
router.get('/sync', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { data: farms, error: farmsError } = await supabaseAdmin.from('farms').select('id')
  if (farmsError) {
    res.status(500).json({ error: farmsError.message })
    return
  }

  let synced = 0
  let skipped = 0
  const errors: { farmId: string; message: string }[] = []

  for (const farm of farms ?? []) {
    try {
      const { data: plots, error: plotsError } = await supabaseAdmin
        .from('plots')
        .select('latitude, longitude')
        .eq('farm_id', farm.id)

      if (plotsError) throw plotsError

      const location = averageLocation(plots ?? [])
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

  res.json({ synced, skipped, errors })
})

export default router
