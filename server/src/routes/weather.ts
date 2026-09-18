import { Router } from 'express'
import { requireCronSecret } from '../middleware/requireCronSecret.js'
import { sync } from '../controllers/weatherController.js'

const router = Router()

router.get('/sync', requireCronSecret, sync)

export default router
