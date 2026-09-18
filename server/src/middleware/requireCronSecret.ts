import type { RequestHandler } from 'express'

// Shared-secret check for Vercel Cron-triggered routes (see server/vercel.json).
// Cron invokes over plain HTTP, so this is the only thing stopping an outside
// caller from triggering the job themselves.
export const requireCronSecret: RequestHandler = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}
