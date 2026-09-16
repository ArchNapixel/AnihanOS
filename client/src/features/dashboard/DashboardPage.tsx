import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Map, Package, Sprout, Users } from 'lucide-react'
import { getOrCreateDefaultFarm, type Farm } from '../../lib/farmApi'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import { listCropCycles, type CropCycle } from '../crops/cropCyclesApi'
import './DashboardPage.css'

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function DashboardPage() {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [plots, setPlots] = useState<Plot[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [farmData, plotsData, cyclesData] = await Promise.all([
          getOrCreateDefaultFarm(),
          listPlots(),
          listCropCycles(),
        ])
        setFarm(farmData)
        setPlots(plotsData)
        setCycles(cyclesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const activeCycles = cycles.filter((c) => c.status !== 'harvested')
  const upcomingHarvests = activeCycles
    .filter((c) => c.expected_harvest_date)
    .sort((a, b) => (a.expected_harvest_date! < b.expected_harvest_date! ? -1 : 1))
    .slice(0, 3)

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Mabuhay{farm ? `, ${farm.name}` : ''}</h1>
        <p>{today}</p>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">
            <Map size={20} />
          </span>
          <div>
            <div className="stat-number">{loading ? '—' : plots.length}</div>
            <div className="stat-label">Total Plots</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">
            <Sprout size={20} />
          </span>
          <div>
            <div className="stat-number">{loading ? '—' : activeCycles.length}</div>
            <div className="stat-label">Active Crop Cycles</div>
          </div>
        </div>

        <div className="stat-card stat-card-alert">
          <span className="stat-icon stat-icon-alert">
            <AlertTriangle size={20} />
          </span>
          <div>
            <div className="stat-number">0</div>
            <div className="stat-label">Low-Stock Items</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">
            <Users size={20} />
          </span>
          <div>
            <div className="stat-number">0</div>
            <div className="stat-label">Livestock Groups</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/inputs" className="btn-outline">
          <Package size={16} /> Log Input Usage
        </Link>
        <Link to="/crops" className="btn-outline">
          <Sprout size={16} /> Add Crop Cycle
        </Link>
        <Link to="/livestock" className="btn-outline">
          <Users size={16} /> Add Livestock Record
        </Link>
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>
              <Map size={18} /> Plots Overview
            </h2>
            <Link to="/land-plots" className="dashboard-card-link">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="dashboard-empty">Loading...</p>
          ) : plots.length === 0 ? (
            <p className="dashboard-empty">No plots yet — add your first one in Plots.</p>
          ) : (
            <div className="mini-plot-grid">
              {plots.slice(0, 4).map((plot) => (
                <div className="mini-plot-card" key={plot.id}>
                  <h3>{plot.name}</h3>
                  <p>{plot.soil_type ?? `${plot.size} ${plot.size_unit}`}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-side">
          <div className="dashboard-card">
            <h2>
              <Clock size={18} /> Upcoming Harvests
            </h2>
            {loading ? (
              <p className="dashboard-empty">Loading...</p>
            ) : upcomingHarvests.length === 0 ? (
              <p className="dashboard-empty">No upcoming harvests.</p>
            ) : (
              <ul className="upcoming-harvest-list">
                {upcomingHarvests.map((cycle) => (
                  <li key={cycle.id}>
                    <strong>{cycle.crop_types.name}</strong>
                    <span>{cycle.plots.name}</span>
                    <span>{cycle.expected_harvest_date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dashboard-card">
            <h2>
              <AlertTriangle size={18} /> Low Stock Alerts
            </h2>
            <p className="dashboard-empty">Input stock tracking isn't set up yet.</p>
          </div>

          <div className="dashboard-card">
            <h2>
              <Users size={18} /> Livestock Flags
            </h2>
            <p className="dashboard-empty">Livestock tracking isn't set up yet.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
