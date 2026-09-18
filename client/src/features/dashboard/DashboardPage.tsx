import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, DollarSign, Map, Package, Sprout, Users } from 'lucide-react'
import { getOrCreateDefaultFarm, type Farm } from '../../lib/farmApi'
import { useFarm } from '../../lib/FarmContext'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import { listCropCycles, type CropCycle } from '../crops/cropCyclesApi'
import { getCurrentStage, getProgressPercentage } from '../../lib/growthStage'
import { listInputStock, type InputStock } from '../inputs/inputStockApi'
import { listLivestockGroups, type LivestockGroup } from '../livestock/livestockGroupsApi'
import { listRecentRecordsForFarm, type LivestockRecord } from '../livestock/livestockRecordsApi'
import { listCropCycleFinancials, type CropCycleFinancials } from '../financials/financialsApi'
import { listActivitiesForFarm, type FieldActivity } from '../crops/fieldActivitiesApi'
import { computeWeedRisk } from '../../lib/weedRisk'
import { formatDateShort } from '../../lib/dateUtils'
import { listWeatherForFarm, type WeatherDaily } from './weatherApi'
import WeatherWidget from './WeatherWidget'
import './DashboardPage.css'

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function DashboardPage() {
  const { enabledModules } = useFarm()
  const hasCrops = enabledModules.includes('crops')
  const hasLivestock = enabledModules.includes('livestock')
  const [farm, setFarm] = useState<Farm | null>(null)
  const [plots, setPlots] = useState<Plot[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [inputStock, setInputStock] = useState<InputStock[]>([])
  const [livestockGroups, setLivestockGroups] = useState<LivestockGroup[]>([])
  const [recentRecords, setRecentRecords] = useState<LivestockRecord[]>([])
  const [financials, setFinancials] = useState<CropCycleFinancials[]>([])
  const [fieldActivities, setFieldActivities] = useState<FieldActivity[]>([])
  const [weather, setWeather] = useState<WeatherDaily[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [farmData, plotsData, cyclesData, inputStockData, livestockGroupsData, financialsData] =
          await Promise.all([
            getOrCreateDefaultFarm(),
            listPlots(),
            listCropCycles(),
            listInputStock(),
            listLivestockGroups(),
            listCropCycleFinancials(),
          ])
        setFarm(farmData)
        setPlots(plotsData)
        setCycles(cyclesData)
        setInputStock(inputStockData)
        setLivestockGroups(livestockGroupsData)
        setFinancials(financialsData)
        setRecentRecords(await listRecentRecordsForFarm(livestockGroupsData.map((g) => g.id)))
        setFieldActivities(await listActivitiesForFarm(plotsData.map((p) => p.id)))
        setWeather(await listWeatherForFarm(farmData.id))
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

  const soldHarvests = financials.filter((f) => f.revenue != null)
  const financialTotals = soldHarvests.reduce(
    (acc, f) => ({
      revenue: acc.revenue + (f.revenue ?? 0),
      cost: acc.cost + f.inputCost + (f.cycle.other_costs ?? 0),
      profit: acc.profit + (f.profit ?? 0),
    }),
    { revenue: 0, cost: 0, profit: 0 },
  )
  const profitTrend = [...soldHarvests]
    .sort((a, b) => (a.cycle.actual_harvest_date! < b.cycle.actual_harvest_date! ? -1 : 1))
    .slice(-6)
    .map((f) => ({ label: f.cycle.crop_types.name, profit: f.profit ?? 0 }))

  const weedRiskPlots = useMemo(() => {
    const lastWeedingByPlot = new globalThis.Map<string, string>()
    for (const activity of fieldActivities) {
      if (activity.activity_type !== 'weeding') continue
      const existing = lastWeedingByPlot.get(activity.plot_id)
      if (!existing || activity.date > existing) {
        lastWeedingByPlot.set(activity.plot_id, activity.date)
      }
    }

    const activeCycleByPlot = new globalThis.Map<string, CropCycle>()
    for (const cycle of cycles) {
      if (cycle.status === 'harvested') continue
      const existing = activeCycleByPlot.get(cycle.plot_id)
      if (!existing || existing.planting_date < cycle.planting_date) {
        activeCycleByPlot.set(cycle.plot_id, cycle)
      }
    }

    const results: { plotId: string; plotName: string }[] = []
    for (const [plotId, cycle] of activeCycleByPlot) {
      const risk = computeWeedRisk(
        cycle.planting_date,
        cycle.crop_types.canopy_closure_days,
        lastWeedingByPlot.get(plotId) ?? null,
      )
      if (risk === 'high') {
        results.push({ plotId, plotName: cycle.plots.name })
      }
    }
    return results
  }, [cycles, fieldActivities])

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Mabuhay{farm ? `, ${farm.name}` : ''}</h1>
        <p>{today}</p>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      {!loading && <WeatherWidget days={weather} />}

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

        {hasCrops && (
          <div className="stat-card">
            <span className="stat-icon">
              <Sprout size={20} />
            </span>
            <div>
              <div className="stat-number">{loading ? '—' : activeCycles.length}</div>
              <div className="stat-label">Active Crop Cycles</div>
            </div>
          </div>
        )}

        {hasCrops && (
          <div className="stat-card stat-card-alert">
            <span className="stat-icon stat-icon-alert">
              <AlertTriangle size={20} />
            </span>
            <div>
              <div className="stat-number">{loading ? '—' : lowStockItems.length}</div>
              <div className="stat-label">Low-Stock Items</div>
            </div>
          </div>
        )}

        {hasLivestock && (
          <div className="stat-card">
            <span className="stat-icon">
              <Users size={20} />
            </span>
            <div>
              <div className="stat-number">{loading ? '—' : livestockGroups.length}</div>
              <div className="stat-label">Livestock Groups</div>
            </div>
          </div>
        )}
      </div>

      <div className="quick-actions">
        {hasCrops && (
          <Link to="/inputs" className="btn-outline">
            <Package size={16} /> Log Input Usage
          </Link>
        )}
        {hasCrops && (
          <Link to="/crops" className="btn-outline">
            <Sprout size={16} /> Add Crop Cycle
          </Link>
        )}
        {hasLivestock && (
          <Link to="/livestock" className="btn-outline">
            <Users size={16} /> Add Livestock Record
          </Link>
        )}
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
          {hasCrops && (
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
                          <span className="harvest-date">Est. harvest {formatDateShort(cycle.expected_harvest_date!)}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {hasCrops && (
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
          )}

          {hasLivestock && (
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
                        <span>{formatDateShort(record.date)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {hasCrops && (
        <div className="dashboard-columns dashboard-columns-secondary">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>
                <DollarSign size={18} /> Harvest Profit Summary
              </h2>
              <Link to="/financials" className="dashboard-card-link">
                View ledger
              </Link>
            </div>

            {loading ? (
              <p className="dashboard-empty">Loading...</p>
            ) : soldHarvests.length === 0 ? (
              <p className="dashboard-empty">No recorded sales yet — record a sale in Crops to see totals here.</p>
            ) : (
              <>
                <div className="financial-summary-stats">
                  <div>
                    <span>Total Revenue</span>
                    <strong>{financialTotals.revenue.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Total Cost</span>
                    <strong>{financialTotals.cost.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Total Profit</span>
                    <strong className={financialTotals.profit < 0 ? 'financials-negative' : ''}>
                      {financialTotals.profit.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <ProfitTrendChart data={profitTrend} />
              </>
            )}
          </div>

          <div className="dashboard-card">
            <h2>
              <AlertTriangle size={18} /> Weed Risk Alerts
            </h2>
            <p className="dashboard-hint">
              Estimated risk based on typical growth patterns, not a guarantee — inspect your field directly.
            </p>
            {loading ? (
              <p className="dashboard-empty">Loading...</p>
            ) : weedRiskPlots.length === 0 ? (
              <p className="dashboard-empty">No plots currently at high weed risk.</p>
            ) : (
              <ul className="alert-list">
                {weedRiskPlots.map((entry) => (
                  <li key={entry.plotId}>
                    <Link to={`/land-plots?plot=${entry.plotId}`} className="alert-item">
                      <strong>{entry.plotName}</strong>
                      <span className="weed-risk-badge weed-risk-high">High risk</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProfitTrendChart({ data }: { data: { label: string; profit: number }[] }) {
  if (data.length === 0) {
    return <p className="dashboard-empty">Not enough sold harvests yet for a trend.</p>
  }

  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.profit)))
  const barWidth = 100 / data.length

  return (
    <svg viewBox="0 0 100 50" className="profit-trend-chart" preserveAspectRatio="none">
      <line x1="0" y1="25" x2="100" y2="25" className="profit-trend-baseline" />
      {data.map((d, i) => {
        const barHeight = (Math.abs(d.profit) / maxAbs) * 22
        const x = i * barWidth + barWidth * 0.2
        const width = barWidth * 0.6
        const y = d.profit >= 0 ? 25 - barHeight : 25
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={width}
            height={Math.max(barHeight, 1)}
            className={d.profit >= 0 ? 'profit-bar-positive' : 'profit-bar-negative'}
          >
            <title>
              {d.label}: {d.profit.toFixed(2)}
            </title>
          </rect>
        )
      })}
    </svg>
  )
}

export default DashboardPage
