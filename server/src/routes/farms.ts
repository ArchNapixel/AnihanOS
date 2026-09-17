import { Router } from 'express'
import { createUserScopedClient } from '../lib/supabaseUserClient.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ message: 'farms endpoint placeholder' })
})

router.get('/:farmId/plots/geojson', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }

  const accessToken = authHeader.slice('Bearer '.length)
  const supabase = createUserScopedClient(accessToken)

  const { data, error } = await supabase.rpc('get_farm_plots_geojson', {
    p_farm_id: req.params.farmId,
  })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  // Plot data changes on every create/edit/delete — Express's default
  // ETag generation was letting the browser skip re-fetching and serve a
  // stale cached response (visible as 304s even after new plots were added).
  res.set('Cache-Control', 'no-store')
  res.json(data)
})

export default router
