import { useState, type FormEvent } from 'react'
import type { CropCycle } from './cropCyclesApi'
import type { HarvestInput } from './cropCyclesApi'
import { todayIso } from '../../lib/dateUtils'
import '../../styles/modal.css'

function HarvestModal({
  cycle,
  saving,
  onCancel,
  onSave,
}: {
  cycle: CropCycle
  saving: boolean
  onCancel: () => void
  onSave: (input: HarvestInput) => void
}) {
  const [actualHarvestDate, setActualHarvestDate] = useState(todayIso())
  const [yieldAmount, setYieldAmount] = useState('')
  const [yieldUnit, setYieldUnit] = useState('kg')
  const [sellingPrice, setSellingPrice] = useState('')
  const [otherCosts, setOtherCosts] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      actual_harvest_date: actualHarvestDate,
      yield_amount: Number(yieldAmount),
      yield_unit: yieldUnit.trim(),
      selling_price_per_unit: sellingPrice ? Number(sellingPrice) : undefined,
      other_costs: otherCosts ? Number(otherCosts) : undefined,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Mark "{cycle.crop_types.name}" as Harvested</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="harvest-date">Actual harvest date</label>
            <input
              id="harvest-date"
              type="date"
              value={actualHarvestDate}
              onChange={(e) => setActualHarvestDate(e.target.value)}
              required
            />
          </div>

          <div className="modal-field-row">
            <div className="modal-field">
              <label htmlFor="yield-amount">Yield amount</label>
              <input
                id="yield-amount"
                type="number"
                min="0"
                step="0.01"
                value={yieldAmount}
                onChange={(e) => setYieldAmount(e.target.value)}
                required
              />
            </div>
            <div className="modal-field">
              <label htmlFor="yield-unit">Unit</label>
              <input
                id="yield-unit"
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value)}
                placeholder="e.g. kg, sacks"
                required
              />
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="harvest-selling-price">Selling price per unit (optional, if known)</label>
            <input
              id="harvest-selling-price"
              type="number"
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="Leave blank to fill in later, in Financials"
            />
          </div>

          {sellingPrice && (
            <div className="modal-field">
              <label htmlFor="harvest-other-costs">Other costs (optional)</label>
              <input
                id="harvest-other-costs"
                type="number"
                min="0"
                step="0.01"
                value={otherCosts}
                onChange={(e) => setOtherCosts(e.target.value)}
              />
            </div>
          )}

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

export default HarvestModal
