import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ message: 'crop cycles endpoint placeholder' })
})

export default router
