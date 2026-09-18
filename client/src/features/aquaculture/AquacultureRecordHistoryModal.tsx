import { useEffect, useState } from 'react'
import type { AquacultureStock } from './aquacultureStockApi'
import {
  listRecordsForStock,
  type AquacultureRecord,
  type FeedDetails,
  type HarvestDetails,
  type WaterQualityDetails,
} from './aquacultureRecordsApi'
import '../../styles/modal.css'

function formatDetails(record: AquacultureRecord): string {
  switch (record.record_type) {
    case 'feed': {
      const d = record.details as FeedDetails
      return `${d.amount} ${d.unit}`
    }
    case 'water_quality': {
      const d = record.details as WaterQualityDetails
      const parts: string[] = []
      if (d.temperature_c != null) parts.push(`${d.temperature_c}°C`)
      if (d.ph != null) parts.push(`pH ${d.ph}`)
      if (d.dissolved_oxygen_mgl != null) parts.push(`DO ${d.dissolved_oxygen_mgl} mg/L`)
      if (d.salinity_ppt != null) parts.push(`${d.salinity_ppt} ppt`)
      return parts.length > 0 ? parts.join(', ') : '—'
    }
    case 'harvest': {
      const d = record.details as HarvestDetails
      return `${d.quantity} ${d.unit}`
    }
    default:
      return ''
  }
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  feed: 'Feeding',
  water_quality: 'Water quality',
  harvest: 'Harvest',
}

function AquacultureRecordHistoryModal({ stock, onClose }: { stock: AquacultureStock; onClose: () => void }) {
  const [records, setRecords] = useState<AquacultureRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listRecordsForStock(stock.id)
        setRecords(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load records')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [stock.id])

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>Record History — {stock.species}</h2>

        {loading ? (
          <p className="modal-hint">Loading...</p>
        ) : error ? (
          <p className="modal-error">{error}</p>
        ) : records.length === 0 ? (
          <p className="modal-hint">No records logged yet.</p>
        ) : (
          <table className="usage-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Details</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{RECORD_TYPE_LABELS[record.record_type] ?? record.record_type}</td>
                  <td>{formatDetails(record)}</td>
                  <td>{record.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AquacultureRecordHistoryModal
