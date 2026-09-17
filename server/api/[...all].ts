// Vercel treats any file under /api as a serverless function; this
// catch-all forwards every request path to the same Express app used for
// local dev, so /api/farms/:farmId/plots/geojson etc. keep working as-is.
import app from '../src/app.js'

export default app
