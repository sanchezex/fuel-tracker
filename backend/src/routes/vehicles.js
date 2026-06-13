import { Router } from 'express'
import { pool } from '../lib/db.js'

export const vehiclesRouter = Router()

vehiclesRouter.get('/vehicles', async (req, res) => {
  const { rows } = await pool.query('select id, name, vin, created_at from vehicles order by created_at desc')
  res.json(rows)
})

vehiclesRouter.post('/vehicles', async (req, res) => {
  const { name, vin } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name is required' })

  const { rows } = await pool.query(
    'insert into vehicles (name, vin) values ($1, $2) returning id, name, vin, created_at',
    [name, vin || null]
  )
  res.status(201).json(rows[0])
})

