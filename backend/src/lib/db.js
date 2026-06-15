import dotenv from 'dotenv'
import pg from 'pg'


dotenv.config({ path: new URL('../.env', import.meta.url) })





const { Pool } = pg

function buildPoolOptions() {
  const sslEnabled = process.env.DATABASE_SSL === 'true'
  const base = {
    connectionString: process.env.DATABASE_URL
  }

  if (sslEnabled) {
    base.ssl = { rejectUnauthorized: false }
  }

  return base
}

export const pool = new Pool(buildPoolOptions())



