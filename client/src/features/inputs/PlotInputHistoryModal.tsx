import { useEffect, useState } from 'react'
import type { Plot } from '../landPlots/plotsApi'
import type { CropCycle } from '../crops/cropCyclesApi'
import { listUsageForPlot, type PlotInputUsageLog } from './inputUsageApi'
import '../../styles/modal.css'
import './PlotInputHistoryModal.css'

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

type Group = {
  key: string
  label: string
  plantingDate: string | null
  recommended: { name: string; startDate: string; endDate: string | null; nutrients: string; purpose: string }[]
  entries: PlotInputUsageLog[]
}

function buildGroups(plotCycles: CropCycle[], logs: PlotInputUsageLog[]): Group[] {
  const groups: Group[] = plotCycles
    .slice()
    .sort((a, b) => (a.planting_date < b.planting_date ? -1 : 1))
    .map((cycle) => ({
      key: cycle.id,
      label: cycle.crop_types.name,
      plantingDate: cycle.planting_date,
      recommended: cycle.crop_types.fertilizing_schedule.map((stage) => ({
        name: stage.name,
        startDate: addDays(cycle.planting_date, stage.offset_days_start),
        endDate: stage.offset_days_end != null ? addDays(cycle.planting_date, stage.offset_days_end) : null,
        nutrients: stage.nutrients,
        purpose: stage.purpose,
      })),
      entries: logs.filter((log) => log.crop_cycle_id === cycle.id),
    }))

  const generalEntries = logs.filter((log) => log.crop_cycle_id === null)
  if (generalEntries.length > 0) {
    groups.push({
      key: 'none',
      label: 'General use (not tied to a planting)',
      plantingDate: null,
      recommended: [],
      entries: generalEntries,
    })
  }

  return groups
}

function PlotInputHistoryModal({
  plot,
  cropCycles,
  onClose,
}: {
  plot: Plot
  cropCycles: CropCycle[]
  onClose: () => void
}) {
  const [logs, setLogs] = useState<PlotInputUsageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listUsageForPlot(plot.id)
        setLogs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load input usage')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [plot.id])

  const plotCycles = cropCycles.filter((cycle) => cycle.plot_id === plot.id)
  const groups = buildGroups(plotCycles, logs)
  const totalCost = logs.reduce((sum, log) => sum + (log.cost ?? 0), 0)

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>Input Usage — {plot.name}</h2>

        {loading ? (
          <p className="modal-hint">Loading...</p>
        ) : error ? (
          <p className="modal-error">{error}</p>
        ) : groups.length === 0 ? (
          <p className="modal-hint">No crop cycles or input usage on this plot yet.</p>
        ) : (
          <>
            <p className="modal-hint">
              {logs.length} application{logs.length === 1 ? '' : 's'} logged · Total cost: {totalCost.toFixed(2)}
            </p>

            <div className="plot-usage-groups">
              {groups.map((group) => {
                const groupCost = group.entries.reduce((sum, log) => sum + (log.cost ?? 0), 0)
                return (
                  <div className="plot-usage-group" key={group.key}>
                    <div className="plot-usage-group-header">
                      <h3>{group.label}</h3>
                      {group.plantingDate && <span>Planted {group.plantingDate}</span>}
                    </div>

                    {group.recommended.length > 0 && (
                      <div className="plot-usage-recommended">
                        <p className="plot-usage-recommended-label">Recommended schedule (Product Book)</p>
                        <table className="usage-history-table">
                          <thead>
                            <tr>
                              <th>Stage</th>
                              <th>When</th>
                              <th>Nutrients</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.recommended.map((stage, i) => (
                              <tr key={i}>
                                <td>{stage.name}</td>
                                <td>{stage.endDate ? `${stage.startDate} to ${stage.endDate}` : stage.startDate}</td>
                                <td>{stage.nutrients || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {group.entries.length === 0 ? (
                      <p className="modal-hint">No applications logged for this planting yet.</p>
                    ) : (
                      <>
                        <p className="plot-usage-recommended-label">Actually applied</p>
                        <table className="usage-history-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Input</th>
                              <th>Quantity</th>
                              <th>Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.entries.map((log) => (
                              <tr key={log.id}>
                                <td>{log.date_used}</td>
                                <td className="plot-usage-type-cell">{log.input_stock.type}</td>
                                <td>{log.input_stock.name}</td>
                                <td>
                                  {log.quantity_used} {log.input_stock.unit}
                                </td>
                                <td>{log.cost != null ? log.cost.toFixed(2) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="plot-usage-group-total">Subtotal: {groupCost.toFixed(2)}</p>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlotInputHistoryModal
