import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Map, Package, Sprout, Users } from 'lucide-react'
import { getOrCreateDefaultFarm, type Farm } from '../../lib/farmApi'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import { listCropCycles, type CropCycle } from '../crops/cropCyclesApi'
import { getCurrentStage, getProgressPercentage } from '../../lib/growthStage'
import { listInputStock, type InputStock } from '../inputs/inputStockApi'
import { listLivestockGroups, type LivestockGroup } from '../livestock/livestockGroupsApi'
import { listRecentRecordsForFarm, type LivestockRecord } from '../livestock/livestockRecordsApi'
import './DashboardPage.css'

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function DashboardPage() {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [plots, setPlots] = useState<Plot[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [inputStock, setInputStock] = useState<InputStock[]>([])
  const [livestockGroups, setLivestockGroups] = useState<LivestockGroup[]>([])
  const [recentRecords, setRecentRecords] = useState<LivestockRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [farmData, plotsData, cyclesData, inputStockData, livestockGroupsData] = await Promise.all([
          getOrCreateDefaultFarm(),
          listPlots(),
          listCropCycles(),
          listInputStock(),
          listLivestockGroups(),
        ])
        setFarm(farmData)
        setPlots(plotsData)
        setCycles(cyclesData)
        setInputStock(inputStockData)
        setLivestockGroups(livestockGroupsData)
        setRecentRecords(await listRecentRecordsForFarm(livestockGroupsData.map((g) => g.id)))
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

  const lowStockItems = inputStock.filter((item) => item.current_quantity <= item.low_stock_threshold)
  const recentHealthRecords = recentRecords.filter((r) => r.record_type === 'health').slice(0, 3)
  const groupNameById = Object.fromEntries(livestockGroups.map((g) => [g.id, g.animal_type]))

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
            <div className="stat-number">{loading ? '—' : lowStockItems.length}</div>
            <div className="stat-label">Low-Stock Items</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">
            <Users size={20} />
          </span>
          <div>
            <div className="stat-number">{loading ? '—' : livestockGroups.length}</div>
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
        <div className="dashboard-card plots-overview-card">
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
            <div className="mini-plot-list">
              {plots.map((plot) => (
                <Link to={`/land-plots?plot=${plot.id}`} className="mini-plot-card" key={plot.id}>
                  <h3>{plot.name}</h3>
                  <p>{plot.soil_type ?? `${plot.size} ${plot.size_unit}`}</p>
                </Link>
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
                {upcomingHarvests.map((cycle) => {
                  const stage = getCurrentStage(cycle.planting_date, cycle.crop_types.growth_stages)
                  const stageName = stage.readyForHarvest ? 'Ready for harvest' : (stage.stage?.name ?? 'Growing')
                  const percentage = getProgressPercentage(cycle.planting_date, cycle.expected_harvest_date)

                  return (
                    <li key={cycle.id}>
                      <Link to={`/land-plots?plot=${cycle.plot_id}`} className="harvest-item">
                        <div className="harvest-item-header">
                          <strong>{cycle.crop_types.name}</strong>
                          <span>{cycle.plots.name}</span>
                        </div>
                        <div className="harvest-progress-track">
                          <div className="harvest-progress-fill" style={{ width: `${percentage ?? 0}%` }} />
                        </div>
                        <div className="harvest-progress-meta">
                          <span>{stageName}</span>
                          <span>{percentage != null ? `${percentage}%` : '—'}</span>
                        </div>
                        <span className="harvest-date">Est. harvest {formatDate(cycle.expected_harvest_date!)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="dashboard-card">
            <h2>
              <AlertTriangle size={18} /> Low Stock Alerts
            </h2>
            {loading ? (
              <p className="dashboard-empty">Loading...</p>
            ) : lowStockItems.length === 0 ? (
              <p className="dashboard-empty">All input stock is above threshold.</p>
            ) : (
              <ul className="alert-list">
                {lowStockItems.map((item) => (
                  <li key={item.id}>
                    <Link to="/inputs" className="alert-item">
                      <strong>{item.name}</strong>
                      <span>
                        {item.current_quantity} {item.unit} left (threshold {item.low_stock_threshold})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dashboard-card">
            <h2>
              <Users size={18} /> Livestock Flags
            </h2>
            {loading ? (
              <p className="dashboard-empty">Loading...</p>
            ) : recentHealthRecords.length === 0 ? (
              <p className="dashboard-empty">No recent health records.</p>
            ) : (
              <ul className="alert-list">
                {recentHealthRecords.map((record) => (
                  <li key={record.id}>
                    <Link to="/livestock" className="alert-item">
                      <strong>{groupNameById[record.livestock_group_id] ?? 'Unknown group'}</strong>
                      <span>{(record.details as { description: string }).description}</span>
                      <span>{formatDate(record.date)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
