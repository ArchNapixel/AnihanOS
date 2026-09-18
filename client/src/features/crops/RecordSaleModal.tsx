import { useState, type FormEvent } from 'react'
import type { CropCycle, SaleInput } from './cropCyclesApi'
import '../../styles/modal.css'

function RecordSaleModal({
  cycle,
  saving,
  onCancel,
  onSave,
}: {
  cycle: CropCycle
  saving: boolean
  onCancel: () => void
  onSave: (input: SaleInput) => void
}) {
  const [sellingPrice, setSellingPrice] = useState(
    cycle.selling_price_per_unit != null ? String(cycle.selling_price_per_unit) : '',
  )
  const [otherCosts, setOtherCosts] = useState(cycle.other_costs != null ? String(cycle.other_costs) : '0')

  const yieldAmount = cycle.yield_amount ?? 0
  const revenue = sellingPrice ? yieldAmount * Number(sellingPrice) : null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      selling_price_per_unit: Number(sellingPrice),
      other_costs: Number(otherCosts || 0),
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Record Sale — {cycle.crop_types.name}</h2>
        <p className="modal-hint">
          Harvested {cycle.yield_amount} {cycle.yield_unit} from {cycle.plots.name}.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="selling-price">Selling price per {cycle.yield_unit ?? 'unit'}</label>
            <input
              id="selling-price"
              type="number"
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
            />
          </div>

          <div className="modal-field">
            <label htmlFor="other-costs">Other costs (labor, transport, equipment, etc.)</label>
            <input
              id="other-costs"
              type="number"
              min="0"
              step="0.01"
              value={otherCosts}
              onChange={(e) => setOtherCosts(e.target.value)}
              required
            />
          </div>

          {revenue != null && <p className="modal-hint">Revenue: {revenue.toFixed(2)}</p>}

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecordSaleModal
