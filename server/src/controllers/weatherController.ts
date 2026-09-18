import type { RequestHandler } from 'express'
import { syncAllFarmsWeather } from '../services/weatherSyncService.js'

export const sync: RequestHandler = async (_req, res) => {
  try {
    const result = await syncAllFarmsWeather()
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
