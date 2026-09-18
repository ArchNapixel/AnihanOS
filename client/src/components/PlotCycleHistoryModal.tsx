import type { Plot } from '../features/landPlots/plotsApi'
import type { CropCycle } from '../features/crops/cropCyclesApi'
import '../styles/modal.css'

function PlotCycleHistoryModal({
  plot,
  cycles,
  onClose,
}: {
  plot: Plot
  cycles: CropCycle[]
  onClose: () => void
}) {
  const sorted = [...cycles].sort((a, b) => (a.planting_date < b.planting_date ? 1 : -1))

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Cycle History — {plot.name}</h2>

        {sorted.length === 0 ? (
          <p className="modal-hint">No harvested cycles on this plot yet.</p>
        ) : (
          <table className="usage-history-table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Planted</th>
                <th>Harvested</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((cycle) => (
                <tr key={cycle.id}>
                  <td>{cycle.crop_types.name}</td>
                  <td>{cycle.planting_date}</td>
                  <td>{cycle.actual_harvest_date ?? '—'}</td>
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

export default PlotCycleHistoryModal
