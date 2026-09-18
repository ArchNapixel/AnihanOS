// Single serverless entry point. Routing to this file for every path is
// forced explicitly via vercel.json's `routes` — Vercel's auto-detected
// "Express" framework preset was generating its own routing that only
// matched one dynamic path segment deep (e.g. /api/farms worked, but
// /api/farms/:id/plots/geojson 404'd before ever reaching this file).
import app from '../src/app.js'

export default app
