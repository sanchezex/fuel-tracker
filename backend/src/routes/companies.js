import { Router } from 'express'
import { pool } from '../lib/db.js'

export const companiesRouter = Router()

companiesRouter.get('/companies', async (req, res) => {
  const { rows } = await pool.query('select id, name, created_at from companies order by created_at desc')
  res.json(rows)
})

companiesRouter.post('/companies', async (req, res) => {
  const { name } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name is required' })

  const { rows } = await pool.query(
    'insert into companies (name) values ($1) returning id, name, created_at',
    [name]
  )

  res.status(201).json(rows[0])
})

companiesRouter.delete('/companies/:companyId', async (req, res) => {
  const companyId = Number(req.params.companyId)
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: 'companyId is invalid' })

  const { rows } = await pool.query(
    'delete from companies where id=$1 returning id',
    [companyId]
  )

  if (!rows.length) return res.status(404).json({ error: 'company not found' })
  return res.json({ ok: true })
})


