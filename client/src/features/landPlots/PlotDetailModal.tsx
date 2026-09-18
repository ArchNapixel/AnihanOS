import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PlotBoundaryMap from '../../components/PlotBoundaryMap'
import type { Plot } from './plotsApi'
import { listCropCycles } from '../crops/cropCyclesApi'
import { listActivitiesForPlot } from '../crops/fieldActivitiesApi'
import { computeWeedRisk, type WeedRiskLevel } from '../../domain/weedRisk'
import '../../styles/modal.css'
import './PlotDetailModal.css'

function PlotDetailModal({ plot, onClose }: { plot: Plot; onClose: () => void }) {
  const [weedRisk, setWeedRisk] = useState<WeedRiskLevel | null>(null)
  const [hasActiveCycle, setHasActiveCycle] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadWeedRisk() {
      try {
        const [cycles, activities] = await Promise.all([listCropCycles(), listActivitiesForPlot(plot.id)])
        if (cancelled) return

        const activeCycle = cycles
          .filter((c) => c.plot_id === plot.id && c.status !== 'harvested')
          .sort((a, b) => (a.planting_date < b.planting_date ? 1 : -1))[0]

        if (!activeCycle) {
          setHasActiveCycle(false)
          return
        }

        setHasActiveCycle(true)
        const lastWeeding = activities.find((a) => a.activity_type === 'weeding')
        setWeedRisk(
          computeWeedRisk(activeCycle.planting_date, activeCycle.crop_types.canopy_closure_days, lastWeeding?.date ?? null),
        )
      } catch {
        // Weed risk is a nice-to-have overlay on this view — a failure here
        // shouldn't block showing the plot's own core details.
      }
    }

    loadWeedRisk()
    return () => {
      cancelled = true
    }
  }, [plot.id])

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <div className="plot-detail-header">
          <h2>{plot.name}</h2>
          {hasActiveCycle && weedRisk && (
            <span className={`weed-risk-badge weed-risk-${weedRisk}`}>Weed risk: {weedRisk}</span>
          )}
        </div>

        {hasActiveCycle && weedRisk && (
          <p className="modal-hint">
            Estimated risk based on typical growth patterns, not a guarantee — inspect your field directly.
          </p>
        )}

        {plot.boundary ? (
          <PlotBoundaryMap value={plot.boundary} />
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
          <Link to={`/financials?plot=${plot.id}`} className="btn-outline">
            View Financials
          </Link>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlotDetailModal
