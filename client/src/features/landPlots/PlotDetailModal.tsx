import PlotBoundaryMap from '../../components/PlotBoundaryMap'
import type { Plot } from './plotsApi'
import '../../styles/modal.css'
import './PlotDetailModal.css'

function PlotDetailModal({ plot, onClose }: { plot: Plot; onClose: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>{plot.name}</h2>

        {plot.boundary ? (
          <PlotBoundaryMap value={plot.boundary} readOnly />
        ) : (
          <p className="modal-hint">No boundary drawn yet — edit this land to trace its outline.</p>
        )}

        <dl className="plot-detail-list">
          <div>
            <dt>Size</dt>
            <dd>
              {plot.size} {plot.size_unit}
            </dd>
          </div>
          {plot.soil_type && (
            <div>
              <dt>Soil type</dt>
              <dd>{plot.soil_type}</dd>
            </div>
          )}
          {plot.latitude != null && plot.longitude != null && (
            <div>
              <dt>Location</dt>
              <dd>
                {plot.latitude.toFixed(6)}, {plot.longitude.toFixed(6)}
              </dd>
            </div>
          )}
          <div>
            <dt>Added</dt>
            <dd>{new Date(plot.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlotDetailModal
