import { useState, type FormEvent } from 'react'
import type { Plot } from '../landPlots/plotsApi'
import type { WageEntry, WageEntryInput } from './wageEntriesApi'
import '../../styles/modal.css'

const todayIso = () => new Date().toISOString().slice(0, 10)

function WageEntryFormModal({
  initialValue,
  plots,
  saving,
  onCancel,
  onSave,
}: {
  initialValue: WageEntry | null
  plots: Plot[]
  saving: boolean
  onCancel: () => void
  onSave: (input: WageEntryInput) => void
}) {
  const [jobDone, setJobDone] = useState(initialValue?.job_done ?? '')
  const [plotId, setPlotId] = useState(initialValue?.plot_id ?? '')
  const [workDate, setWorkDate] = useState(initialValue?.work_date ?? todayIso())
  const [hours, setHours] = useState(initialValue?.hours != null ? String(initialValue.hours) : '')
  const [amount, setAmount] = useState(initialValue ? String(initialValue.amount) : '')
  const [notes, setNotes] = useState(initialValue?.notes ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      job_done: jobDone.trim(),
      plot_id: plotId || null,
      work_date: workDate,
      hours: hours.trim() ? Number(hours) : null,
      amount: Number(amount),
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>{initialValue ? 'Edit Wage Entry' : 'Add Wage Entry'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="wage-job">Job done</label>
            <input
              id="wage-job"
              value={jobDone}
              onChange={(e) => setJobDone(e.target.value)}
              placeholder="e.g. Weeding, Harvesting, Land preparation"
              required
            />
          </div>

          <div className="modal-field">
            <label htmlFor="wage-plot">Plot (optional)</label>
            <select id="wage-plot" value={plotId} onChange={(e) => setPlotId(e.target.value)}>
              <option value="">None</option>
              {plots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field-row">
            <div className="modal-field">
              <label htmlFor="wage-date">Work date</label>
              <input
                id="wage-date"
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                required
              />
            </div>
            <div className="modal-field">
              <label htmlFor="wage-hours">Hours (optional)</label>
              <input
                id="wage-hours"
                type="number"
                min="0"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="wage-amount">Amount</label>
            <input
              id="wage-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="modal-field">
            <label htmlFor="wage-notes">Notes (optional)</label>
            <input id="wage-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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

export default WageEntryFormModal
