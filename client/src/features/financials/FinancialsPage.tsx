import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import { listCropCycleFinancials, type CropCycleFinancials } from './financialsApi'
import {
  listWageEntries,
  createWageEntry,
  updateWageEntry,
  deleteWageEntry,
  type WageEntry,
  type WageEntryInput,
} from './wageEntriesApi'
import { getWeekRange, getWeeksOverlappingMonth } from '../../lib/weekRange'
import CsvPreviewModal from './CsvPreviewModal'
import WageEntryFormModal from './WageEntryFormModal'
import WeeklyWageEntriesModal from './WeeklyWageEntriesModal'
import './FinancialsPage.css'

type SortKey =
  | 'plot'
  | 'crop'
  | 'planting_date'
  | 'actual_harvest_date'
  | 'yield_amount'
  | 'selling_price_per_unit'
  | 'revenue'
  | 'inputCost'
  | 'other_costs'
  | 'profit'
  | 'marginPercent'

type WageSortKey = 'week' | 'entries' | 'hours' | 'amount'

type WeeklyWageSummary = {
  weekStart: string
  weekLabel: string
  entries: WageEntry[]
  totalHours: number
  totalAmount: number
}

function getSortValue(row: CropCycleFinancials, key: SortKey): string | number | null {
  switch (key) {
    case 'plot':
      return row.cycle.plots.name
    case 'crop':
      return row.cycle.crop_types.name
    case 'planting_date':
      return row.cycle.planting_date
    case 'actual_harvest_date':
      return row.cycle.actual_harvest_date
    case 'yield_amount':
      return row.cycle.yield_amount
    case 'selling_price_per_unit':
      return row.cycle.selling_price_per_unit
    case 'other_costs':
      return row.cycle.other_costs
    case 'revenue':
      return row.revenue
    case 'inputCost':
      return row.inputCost
    case 'profit':
      return row.profit
    case 'marginPercent':
      return row.marginPercent
    default:
      return null
  }
}

function getWageSortValue(row: WeeklyWageSummary, key: WageSortKey): string | number | null {
  switch (key) {
    case 'week':
      return row.weekStart
    case 'entries':
      return row.entries.length
    case 'hours':
      return row.totalHours
    case 'amount':
      return row.totalAmount
    default:
      return null
  }
}

function formatNumber(value: number | null): string {
  return value != null ? value.toFixed(2) : '—'
}

function FinancialsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rows, setRows] = useState<CropCycleFinancials[]>([])
  const [plots, setPlots] = useState<Plot[]>([])
  const [wageRows, setWageRows] = useState<WageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [plotFilter, setPlotFilter] = useState(searchParams.get('plot') ?? 'all')
  const [cropFilter, setCropFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('planting_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false)

  const [wagePlotFilter, setWagePlotFilter] = useState('all')
  const [wageJobFilter, setWageJobFilter] = useState('all')
  const [wageMonthFilter, setWageMonthFilter] = useState(() => new Date().toISOString().slice(0, 7))
  const [wageWeekFilter, setWageWeekFilter] = useState('all')
  const [wageSortKey, setWageSortKey] = useState<WageSortKey>('week')
  const [wageSortDir, setWageSortDir] = useState<'asc' | 'desc'>('desc')
  const [wageFormOpen, setWageFormOpen] = useState(false)
  const [editingWage, setEditingWage] = useState<WageEntry | null>(null)
  const [wageSaving, setWageSaving] = useState(false)
  const [wageError, setWageError] = useState<string | null>(null)
  const [viewingWeekStart, setViewingWeekStart] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [financials, plotsData, wageData] = await Promise.all([
        listCropCycleFinancials(),
        listPlots(),
        listWageEntries(),
      ])
      setRows(financials)
      setPlots(plotsData)
      setWageRows(wageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  // Deep-link support from a plot's detail view (?plot=<id>).
  useEffect(() => {
    const plotId = searchParams.get('plot')
    if (plotId) {
      setPlotFilter(plotId)
      setSearchParams(
        (params) => {
          params.delete('plot')
          return params
        },
        { replace: true },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cropOptions = useMemo(() => {
    const names = new Set(rows.map((r) => r.cycle.crop_types.name))
    return Array.from(names).sort()
  }, [rows])

  const jobOptions = useMemo(() => {
    const names = new Set(wageRows.map((r) => r.job_done))
    return Array.from(names).sort()
  }, [wageRows])

  const weeksInMonth = useMemo(() => {
    if (!wageMonthFilter) return []
    const [year, month] = wageMonthFilter.split('-').map(Number)
    return getWeeksOverlappingMonth(year, month - 1)
  }, [wageMonthFilter])

  useEffect(() => {
    setWageWeekFilter('all')
  }, [wageMonthFilter])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (plotFilter !== 'all' && row.cycle.plot_id !== plotFilter) return false
      if (cropFilter !== 'all' && row.cycle.crop_types.name !== cropFilter) return false
      if (fromDate && row.cycle.planting_date < fromDate) return false
      if (toDate && row.cycle.planting_date > toDate) return false
      return true
    })
  }, [rows, plotFilter, cropFilter, fromDate, toDate])

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows]
    copy.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [filteredRows, sortKey, sortDir])

  const totals = useMemo(() => {
    return sortedRows.reduce(
      (acc, row) => ({
        revenue: acc.revenue + (row.revenue ?? 0),
        inputCost: acc.inputCost + row.inputCost,
        otherCosts: acc.otherCosts + (row.cycle.other_costs ?? 0),
        profit: acc.profit + (row.profit ?? 0),
      }),
      { revenue: 0, inputCost: 0, otherCosts: 0, profit: 0 },
    )
  }, [sortedRows])

  const filteredWageRows = useMemo(() => {
    let rangeStart: string | null = null
    let rangeEnd: string | null = null

    if (wageWeekFilter === 'all') {
      if (weeksInMonth.length > 0) {
        rangeStart = weeksInMonth[0].start
        rangeEnd = weeksInMonth[weeksInMonth.length - 1].end
      }
    } else {
      const week = weeksInMonth.find((w) => w.start === wageWeekFilter)
      if (week) {
        rangeStart = week.start
        rangeEnd = week.end
      }
    }

    return wageRows.filter((row) => {
      if (wagePlotFilter !== 'all' && row.plot_id !== wagePlotFilter) return false
      if (wageJobFilter !== 'all' && row.job_done !== wageJobFilter) return false
      if (rangeStart && row.work_date < rangeStart) return false
      if (rangeEnd && row.work_date > rangeEnd) return false
      return true
    })
  }, [wageRows, wagePlotFilter, wageJobFilter, wageWeekFilter, weeksInMonth])

  const weeklyWageSummaries = useMemo(() => {
    const map = new Map<string, WeeklyWageSummary>()
    for (const row of filteredWageRows) {
      const week = getWeekRange(row.work_date)
      let summary = map.get(week.start)
      if (!summary) {
        summary = { weekStart: week.start, weekLabel: week.label, entries: [], totalHours: 0, totalAmount: 0 }
        map.set(week.start, summary)
      }
      summary.entries.push(row)
      summary.totalHours += row.hours ?? 0
      summary.totalAmount += row.amount
    }
    return Array.from(map.values())
  }, [filteredWageRows])

  const sortedWeeklySummaries = useMemo(() => {
    const copy = [...weeklyWageSummaries]
    copy.sort((a, b) => {
      const va = getWageSortValue(a, wageSortKey)
      const vb = getWageSortValue(b, wageSortKey)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (va < vb) return wageSortDir === 'asc' ? -1 : 1
      if (va > vb) return wageSortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [weeklyWageSummaries, wageSortKey, wageSortDir])

  const wageGrandTotals = useMemo(() => {
    return sortedWeeklySummaries.reduce(
      (acc, week) => ({
        hours: acc.hours + week.totalHours,
        amount: acc.amount + week.totalAmount,
      }),
      { hours: 0, amount: 0 },
    )
  }, [sortedWeeklySummaries])

  const viewingWeek = sortedWeeklySummaries.find((w) => w.weekStart === viewingWeekStart) ?? null

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const toggleWageSort = (key: WageSortKey) => {
    if (wageSortKey === key) {
      setWageSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setWageSortKey(key)
      setWageSortDir('desc')
    }
  }

  const openCreateWageForm = () => {
    setEditingWage(null)
    setWageFormOpen(true)
  }

  const openEditWageForm = (entry: WageEntry) => {
    setViewingWeekStart(null)
    setEditingWage(entry)
    setWageFormOpen(true)
  }

  const closeWageForm = () => {
    setWageFormOpen(false)
    setEditingWage(null)
  }

  const handleSaveWage = async (input: WageEntryInput) => {
    setWageSaving(true)
    setWageError(null)
    try {
      if (editingWage) {
        await updateWageEntry(editingWage.id, input)
      } else {
        await createWageEntry(input)
      }
      closeWageForm()
      await loadAll()
    } catch (err) {
      setWageError(err instanceof Error ? err.message : 'Failed to save wage entry')
    } finally {
      setWageSaving(false)
    }
  }

  const handleDeleteWage = async (entry: WageEntry) => {
    const confirmed = window.confirm(`Delete this wage entry for "${entry.job_done}"? This cannot be undone.`)
    if (!confirmed) return

    setWageError(null)
    try {
      await deleteWageEntry(entry.id)
      await loadAll()
    } catch (err) {
      setWageError(err instanceof Error ? err.message : 'Failed to delete wage entry')
    }
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: 'plot', label: 'Plot' },
    { key: 'crop', label: 'Crop' },
    { key: 'planting_date', label: 'Planted' },
    { key: 'actual_harvest_date', label: 'Harvested' },
    { key: 'yield_amount', label: 'Yield' },
    { key: 'selling_price_per_unit', label: 'Selling Price' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'inputCost', label: 'Input Cost' },
    { key: 'other_costs', label: 'Other Costs' },
    { key: 'profit', label: 'Profit' },
    { key: 'marginPercent', label: 'Margin %' },
  ]

  const wageColumns: { key: WageSortKey; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'entries', label: 'Entries' },
    { key: 'hours', label: 'Total Hours' },
    { key: 'amount', label: 'Total Amount' },
  ]

  return (
    <div className="financials-page">
      <div className="financials-header">
        <h1>Harvest Profit Ledger</h1>
        <button type="button" className="btn-outline" onClick={() => setCsvPreviewOpen(true)}>
          Export CSV
        </button>
      </div>

      {error && <p className="financials-error">{error}</p>}

      <div className="financials-filters">
        <div>
          <label htmlFor="filter-plot">Plot</label>
          <select id="filter-plot" value={plotFilter} onChange={(e) => setPlotFilter(e.target.value)}>
            <option value="all">All plots</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-crop">Crop</label>
          <select id="filter-crop" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
            <option value="all">All crops</option>
            {cropOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-from">Planted from</label>
          <input id="filter-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>

        <div>
          <label htmlFor="filter-to">Planted to</label>
          <input id="filter-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="financials-empty">Loading...</p>
      ) : sortedRows.length === 0 ? (
        <p className="financials-empty">No crop cycles match these filters.</p>
      ) : (
        <div className="financials-table-wrap">
          <table className="financials-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}>
                    {col.label}
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.cycle.id}>
                  <td>{row.cycle.plots.name}</td>
                  <td>{row.cycle.crop_types.name}</td>
                  <td>{row.cycle.planting_date}</td>
                  <td>{row.cycle.actual_harvest_date ?? '—'}</td>
                  <td>
                    {row.cycle.yield_amount != null ? `${row.cycle.yield_amount} ${row.cycle.yield_unit ?? ''}` : '—'}
                  </td>
                  <td>{formatNumber(row.cycle.selling_price_per_unit)}</td>
                  <td>{formatNumber(row.revenue)}</td>
                  <td>{formatNumber(row.inputCost)}</td>
                  <td>{formatNumber(row.cycle.other_costs)}</td>
                  <td className={row.profit != null && row.profit < 0 ? 'financials-negative' : ''}>
                    {formatNumber(row.profit)}
                  </td>
                  <td>{row.marginPercent != null ? `${row.marginPercent.toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}>Totals</td>
                <td>{formatNumber(totals.revenue)}</td>
                <td>{formatNumber(totals.inputCost)}</td>
                <td>{formatNumber(totals.otherCosts)}</td>
                <td>{formatNumber(totals.profit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="financials-header financials-wage-header">
        <h1>Weekly Wage Ledger</h1>
        <button type="button" className="btn-primary" onClick={openCreateWageForm}>
          + Add Wage Entry
        </button>
      </div>

      {wageError && <p className="financials-error">{wageError}</p>}

      <div className="financials-filters">
        <div>
          <label htmlFor="wage-filter-plot">Plot</label>
          <select id="wage-filter-plot" value={wagePlotFilter} onChange={(e) => setWagePlotFilter(e.target.value)}>
            <option value="all">All plots</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="wage-filter-job">Job done</label>
          <select
            id="wage-filter-job"
            value={wageJobFilter}
            onChange={(e) => setWageJobFilter(e.target.value)}
          >
            <option value="all">All jobs</option>
            {jobOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="wage-filter-month">Month</label>
          <input
            id="wage-filter-month"
            type="month"
            value={wageMonthFilter}
            onChange={(e) => setWageMonthFilter(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="wage-filter-week">Week</label>
          <select id="wage-filter-week" value={wageWeekFilter} onChange={(e) => setWageWeekFilter(e.target.value)}>
            <option value="all">All weeks this month</option>
            {weeksInMonth.map((week) => (
              <option key={week.start} value={week.start}>
                {week.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="financials-empty">Loading...</p>
      ) : sortedWeeklySummaries.length === 0 ? (
        <p className="financials-empty">No wage entries match these filters.</p>
      ) : (
        <div className="financials-table-wrap">
          <table className="financials-table">
            <thead>
              <tr>
                {wageColumns.map((col) => (
                  <th key={col.key} onClick={() => toggleWageSort(col.key)}>
                    {col.label}
                    {wageSortKey === col.key ? (wageSortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedWeeklySummaries.map((week) => (
                <tr key={week.weekStart}>
                  <td>{week.weekLabel}</td>
                  <td>{week.entries.length}</td>
                  <td>{week.totalHours || '—'}</td>
                  <td>{formatNumber(week.totalAmount)}</td>
                  <td className="financials-row-actions">
                    <button type="button" onClick={() => setViewingWeekStart(week.weekStart)}>
                      View Entries
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Totals</td>
                <td>{wageGrandTotals.hours || '—'}</td>
                <td>{formatNumber(wageGrandTotals.amount)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {csvPreviewOpen && (
        <CsvPreviewModal
          rows={sortedRows}
          onCancel={() => setCsvPreviewOpen(false)}
          onDownloaded={() => setCsvPreviewOpen(false)}
        />
      )}

      {wageFormOpen && (
        <WageEntryFormModal
          initialValue={editingWage}
          plots={plots}
          saving={wageSaving}
          onCancel={closeWageForm}
          onSave={handleSaveWage}
        />
      )}

      {viewingWeek && (
        <WeeklyWageEntriesModal
          weekLabel={viewingWeek.weekLabel}
          entries={viewingWeek.entries}
          onEdit={openEditWageForm}
          onDelete={handleDeleteWage}
          onClose={() => setViewingWeekStart(null)}
        />
      )}
    </div>
  )
}

export default FinancialsPage
