import { Router } from 'express'
import { pool } from '../lib/db.js'

export const vehiclesRouter = Router()

vehiclesRouter.get('/vehicles', async (req, res) => {
  const companyId = req.query.companyId ? Number(req.query.companyId) : null

  if (!companyId) {
    const { rows } = await pool.query(
      'select id, name, vin, created_at from vehicles order by created_at desc'
    )
    return res.json(rows)
  }

  const { rows } = await pool.query(
    'select id, name, vin, created_at from vehicles where company_id = $1 order by created_at desc',
    [companyId]
  )
  res.json(rows)
})

vehiclesRouter.post('/vehicles', async (req, res) => {
  const { companyId, driverId, name, vin } = req.body || {}

  if (!companyId) return res.status(400).json({ error: 'companyId is required' })
  if (!name) return res.status(400).json({ error: 'name is required' })

  const { rows } = await pool.query(
    `insert into vehicles (company_id, driver_id, name, vin)
     values ($1,$2,$3,$4)
     returning id, name, vin, created_at`,
    [Number(companyId), driverId ? Number(driverId) : null, name, vin || null]
  )

  res.status(201).json(rows[0])
})


