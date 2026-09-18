import { useState, type FormEvent } from 'react'
import type { Plot } from '../landPlots/plotsApi'
import type {
  PerennialPlanting,
  PerennialPlantingInput,
  PerennialPlantingStatus,
} from './perennialPlantingsApi'
import '../../styles/modal.css'

const STATUSES: { value: PerennialPlantingStatus; label: string }[] = [
  { value: 'planted', label: 'Planted' },
  { value: 'maturing', label: 'Maturing' },
  { value: 'productive', label: 'Productive' },
  { value: 'declining', label: 'Declining' },
]
const CROP_SUGGESTIONS = [
  'Mango',
  'Banana',
  'Coconut',
  'Coffee',
  'Cacao',
  'Calamansi',
  'Rambutan',
  'Lanzones',
  'Durian',
  'Jackfruit (Langka)',
  'Avocado',
]
const todayIso = () => new Date().toISOString().slice(0, 10)

function PerennialPlantingFormModal({
  initialValue,
  landPlots,
  saving,
  onCancel,
  onSave,
}: {
  initialValue: PerennialPlanting | null
  landPlots: Plot[]
  saving: boolean
  onCancel: () => void
  onSave: (input: PerennialPlantingInput) => void
}) {
  const [plotId, setPlotId] = useState(initialValue?.plot_id ?? landPlots[0]?.id ?? '')
  const [cropType, setCropType] = useState(initialValue?.crop_type ?? '')
  const [plantingDate, setPlantingDate] = useState(initialValue?.planting_date ?? todayIso())
  const [status, setStatus] = useState<PerennialPlantingStatus>(initialValue?.status ?? 'planted')
  const [expectedFirstHarvest, setExpectedFirstHarvest] = useState(
    initialValue?.expected_first_harvest_date ?? '',
  )
  const [notes, setNotes] = useState(initialValue?.notes ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      plot_id: plotId,
      crop_type: cropType.trim(),
      planting_date: plantingDate,
      status,
      expected_first_harvest_date: expectedFirstHarvest.trim() || null,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>{initialValue ? 'Edit Planting' : 'Add Planting'}</h2>

        {landPlots.length === 0 ? (
          <p className="modal-hint">
            No land plots yet. Add one in Plots first — set its type to "Land" when creating it.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label htmlFor="planting-plot">Plot</label>
              <select id="planting-plot" value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
                {landPlots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label htmlFor="planting-crop">Crop type</label>
              <input
                id="planting-crop"
                list="crop-suggestions"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                placeholder="e.g. Mango"
                required
              />
              <datalist id="crop-suggestions">
                {CROP_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="modal-field-row">
              <div className="modal-field">
                <label htmlFor="planting-date">Planting date</label>
                <input
                  id="planting-date"
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="planting-status">Status</label>
                <select
                  id="planting-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PerennialPlantingStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-field">
              <label htmlFor="planting-first-harvest">Expected first harvest date (optional)</label>
              <input
                id="planting-first-harvest"
                type="date"
                value={expectedFirstHarvest}
                onChange={(e) => setExpectedFirstHarvest(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label htmlFor="planting-notes">Notes (optional)</label>
              <input id="planting-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        )}

        {landPlots.length === 0 && (
          <div className="modal-actions">
            <button type="button" className="btn-primary" onClick={onCancel}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerennialPlantingFormModal
