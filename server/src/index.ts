import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import farmsRouter from './routes/farms.js'
import plotsRouter from './routes/plots.js'
import cropCyclesRouter from './routes/cropCycles.js'
import inputsRouter from './routes/inputs.js'
import livestockRouter from './routes/livestock.js'
import dashboardRouter from './routes/dashboard.js'

dotenv.config()

const app = express()
const port = process.env.PORT ?? 4000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/farms', farmsRouter)
app.use('/api/plots', plotsRouter)
app.use('/api/crop-cycles', cropCyclesRouter)
app.use('/api/inputs', inputsRouter)
app.use('/api/livestock', livestockRouter)
app.use('/api/dashboard', dashboardRouter)

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
