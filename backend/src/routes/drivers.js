import { Router } from 'express'
import { pool } from '../lib/db.js'

export const driversRouter = Router()

driversRouter.get('/drivers', async (req, res) => {
  const companyId = req.query.companyId ? Number(req.query.companyId) : null

  if (!companyId) return res.json([])

  const { rows } = await pool.query(
    'select id, company_id as companyId, name, created_at from drivers where company_id = $1 order by created_at desc',
    [companyId]
  )

  res.json(rows)
})

driversRouter.post('/drivers', async (req, res) => {
  const { companyId, name } = req.body || {}
  if (!companyId) return res.status(400).json({ error: 'companyId is required' })
  if (!name) return res.status(400).json({ error: 'name is required' })

  const { rows } = await pool.query(
    'insert into drivers (company_id, name) values ($1,$2) returning id, company_id as companyId, name, created_at',
    [Number(companyId), name]
  )

  res.status(201).json(rows[0])
})

