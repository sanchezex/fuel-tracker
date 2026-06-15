import React, { useEffect, useMemo, useState } from 'react'

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

export default function AnalyticsKpisAndCharts() {
  const [vehicleId, setVehicleId] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [logs, setLogs] = useState([])

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

  async function loadVehicles() {
    const data = await api('/api/vehicles')
    setVehicles(data)
    if (data[0]?.id) setVehicleId(String(data[0].id))
  }

  async function loadLogs() {
    if (!vehicleId) return
    const data = await api('/api/fuellogs?vehicleId=' + encodeURIComponent(vehicleId))
    setLogs(data)
  }

  useEffect(() => {
    loadVehicles().catch(console.error)
  }, [])

  useEffect(() => {
    loadLogs().catch(console.error)
  }, [vehicleId])

  const kpis = useMemo(() => {
    const distances = logs.map((l) => Number(l.distanceKm)).filter((n) => Number.isFinite(n))
    const fuels = logs.map((l) => Number(l.fuelLiters)).filter((n) => Number.isFinite(n))
    const l100 = logs.map((l) => Number(l.litersPer100km)).filter((n) => Number.isFinite(n))

    const totalDistanceKm = distances.reduce((a, b) => a + b, 0)
    const totalFuelLiters = fuels.reduce((a, b) => a + b, 0)
    const avgLitersPer100km = l100.length ? l100.reduce((a, b) => a + b, 0) / l100.length : null

    return {
      totalDistanceKm,
      totalFuelLiters,
      avgLitersPer100km
    }
  }, [logs])

  const histogram = useMemo(() => {
    // Simple histogram over liters/100km
    const values = logs
      .map((l) => Number(l.litersPer100km))
      .filter((n) => Number.isFinite(n) && n >= 0)

    if (!values.length) {
      return {
        bins: [],
        min: null,
        max: null
      }
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const bucketCount = 8
    const span = max - min || 1

    const bins = Array.from({ length: bucketCount }, (_, i) => {
      const start = min + (span * i) / bucketCount
      const end = min + (span * (i + 1)) / bucketCount
      return { start, end, count: 0 }
    })

    for (const v of values) {
      const idx = clamp(Math.floor(((v - min) / span) * bucketCount), 0, bucketCount - 1)
      bins[idx].count += 1
    }

    return { bins, min, max }
  }, [logs])

  const series = useMemo(() => {
    // Latest-first series for a simple sparkline (distance)
    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date))
    const points = sorted
      .map((l) => ({
        date: l.date,
        distanceKm: Number(l.distanceKm),
        litersPer100km: Number(l.litersPer100km)
      }))
      .filter((p) => Number.isFinite(p.distanceKm))

    const yVals = points.map((p) => p.litersPer100km).filter((n) => Number.isFinite(n))
    return { points, l100Min: yVals.length ? Math.min(...yVals) : null, l100Max: yVals.length ? Math.max(...yVals) : null }
  }, [logs])

  return (
    <div className="grid">
      <div className="col-8">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Analytics (KPIs & Charts)</h2>

          <div style={{ marginBottom: 12 }}>
            <label>Vehicle (charts are vehicle-scoped)</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>


          <div className="grid" style={{ marginTop: 10 }}>
            <div className="col-4 card" style={{ margin: 0, boxShadow: 'none' }}>
              <div style={{ color: '#0f766e', fontSize: 12, fontWeight: 800 }}>Total Distance</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{fmt(kpis.totalDistanceKm)} km</div>
            </div>
            <div className="col-4 card" style={{ margin: 0, boxShadow: 'none' }}>
              <div style={{ color: '#0f766e', fontSize: 12, fontWeight: 800 }}>Total Fuel</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{fmt(kpis.totalFuelLiters)} L</div>
            </div>
            <div className="col-4 card" style={{ margin: 0, boxShadow: 'none' }}>
              <div style={{ color: '#0f766e', fontSize: 12, fontWeight: 800 }}>Avg L/100km</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{fmt(kpis.avgLitersPer100km)}</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 8 }}>Histogram: liters/100km</h3>
            {histogram.bins.length === 0 ? (
              <p style={{ color: '#64748b' }}>Add fuel logs to see the histogram.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10, alignItems: 'end' }}>
                {histogram.bins.map((b, idx) => {
                  const maxCount = Math.max(...histogram.bins.map((x) => x.count)) || 1
                  const heightPct = (b.count / maxCount) * 100
                  return (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <div
                        title={`${b.start.toFixed(1)}–${b.end.toFixed(1)} L/100km: ${b.count}`}
                        style={{
                          height: 110,
                          borderRadius: 10,
                          border: '1px solid rgba(22,163,74,0.25)',
                          background: 'linear-gradient(180deg, rgba(34,197,94,0.35), rgba(22,163,74,0.08))',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          padding: 6
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: `${heightPct}%`,
                            borderRadius: 8,
                            background: 'linear-gradient(180deg, #22c55e, #16a34a)'
                          }}
                        />
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{b.count}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 8 }}>Trend: liters/100km</h3>
            {series.points.length === 0 || series.l100Min === null ? (
              <p style={{ color: '#64748b' }}>Add fuel logs to see the trend chart.</p>
            ) : (
              <div className="chartWrap">
                <svg viewBox="0 0 600 170" className="chartSvg" role="img" aria-label="Liters per 100km trend">
                  <defs>
                    <linearGradient id="trendGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity="0.04" />
                    </linearGradient>
                  </defs>

                  {(() => {
                    const left = 25
                    const right = 20
                    const top = 18
                    const bottom = 28
                    const w = 600 - left - right
                    const h = 170 - top - bottom

                    const pts = series.points
                      .map((p, i) => {
                        const yVal = Number(p.litersPer100km)
                        if (!Number.isFinite(yVal)) return null
                        const x = left + (w * i) / Math.max(1, series.points.length - 1)
                        const y = top + h - (h * (yVal - series.l100Min)) / Math.max(1e-9, (series.l100Max - series.l100Min))
                        return { x, y, yVal }
                      })
                      .filter(Boolean)

                    if (!pts.length) return null

                    const path = pts
                      .map((p, i) => {
                        if (i === 0) return `M ${p.x} ${p.y}`
                        return `L ${p.x} ${p.y}`
                      })
                      .join(' ')

                    const areaPath = `${path} L ${pts[pts.length - 1].x} ${top + h} L ${pts[0].x} ${top + h} Z`

                    return (
                      <>
                        <g opacity="0.85">
                          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                            const y = top + h - h * t
                            return (
                              <line
                                key={i}
                                x1={left}
                                x2={left + w}
                                y1={y}
                                y2={y}
                                stroke="rgba(15,118,110,0.12)"
                                strokeWidth="1"
                              />
                            )
                          })}
                        </g>

                        <path d={areaPath} fill="url(#trendGreen)" />
                        <path d={path} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

                        {pts.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#16a34a" strokeWidth="2" />
                        ))}
                      </>
                    )
                  })()}
                </svg>

                <div className="chartLegend">
                  <div className="legendItem">
                    <span className="legendSwatch" />
                    <span>Liters/100km</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-4">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Charts summary</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#475569' }}>
            <li>KPIs: totals + average</li>
            <li>Histogram over L/100km</li>
            <li>Simple trend line over time</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
            Note: charts render from the same API data used by Fuel Logs.
          </p>
        </div>
      </div>
    </div>
  )
}

