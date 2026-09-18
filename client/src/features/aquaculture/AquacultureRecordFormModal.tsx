import { useState, type FormEvent } from 'react'
import type {
  AquaRecordType,
  AquacultureRecordInput,
  FeedDetails,
  HarvestDetails,
  WaterQualityDetails,
} from './aquacultureRecordsApi'
import type { AquacultureStock } from './aquacultureStockApi'
import { todayIso } from '../../lib/dateUtils'
import '../../styles/modal.css'

const RECORD_TYPES: { value: AquaRecordType; label: string }[] = [
  { value: 'feed', label: 'Feeding' },
  { value: 'water_quality', label: 'Water quality' },
  { value: 'harvest', label: 'Harvest' },
]

function AquacultureRecordFormModal({
  stock,
  saving,
  onCancel,
  onSave,
}: {
  stock: AquacultureStock
  saving: boolean
  onCancel: () => void
  onSave: (input: AquacultureRecordInput) => void
}) {
  const [recordType, setRecordType] = useState<AquaRecordType>('feed')
  const [date, setDate] = useState(todayIso())
  const [notes, setNotes] = useState('')

  const [feedAmount, setFeedAmount] = useState('')
  const [feedUnit, setFeedUnit] = useState('kg')

  const [temperature, setTemperature] = useState('')
  const [ph, setPh] = useState('')
  const [dissolvedOxygen, setDissolvedOxygen] = useState('')
  const [salinity, setSalinity] = useState('')

  const [harvestQuantity, setHarvestQuantity] = useState('')
  const [harvestUnit, setHarvestUnit] = useState(stock.stocking_unit)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    let details: FeedDetails | WaterQualityDetails | HarvestDetails
    if (recordType === 'feed') {
      details = { amount: Number(feedAmount), unit: feedUnit.trim() } satisfies FeedDetails
    } else if (recordType === 'water_quality') {
      const wq: WaterQualityDetails = {}
      if (temperature.trim()) wq.temperature_c = Number(temperature)
      if (ph.trim()) wq.ph = Number(ph)
      if (dissolvedOxygen.trim()) wq.dissolved_oxygen_mgl = Number(dissolvedOxygen)
      if (salinity.trim()) wq.salinity_ppt = Number(salinity)
      details = wq
    } else {
      details = { quantity: Number(harvestQuantity), unit: harvestUnit.trim() } satisfies HarvestDetails
    }

    onSave({
      aquaculture_stock_id: stock.id,
      record_type: recordType,
      date,
      details,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Log Record — {stock.species}</h2>

        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="record-type">Record type</label>
            <select
              id="record-type"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as AquaRecordType)}
            >
              {RECORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
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
                <label htmlFor="feed-amount">Amount</label>
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
                <input id="feed-unit" value={feedUnit} onChange={(e) => setFeedUnit(e.target.value)} required />
              </div>
            </div>
          )}

          {recordType === 'water_quality' && (
            <>
              <div className="modal-field-row">
                <div className="modal-field">
                  <label htmlFor="wq-temp">Temperature (°C)</label>
                  <input
                    id="wq-temp"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="wq-ph">pH</label>
                  <input id="wq-ph" type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)} />
                </div>
              </div>
              <div className="modal-field-row">
                <div className="modal-field">
                  <label htmlFor="wq-do">Dissolved oxygen (mg/L)</label>
                  <input
                    id="wq-do"
                    type="number"
                    step="0.1"
                    value={dissolvedOxygen}
                    onChange={(e) => setDissolvedOxygen(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="wq-salinity">Salinity (ppt)</label>
                  <input
                    id="wq-salinity"
                    type="number"
                    step="0.1"
                    value={salinity}
                    onChange={(e) => setSalinity(e.target.value)}
                  />
                </div>
              </div>
              <p className="modal-hint">All water quality fields are optional — fill in what you measured.</p>
            </>
          )}

          {recordType === 'harvest' && (
            <div className="modal-field-row">
              <div className="modal-field">
                <label htmlFor="harvest-quantity">Quantity</label>
                <input
                  id="harvest-quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={harvestQuantity}
                  onChange={(e) => setHarvestQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="harvest-unit">Unit</label>
                <input
                  id="harvest-unit"
                  value={harvestUnit}
                  onChange={(e) => setHarvestUnit(e.target.value)}
                  required
                />
              </div>
            </div>
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

export default AquacultureRecordFormModal
