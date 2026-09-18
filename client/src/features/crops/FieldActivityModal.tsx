import { useState, type FormEvent } from 'react'
import type { CropCycle } from './cropCyclesApi'
import type { ActivityType, FieldActivityInput } from './fieldActivitiesApi'
import '../../styles/modal.css'

const ACTIVITY_TYPES: ActivityType[] = ['weeding', 'plowing', 'cultivation']
const todayIso = () => new Date().toISOString().slice(0, 10)

function FieldActivityModal({
  cycle,
  saving,
  onCancel,
  onSave,
}: {
  cycle: CropCycle
  saving: boolean
  onCancel: () => void
  onSave: (input: FieldActivityInput) => void
}) {
  const [activityType, setActivityType] = useState<ActivityType>('weeding')
  const [date, setDate] = useState(todayIso())

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      plot_id: cycle.plot_id,
      crop_cycle_id: cycle.id,
      activity_type: activityType,
      date,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Log Field Activity — {cycle.plots.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="activity-type">Activity</label>
            <select
              id="activity-type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label htmlFor="activity-date">Date</label>
            <input id="activity-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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

export default FieldActivityModal
