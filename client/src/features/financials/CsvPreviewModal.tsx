import { CSV_HEADERS, buildFinancialsCsvRows, buildFinancialsCsvText, downloadCsv, type CropCycleFinancials } from './financialsApi'
import '../../styles/modal.css'
import './CsvPreviewModal.css'

function CsvPreviewModal({
  rows,
  onCancel,
  onDownloaded,
}: {
  rows: CropCycleFinancials[]
  onCancel: () => void
  onDownloaded: () => void
}) {
  const previewRows = buildFinancialsCsvRows(rows)

  const handleDownload = () => {
    downloadCsv('anihanos-harvest-ledger.csv', buildFinancialsCsvText(rows))
    onDownloaded()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>Preview CSV Export</h2>
        <p className="modal-hint">
          {rows.length} row{rows.length === 1 ? '' : 's'} — this is exactly what will be written to the file,
          matching your current filters and sort order.
        </p>

        <div className="csv-preview-wrap">
          <table className="usage-history-table">
            <thead>
              <tr>
                {CSV_HEADERS.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((cells, i) => (
                <tr key={i}>
                  {cells.map((cell, j) => (
                    <td key={j}>{cell || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleDownload}>
            Download CSV
          </button>
        </div>
      </div>
    </div>
  )
}

export default CsvPreviewModal
