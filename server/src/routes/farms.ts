import { Router } from 'express'
import { placeholder, plotsGeoJson } from '../controllers/farmsController.js'

const router = Router()

router.get('/', placeholder)
router.get('/:farmId/plots/geojson', plotsGeoJson)

export default router
