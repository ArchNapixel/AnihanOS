import { useState, type FormEvent } from 'react'
import type { LivestockGroup, LivestockGroupInput } from './livestockGroupsApi'
import '../../styles/modal.css'

function LivestockGroupFormModal({
  initialValue,
  saving,
  onCancel,
  onSave,
}: {
  initialValue: LivestockGroup | null
  saving: boolean
  onCancel: () => void
  onSave: (input: LivestockGroupInput) => void
}) {
  const [animalType, setAnimalType] = useState(initialValue?.animal_type ?? '')
  const [count, setCount] = useState(initialValue ? String(initialValue.count) : '')
  const [notes, setNotes] = useState(initialValue?.notes ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      animal_type: animalType.trim(),
      count: Number(count),
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>{initialValue ? 'Edit Livestock Group' : 'Add Livestock Group'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="livestock-animal-type">Animal type</label>
            <input
              id="livestock-animal-type"
              value={animalType}
              onChange={(e) => setAnimalType(e.target.value)}
              placeholder="e.g. Native Chickens"
              required
            />
          </div>

          <div className="modal-field">
            <label htmlFor="livestock-count">Count</label>
            <input
              id="livestock-count"
              type="number"
              min="0"
              step="1"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              required
            />
          </div>

          <div className="modal-field">
            <label htmlFor="livestock-notes">Notes (optional)</label>
            <input id="livestock-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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

export default LivestockGroupFormModal
