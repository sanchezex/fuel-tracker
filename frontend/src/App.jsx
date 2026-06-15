import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import FuelLogs from './pages/FuelLogs.jsx'
import AnalyticsInsights from './pages/AnalyticsInsights.jsx'
import AnalyticsKpisAndCharts from './pages/AnalyticsKpisAndCharts.jsx'


export default function App() {
  return (
    <div>
      <div className="nav">
        <Link to="/logs">Fuel Logs</Link>
        <Link to="/analytics">Analytics</Link>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/logs" replace />} />
          <Route path="/logs" element={<FuelLogs />} />
          <Route path="/analytics" element={<AnalyticsInsights />} />
          <Route path="/analytics/summary" element={<AnalyticsKpisAndCharts />} />



        </Routes>
      </div>
    </div>
  )
}

