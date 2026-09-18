import { useEffect, useState } from 'react'
import { listHarvestRecordsForPlanting, type HarvestRecord } from './harvestRecordsApi'
import type { PerennialPlanting } from './perennialPlantingsApi'
import '../../styles/modal.css'

function HarvestRecordHistoryModal({
  planting,
  onClose,
}: {
  planting: PerennialPlanting
  onClose: () => void
}) {
  const [records, setRecords] = useState<HarvestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listHarvestRecordsForPlanting(planting.id)
        setRecords(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load harvest records')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [planting.id])

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>Harvest History — {planting.crop_type}</h2>

        {loading ? (
          <p className="modal-hint">Loading...</p>
        ) : error ? (
          <p className="modal-error">{error}</p>
        ) : records.length === 0 ? (
          <p className="modal-hint">No harvests logged yet.</p>
        ) : (
          <table className="usage-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Quantity</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.harvest_date}</td>
                  <td>
                    {record.quantity_harvested} {record.harvest_unit}
                  </td>
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

export default HarvestRecordHistoryModal
