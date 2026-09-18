import { useEffect, useState, type FormEvent } from 'react'
import type { InputStock, InputType } from './inputStockApi'
import type { InputUsageInput } from './inputUsageApi'
import type { Plot } from '../landPlots/plotsApi'
import type { CropCycle } from '../crops/cropCyclesApi'
import PlotCycleHistoryModal from '../../components/PlotCycleHistoryModal'
import { todayIso } from '../../lib/dateUtils'
import '../../styles/modal.css'
import './QuickLogUsageModal.css'
const TYPE_LABELS: Record<InputType, string> = { fertilizer: 'Fertilizer', pesticide: 'Pesticide', seed: 'Seed' }

function QuickLogUsageModal({
  plot,
  type,
  stockItems,
  cropCycles,
  saving,
  error,
  onCancel,
  onSave,
}: {
  plot: Plot
  type: InputType
  stockItems: InputStock[]
  cropCycles: CropCycle[]
  saving: boolean
  error: string | null
  onCancel: () => void
  onSave: (input: InputUsageInput) => void
}) {
  const matchingStock = stockItems.filter((s) => s.type === type)
  const cyclesForPlot = cropCycles.filter((c) => c.plot_id === plot.id && c.status !== 'harvested')
  const harvestedCyclesForPlot = cropCycles.filter((c) => c.plot_id === plot.id && c.status === 'harvested')

  const [stockId, setStockId] = useState(matchingStock[0]?.id ?? '')
  const [cropCycleId, setCropCycleId] = useState(cyclesForPlot.length === 1 ? cyclesForPlot[0].id : '')
  const [fertilizingStage, setFertilizingStage] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [dateUsed, setDateUsed] = useState(todayIso())
  const [cost, setCost] = useState('')
  const [showCycleHistory, setShowCycleHistory] = useState(false)

  const stock = matchingStock.find((s) => s.id === stockId) ?? null
  const selectedCycle = cyclesForPlot.find((c) => c.id === cropCycleId) ?? null
  const stageOptions = type === 'fertilizer' ? selectedCycle?.crop_types.fertilizing_schedule ?? [] : []

  useEffect(() => {
    if (stock?.cost_per_unit != null && quantityUsed) {
      setCost((Number(quantityUsed) * stock.cost_per_unit).toFixed(2))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantityUsed, stockId])

  useEffect(() => {
    setFertilizingStage('')
  }, [cropCycleId])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!stock) return
    onSave({
      input_stock_id: stock.id,
      plot_id: plot.id,
      crop_cycle_id: cropCycleId || null,
      quantity_used: Number(quantityUsed),
      date_used: dateUsed,
      cost: cost ? Number(cost) : null,
      fertilizing_stage: stageOptions.length > 0 ? fertilizingStage || null : null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>
          Add {TYPE_LABELS[type]} — {plot.name}
        </h2>

        {matchingStock.length === 0 ? (
          <>
            <p className="modal-hint">
              No {TYPE_LABELS[type].toLowerCase()} stock yet. Add one in Fertilizer/Input Management above first.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={onCancel}>
                Close
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label htmlFor="quick-usage-stock">{TYPE_LABELS[type]}</label>
              <select id="quick-usage-stock" value={stockId} onChange={(e) => setStockId(e.target.value)} required>
                {matchingStock.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {stock && (
                <p className="modal-hint">
                  {stock.current_quantity} {stock.unit} currently in stock.
                </p>
              )}
            </div>

            <div className="modal-field">
              <label htmlFor="quick-usage-crop-cycle">Crop cycle (optional)</label>
              <select
                id="quick-usage-crop-cycle"
                value={cropCycleId}
                onChange={(e) => setCropCycleId(e.target.value)}
              >
                <option value="">None</option>
                {cyclesForPlot.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.crop_types.name} (planted {cycle.planting_date})
                  </option>
                ))}
              </select>
              {harvestedCyclesForPlot.length > 0 && (
                <button
                  type="button"
                  className="modal-cancel quick-usage-history-toggle"
                  onClick={() => setShowCycleHistory(true)}
                >
                  Cycle History Logs
                </button>
              )}
            </div>

            {stageOptions.length > 0 && (
              <div className="modal-field">
                <label htmlFor="quick-usage-stage">Fertilizing stage (optional)</label>
                <select
                  id="quick-usage-stage"
                  value={fertilizingStage}
                  onChange={(e) => setFertilizingStage(e.target.value)}
                >
                  <option value="">Not sure / general</option>
                  {stageOptions.map((stage, i) => (
                    <option key={i} value={stage.name}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                <p className="modal-hint">From {selectedCycle?.crop_types.name}'s Product Book schedule.</p>
              </div>
            )}

            <div className="modal-field-row">
              <div className="modal-field">
                <label htmlFor="quick-usage-quantity">Quantity used {stock ? `(${stock.unit})` : ''}</label>
                <input
                  id="quick-usage-quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={stock?.current_quantity}
                  value={quantityUsed}
                  onChange={(e) => setQuantityUsed(e.target.value)}
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="quick-usage-date">Date used</label>
                <input
                  id="quick-usage-date"
                  type="date"
                  value={dateUsed}
                  onChange={(e) => setDateUsed(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-field">
              <label htmlFor="quick-usage-cost">Cost (optional)</label>
              <input
                id="quick-usage-cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving || !stock}>
                {saving ? 'Saving...' : 'Log Usage'}
              </button>
            </div>
          </form>
        )}
      </div>

      {showCycleHistory && (
        <PlotCycleHistoryModal
          plot={plot}
          cycles={harvestedCyclesForPlot}
          onClose={() => setShowCycleHistory(false)}
        />
      )}
    </div>
  )
}

export default QuickLogUsageModal
