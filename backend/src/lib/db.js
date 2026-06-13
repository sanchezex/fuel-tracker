import pg from 'pg'

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


