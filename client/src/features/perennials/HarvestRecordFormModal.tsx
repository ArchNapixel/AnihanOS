import { useState, type FormEvent } from 'react'
import type { HarvestRecordInput } from './harvestRecordsApi'
import type { PerennialPlanting } from './perennialPlantingsApi'
import '../../styles/modal.css'

const todayIso = () => new Date().toISOString().slice(0, 10)

function HarvestRecordFormModal({
  planting,
  saving,
  onCancel,
  onSave,
}: {
  planting: PerennialPlanting
  saving: boolean
  onCancel: () => void
  onSave: (input: HarvestRecordInput) => void
}) {
  const [harvestDate, setHarvestDate] = useState(todayIso())
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('kg')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      perennial_planting_id: planting.id,
      harvest_date: harvestDate,
      quantity_harvested: Number(quantity),
      harvest_unit: unit.trim(),
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Log Harvest — {planting.crop_type}</h2>

        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="harvest-date">Harvest date</label>
            <input
              id="harvest-date"
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              required
            />
          </div>

          <div className="modal-field-row">
            <div className="modal-field">
              <label htmlFor="harvest-quantity">Quantity</label>
              <input
                id="harvest-quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="modal-field">
              <label htmlFor="harvest-unit">Unit</label>
              <input id="harvest-unit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="harvest-notes">Notes (optional)</label>
            <input id="harvest-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

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

export default HarvestRecordFormModal
