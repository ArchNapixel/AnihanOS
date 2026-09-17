// Local dev entry point only — starts a real listening server. The
// deployed (Vercel) entry point is server/api/[...all].ts, which imports
// the same app.js but never calls .listen() (serverless functions don't
// own a port; the platform invokes the app per-request instead).
import app from './app.js'

const port = process.env.PORT ?? 4000

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
