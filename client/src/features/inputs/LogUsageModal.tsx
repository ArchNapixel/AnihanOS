import { useEffect, useState, type FormEvent } from 'react'
import type { InputStock } from './inputStockApi'
import type { InputUsageInput } from './inputUsageApi'
import type { Plot } from '../landPlots/plotsApi'
import type { CropCycle } from '../crops/cropCyclesApi'
import '../../styles/modal.css'

const todayIso = () => new Date().toISOString().slice(0, 10)

function LogUsageModal({
  stock,
  plots,
  cropCycles,
  saving,
  error,
  onCancel,
  onSave,
}: {
  stock: InputStock
  plots: Plot[]
  cropCycles: CropCycle[]
  saving: boolean
  error: string | null
  onCancel: () => void
  onSave: (input: InputUsageInput) => void
}) {
  const [plotId, setPlotId] = useState(plots[0]?.id ?? '')
  const [cropCycleId, setCropCycleId] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [dateUsed, setDateUsed] = useState(todayIso())
  const [cost, setCost] = useState('')

  const cyclesForPlot = cropCycles.filter((c) => c.plot_id === plotId && c.status !== 'harvested')

  useEffect(() => {
    setCropCycleId('')
  }, [plotId])

  useEffect(() => {
    if (stock.cost_per_unit != null && quantityUsed) {
      setCost((Number(quantityUsed) * stock.cost_per_unit).toFixed(2))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantityUsed])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      input_stock_id: stock.id,
      plot_id: plotId,
      crop_cycle_id: cropCycleId || null,
      quantity_used: Number(quantityUsed),
      date_used: dateUsed,
      cost: cost ? Number(cost) : null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Log Usage — {stock.name}</h2>
        <p className="modal-hint">
          {stock.current_quantity} {stock.unit} currently in stock.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="usage-plot">Plot</label>
            <select id="usage-plot" value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
              {plots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label htmlFor="usage-crop-cycle">Crop cycle (optional)</label>
            <select id="usage-crop-cycle" value={cropCycleId} onChange={(e) => setCropCycleId(e.target.value)}>
              <option value="">None</option>
              {cyclesForPlot.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.crop_types.name} (planted {cycle.planting_date})
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field-row">
            <div className="modal-field">
              <label htmlFor="usage-quantity">Quantity used ({stock.unit})</label>
              <input
                id="usage-quantity"
                type="number"
                min="0.01"
                step="0.01"
                max={stock.current_quantity}
                value={quantityUsed}
                onChange={(e) => setQuantityUsed(e.target.value)}
                required
              />
            </div>
            <div className="modal-field">
              <label htmlFor="usage-date">Date used</label>
              <input
                id="usage-date"
                type="date"
                value={dateUsed}
                onChange={(e) => setDateUsed(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="usage-cost">Cost (optional)</label>
            <input id="usage-cost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !plotId}>
              {saving ? 'Saving...' : 'Log Usage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LogUsageModal
