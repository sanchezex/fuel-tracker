import React, { useEffect, useState } from 'react'

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function AnalyticsInsights() {
  const [mode, setMode] = useState('vehicle') // vehicle | driver | company

  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState([])

  const [driverId, setDriverId] = useState('')
  const [drivers, setDrivers] = useState([])

  const [vehicleId, setVehicleId] = useState('')
  const [vehicles, setVehicles] = useState([])

  const [summary, setSummary] = useState(null)

  async function api(path, options = {}) {

    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed: ${res.status}`)
    }
    return res.json()
  }

  async function loadCompanies() {
    const data = await api('/api/companies')
    setCompanies(data)
    if (data[0]?.id) setCompanyId(String(data[0].id))
  }

  async function loadDrivers(cid) {
    const next = cid || companyId
    if (!next) return
    const data = await api('/api/drivers?companyId=' + encodeURIComponent(next))
    setDrivers(data)
    if (data[0]?.id) setDriverId(String(data[0].id))
  }

  async function loadVehicles(cid) {
    const next = cid || companyId
    if (!next) return
    const data = await api('/api/vehicles?companyId=' + encodeURIComponent(next))
    setVehicles(data)
    if (data[0]?.id) setVehicleId(String(data[0].id))
  }

  async function loadSummary() {
    let data = null

    if (mode === 'vehicle') {
      if (!vehicleId) return
      data = await api('/api/analytics/summary?vehicleId=' + encodeURIComponent(vehicleId))
    } else if (mode === 'company') {
      if (!companyId) return
      data = await api('/api/analytics/summaryCompany?companyId=' + encodeURIComponent(companyId))
    } else if (mode === 'driver') {
      if (!driverId) return
      data = await api('/api/analytics/summaryDriver?driverId=' + encodeURIComponent(driverId))
    }

    setSummary(data)
  }

  useEffect(() => {
    loadCompanies()
      .then(() => {
        loadDrivers().catch(console.error)
        loadVehicles().catch(console.error)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!companyId) return
    loadDrivers(companyId).catch(console.error)
    loadVehicles(companyId).catch(console.error)
  }, [companyId])

  useEffect(() => {
    loadSummary().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, vehicleId, companyId, driverId])


  return (
    <div className="grid">
      <div className="col-8">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Analytics Insights</h2>

          <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div>
              <label>Scope</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="vehicle">Vehicle</option>
                <option value="driver">Driver</option>
                <option value="company">Company</option>
              </select>
            </div>

            {mode !== 'company' && (
              <div style={{ minWidth: 240 }}>
                <label>Company</label>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'company' && (
              <div style={{ minWidth: 240 }}>
                <label>Company</label>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {mode === 'vehicle' && (
            <div style={{ marginBottom: 12 }}>
              <label>Vehicle</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'driver' && (
            <div style={{ marginBottom: 12 }}>
              <label>Driver</label>
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}


          {!summary && <p style={{ color: '#64748b' }}>Loading…</p>}

          {summary && (
            <div>
              <div className="grid" style={{ marginTop: 8 }}>
                <div className="col-4 card" style={{ margin: 0, boxShadow: 'none' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Total Distance</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(summary.totalDistanceKm)} km</div>
                </div>
                <div className="col-4 card" style={{ margin: 0, boxShadow: 'none' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Total Fuel</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(summary.totalFuelLiters)} L</div>
                </div>
                <div className="col-4 card" style={{ margin: 0, boxShadow: 'none' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Avg L/100km</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(summary.avgLitersPer100km)}</div>
                </div>
              </div>

              <div style={{ marginTop: 14, color: '#475569' }}>
                <b>Most recent entry:</b>
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  {summary.lastLog ? (
                    <span>
                      {new Date(summary.lastLog.date).toLocaleDateString()} — {fmt(summary.lastLog.distanceKm)} km,{' '}
                      {fmt(summary.lastLog.fuelLiters)} L ({fmt(summary.lastLog.litersPer100km)} L/100km)
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>

              <p style={{ marginTop: 16, fontSize: 12, color: '#64748b' }}>
                Chart-ready data can be added later (e.g., time series of L/100km).
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="col-4">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>What’s tracked</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#475569' }}>
            <li>Fuel used (liters)</li>
            <li>Odometer start/end to compute distance</li>
            <li>Liters per 100km per entry</li>
            <li>Aggregates: total distance/fuel and average L/100km</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

