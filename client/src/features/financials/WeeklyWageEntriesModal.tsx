import type { WageEntry } from './wageEntriesApi'
import '../../styles/modal.css'

function formatNumber(value: number): string {
  return value.toFixed(2)
}

function WeeklyWageEntriesModal({
  weekLabel,
  entries,
  onEdit,
  onDelete,
  onClose,
}: {
  weekLabel: string
  entries: WageEntry[]
  onEdit: (entry: WageEntry) => void
  onDelete: (entry: WageEntry) => void
  onClose: () => void
}) {
  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0)
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>Wage Entries — {weekLabel}</h2>

        {entries.length === 0 ? (
          <p className="modal-hint">No entries for this week.</p>
        ) : (
          <>
            <table className="usage-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Job done</th>
                  <th>Plot</th>
                  <th>Hours</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.work_date}</td>
                    <td>{entry.job_done}</td>
                    <td>{entry.plots?.name ?? '—'}</td>
                    <td>{entry.hours ?? '—'}</td>
                    <td>{formatNumber(entry.amount)}</td>
                    <td>{entry.notes ?? '—'}</td>
                    <td className="financials-row-actions">
                      <button type="button" onClick={() => onEdit(entry)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => onDelete(entry)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Totals</td>
                  <td>{totalHours || '—'}</td>
                  <td>{formatNumber(totalAmount)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
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

export default WeeklyWageEntriesModal
