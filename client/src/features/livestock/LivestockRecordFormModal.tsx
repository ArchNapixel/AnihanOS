import { useState, type FormEvent } from 'react'
import type { LivestockGroup } from './livestockGroupsApi'
import type { LivestockRecordInput, RecordDetails, RecordType } from './livestockRecordsApi'
import '../../styles/modal.css'

const todayIso = () => new Date().toISOString().slice(0, 10)
const RECORD_TYPES: RecordType[] = ['feed', 'health', 'production']

function LivestockRecordFormModal({
  group,
  saving,
  onCancel,
  onSave,
}: {
  group: LivestockGroup
  saving: boolean
  onCancel: () => void
  onSave: (input: LivestockRecordInput) => void
}) {
  const [recordType, setRecordType] = useState<RecordType>('feed')
  const [date, setDate] = useState(todayIso())
  const [notes, setNotes] = useState('')

  const [feedAmount, setFeedAmount] = useState('')
  const [feedUnit, setFeedUnit] = useState('kg')

  const [healthDescription, setHealthDescription] = useState('')

  const [outputType, setOutputType] = useState('eggs')
  const [productionQuantity, setProductionQuantity] = useState('')
  const [productionUnit, setProductionUnit] = useState('pcs')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    let details: RecordDetails
    if (recordType === 'feed') {
      details = { amount: Number(feedAmount), unit: feedUnit.trim() }
    } else if (recordType === 'health') {
      details = { description: healthDescription.trim() }
    } else {
      details = { output_type: outputType.trim(), quantity: Number(productionQuantity), unit: productionUnit.trim() }
    }

    onSave({
      livestock_group_id: group.id,
      record_type: recordType,
      date,
      details,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Log Record — {group.animal_type}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="record-type">Record type</label>
            <select id="record-type" value={recordType} onChange={(e) => setRecordType(e.target.value as RecordType)}>
              {RECORD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label htmlFor="record-date">Date</label>
            <input id="record-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          {recordType === 'feed' && (
            <div className="modal-field-row">
              <div className="modal-field">
                <label htmlFor="feed-amount">Feed amount</label>
                <input
                  id="feed-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={feedAmount}
                  onChange={(e) => setFeedAmount(e.target.value)}
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="feed-unit">Unit</label>
                <input
                  id="feed-unit"
                  value={feedUnit}
                  onChange={(e) => setFeedUnit(e.target.value)}
                  placeholder="e.g. kg, sacks"
                  required
                />
              </div>
            </div>
          )}

          {recordType === 'health' && (
            <div className="modal-field">
              <label htmlFor="health-description">Description</label>
              <input
                id="health-description"
                value={healthDescription}
                onChange={(e) => setHealthDescription(e.target.value)}
                placeholder="e.g. Newcastle vaccine, dewormed"
                required
              />
            </div>
          )}

          {recordType === 'production' && (
            <>
              <div className="modal-field">
                <label htmlFor="output-type">Output type</label>
                <select id="output-type" value={outputType} onChange={(e) => setOutputType(e.target.value)}>
                  <option value="eggs">Eggs</option>
                  <option value="milk">Milk</option>
                  <option value="meat">Meat</option>
                </select>
              </div>
              <div className="modal-field-row">
                <div className="modal-field">
                  <label htmlFor="production-quantity">Quantity</label>
                  <input
                    id="production-quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={productionQuantity}
                    onChange={(e) => setProductionQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="production-unit">Unit</label>
                  <input
                    id="production-unit"
                    value={productionUnit}
                    onChange={(e) => setProductionUnit(e.target.value)}
                    placeholder="e.g. dozen, liters, kg"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="modal-field">
            <label htmlFor="record-notes">Notes (optional)</label>
            <input id="record-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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

export default LivestockRecordFormModal
