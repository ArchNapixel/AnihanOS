import { useEffect, useState } from 'react'
import type { LivestockGroup } from './livestockGroupsApi'
import { listRecordsForGroup, type LivestockRecord } from './livestockRecordsApi'
import '../../styles/modal.css'

function formatDetails(record: LivestockRecord): string {
  switch (record.record_type) {
    case 'feed': {
      const d = record.details as { amount: number; unit: string }
      return `${d.amount} ${d.unit}`
    }
    case 'health': {
      const d = record.details as { description: string }
      return d.description
    }
    case 'production': {
      const d = record.details as { output_type: string; quantity: number; unit: string }
      return `${d.quantity} ${d.unit} of ${d.output_type}`
    }
    default:
      return ''
  }
}

function RecordHistoryModal({ group, onClose }: { group: LivestockGroup; onClose: () => void }) {
  const [records, setRecords] = useState<LivestockRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listRecordsForGroup(group.id)
        setRecords(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load records')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [group.id])

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>Record History — {group.animal_type}</h2>

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
                  <td>{record.record_type}</td>
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

export default RecordHistoryModal
