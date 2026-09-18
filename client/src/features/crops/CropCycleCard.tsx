import type { CropCycle } from './cropCyclesApi'
import type { CropCycleFinancials } from '../financials/financialsApi'
import { getCurrentStage, getProgressPercentage } from '../../lib/growthStage'
import { formatDateShort } from '../../lib/dateUtils'
import './CropCycleCard.css'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="cycle-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

// Always renders an active (non-harvested) cycle — harvested cycles move to
// the plot's Cycle History table once marked harvested, and are never passed
// here (see CropPlotGroup).
function CropCycleCard({
  cycle,
  financials,
  onHarvest,
  onLogActivity,
  onEdit,
  onDelete,
  onForecast,
}: {
  cycle: CropCycle
  financials: CropCycleFinancials | undefined
  onHarvest: () => void
  onLogActivity: () => void
  onEdit: () => void
  onDelete: () => void
  onForecast?: () => void
}) {
  const stage = getCurrentStage(cycle.planting_date, cycle.crop_types.growth_stages)
  const percentage = getProgressPercentage(cycle.planting_date, cycle.expected_harvest_date)
  const isSugarcane = cycle.crop_types.name.trim().toLowerCase() === 'sugarcane'

  const inputCost = financials?.inputCost ?? 0
  const profit = financials?.profit ?? null
  const marginPercent = financials?.marginPercent ?? null

  return (
    <div className="cycle-card">
      <div className="cycle-card-header">
        <h2>{cycle.crop_types.name}</h2>
        <span className={`cycle-status cycle-status-${cycle.status}`}>{cycle.status}</span>
      </div>

      {percentage != null && (
        <div className="cycle-progress-track">
          <div className="cycle-progress-fill" style={{ width: `${percentage}%` }} />
        </div>
      )}

      <div className="cycle-stage-meta">
        <span>
          {stage.readyForHarvest ? 'Ready for harvest' : (stage.stage?.name ?? 'Growing')} (day {stage.dayNumber})
        </span>
        {percentage != null ? (
          <span className="cycle-stage-percentage">{percentage}%</span>
        ) : (
          <span className="cycle-hint">Set an expected harvest date for a progress bar</span>
        )}
      </div>

      <div className="cycle-info-row">
        <div className="cycle-details">
          <DetailRow label="Planted" value={formatDateShort(cycle.planting_date)} />
          <DetailRow label="Expected harvest" value={formatDateShort(cycle.expected_harvest_date)} />
          <DetailRow label="Input cost so far" value={inputCost.toFixed(2)} />

          {profit != null && (
            <DetailRow
              label="Profit"
              value={`${profit.toFixed(2)}${marginPercent != null ? ` (${marginPercent.toFixed(1)}%)` : ''}`}
            />
          )}
        </div>

        <div className="cycle-card-actions">
          {isSugarcane && onForecast && (
            <button type="button" className="btn-outline" onClick={onForecast}>
              Weather Forecast
            </button>
          )}
          <button type="button" className="btn-outline" onClick={onHarvest}>
            Mark as Harvested
          </button>
          <button type="button" className="btn-outline" onClick={onLogActivity}>
            Log Activity
          </button>
          <button type="button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default CropCycleCard
