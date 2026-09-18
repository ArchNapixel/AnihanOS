import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import { listCropCycleFinancials, type CropCycleFinancials } from './financialsApi'
import CsvPreviewModal from './CsvPreviewModal'
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

function formatNumber(value: number | null): string {
  return value != null ? value.toFixed(2) : '—'
}

function FinancialsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rows, setRows] = useState<CropCycleFinancials[]>([])
  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [plotFilter, setPlotFilter] = useState(searchParams.get('plot') ?? 'all')
  const [cropFilter, setCropFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('planting_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [financials, plotsData] = await Promise.all([listCropCycleFinancials(), listPlots()])
        setRows(financials)
        setPlots(plotsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load financials')
      } finally {
        setLoading(false)
      }
    }
    load()
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

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
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

      {csvPreviewOpen && (
        <CsvPreviewModal
          rows={sortedRows}
          onCancel={() => setCsvPreviewOpen(false)}
          onDownloaded={() => setCsvPreviewOpen(false)}
        />
      )}
    </div>
  )
}

export default FinancialsPage
