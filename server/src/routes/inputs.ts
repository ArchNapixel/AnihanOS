import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ message: 'inputs endpoint placeholder' })
})

export default router
