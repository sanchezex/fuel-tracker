import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { pool } from './lib/db.js'
import { vehiclesRouter } from './routes/vehicles.js'
import { fuelLogsRouter } from './routes/fuelLogs.js'
import { analyticsRouter } from './routes/analytics.js'
import { companiesRouter } from './routes/companies.js'
import { driversRouter } from './routes/drivers.js'


const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api', vehiclesRouter)
app.use('/api', fuelLogsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api', companiesRouter)
app.use('/api', driversRouter)


const port = process.env.PORT ? Number(process.env.PORT) : 3000

app.listen(port, async () => {
  const client = await pool.connect()
  client.release()
  console.log(`Backend listening on ${port}`)
})

