import { useEffect, useState } from 'react'
import type { InputStock } from './inputStockApi'
import { listUsageForStock, type InputUsageLog } from './inputUsageApi'
import '../../styles/modal.css'

function UsageHistoryModal({ stock, onClose }: { stock: InputStock; onClose: () => void }) {
  const [logs, setLogs] = useState<InputUsageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listUsageForStock(stock.id)
        setLogs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [stock.id])

  const totalCost = logs.reduce((sum, log) => sum + (log.cost ?? 0), 0)
  const totalUsed = logs.reduce((sum, log) => sum + log.quantity_used, 0)

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>Usage History — {stock.name}</h2>

        {loading ? (
          <p className="modal-hint">Loading...</p>
        ) : error ? (
          <p className="modal-error">{error}</p>
        ) : logs.length === 0 ? (
          <p className="modal-hint">No usage logged yet.</p>
        ) : (
          <>
            <p className="modal-hint">
              Total used: {totalUsed} {stock.unit} · Total cost: {totalCost.toFixed(2)}
            </p>
            <table className="usage-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plot</th>
                  <th>Crop</th>
                  <th>Stage</th>
                  <th>Qty</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.date_used}</td>
                    <td>{log.plots.name}</td>
                    <td>{log.crop_cycles?.crop_types.name ?? '—'}</td>
                    <td>{log.fertilizing_stage ?? '—'}</td>
                    <td>
                      {log.quantity_used} {stock.unit}
                    </td>
                    <td>{log.cost != null ? log.cost.toFixed(2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
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

export default UsageHistoryModal
