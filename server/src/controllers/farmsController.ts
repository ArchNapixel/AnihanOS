import type { RequestHandler } from 'express'
import { createUserScopedClient } from '../lib/supabaseUserClient.js'
import { getFarmPlotsGeoJson } from '../services/farmsService.js'

export const placeholder: RequestHandler = (_req, res) => {
  res.json({ message: 'farms endpoint placeholder' })
}

export const plotsGeoJson: RequestHandler = async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }

  const accessToken = authHeader.slice('Bearer '.length)
  const supabase = createUserScopedClient(accessToken)

  try {
    const data = await getFarmPlotsGeoJson(supabase, req.params.farmId)
    // Plot data changes on every create/edit/delete — Express's default
    // ETag generation was letting the browser skip re-fetching and serve a
    // stale cached response (visible as 304s even after new plots were added).
    res.set('Cache-Control', 'no-store')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
