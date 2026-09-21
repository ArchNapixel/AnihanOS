import type { Plot } from '../landPlots/plotsApi'
import type { CropCycle } from '../crops/cropCyclesApi'
import type { PlotInputUsageLog } from './inputUsageApi'
import './PlotUsageBreakdown.css'

type Group = {
  key: string
  label: string
  plantingDate: string
  entries: PlotInputUsageLog[]
}

function buildGroups(plotCycles: CropCycle[], logs: PlotInputUsageLog[]): Group[] {
  return plotCycles
    .slice()
    .sort((a, b) => (a.planting_date < b.planting_date ? -1 : 1))
    .map((cycle) => ({
      key: cycle.id,
      label: cycle.crop_types.name,
      plantingDate: cycle.planting_date,
      entries: logs.filter((log) => log.crop_cycle_id === cycle.id),
    }))
}

// Only ever shows the plot's currently-active (non-harvested) cycles — once
// a cycle is harvested it drops out of this breakdown, since its input cost
// is already permanently folded into the Financials Harvest Profit Ledger's
// Input Cost column instead (see financialsApi.listCropCycleFinancials,
// which sums input_usage_logs.cost by crop_cycle_id regardless of status).
// Nothing is deleted — the underlying rows stay in the database forever.
function PlotUsageBreakdown({
  plot,
  cropCycles,
  logs,
  loading,
  error,
}: {
  plot: Plot
  cropCycles: CropCycle[]
  logs: PlotInputUsageLog[]
  loading: boolean
  error: string | null
}) {
  const plotCycles = cropCycles.filter((cycle) => cycle.plot_id === plot.id && cycle.status !== 'harvested')
  const groups = buildGroups(plotCycles, logs)
  const totalCost = groups.reduce((sum, group) => sum + group.entries.reduce((s, log) => s + (log.cost ?? 0), 0), 0)

  return (
    <div className="plot-usage-breakdown">
      {loading ? (
        <p className="plot-usage-hint">Loading...</p>
      ) : error ? (
        <p className="plot-usage-error">{error}</p>
      ) : groups.length === 0 ? (
        <p className="plot-usage-hint">No active crop cycles on this plot yet.</p>
      ) : (
        <>
          <p className="plot-usage-hint">Total cost: {totalCost.toFixed(2)}</p>
          <div className="plot-usage-groups">
            {groups.map((group) => {
              const groupCost = group.entries.reduce((sum, log) => sum + (log.cost ?? 0), 0)
              return (
                <div className="plot-usage-group" key={group.key}>
                  <div className="plot-usage-group-header">
                    <h3>{group.label}</h3>
                    <span>Planted {group.plantingDate}</span>
                  </div>

                  {group.entries.length === 0 ? (
                    <p className="plot-usage-hint">No applications logged for this planting yet.</p>
                  ) : (
                    <>
                      <table className="usage-history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Input</th>
                            <th>Stage</th>
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
                              <td>{log.fertilizing_stage ?? '—'}</td>
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
    </div>
  )
}

export default PlotUsageBreakdown
