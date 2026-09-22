import './env.js'
import express from 'express'
import cors from 'cors'
import farmsRouter from './routes/farms.js'
import plotsRouter from './routes/plots.js'
import cropCyclesRouter from './routes/cropCycles.js'
import inputsRouter from './routes/inputs.js'
import dashboardRouter from './routes/dashboard.js'
import weatherRouter from './routes/weather.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/farms', farmsRouter)
app.use('/api/plots', plotsRouter)
app.use('/api/crop-cycles', cropCyclesRouter)
app.use('/api/inputs', inputsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/weather', weatherRouter)

export default app
