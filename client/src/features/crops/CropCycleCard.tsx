import type { CropCycle } from './cropCyclesApi'
import type { CropCycleFinancials } from '../financials/financialsApi'
import { getCurrentStage, getProgressPercentage } from '../../lib/growthStage'
import './CropCycleCard.css'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="cycle-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function CropCycleCard({
  cycle,
  financials,
  onHarvest,
  onRecordSale,
  onLogActivity,
  onEdit,
  onDelete,
}: {
  cycle: CropCycle
  financials: CropCycleFinancials | undefined
  onHarvest: () => void
  onRecordSale: () => void
  onLogActivity: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isHarvested = cycle.status === 'harvested'
  const stage = !isHarvested ? getCurrentStage(cycle.planting_date, cycle.crop_types.growth_stages) : null
  const percentage = !isHarvested ? getProgressPercentage(cycle.planting_date, cycle.expected_harvest_date) : null

  const revenue = financials?.revenue ?? null
  const inputCost = financials?.inputCost ?? 0
  const profit = financials?.profit ?? null
  const marginPercent = financials?.marginPercent ?? null

  return (
    <div className="cycle-card">
      <div className="cycle-card-header">
        <h2>{cycle.crop_types.name}</h2>
        <span className={`cycle-status cycle-status-${cycle.status}`}>{cycle.status}</span>
      </div>

      {!isHarvested && (
        <div className="cycle-progress">
          {percentage != null ? (
            <>
              <div className="cycle-progress-track">
                <div className="cycle-progress-fill" style={{ width: `${percentage}%` }} />
              </div>
              <div className="cycle-progress-meta">
                <span>{stage?.readyForHarvest ? 'Ready for harvest' : (stage?.stage?.name ?? 'Growing')}</span>
                <span>{percentage}%</span>
              </div>
            </>
          ) : (
            <p className="cycle-hint">
              {stage?.stage ? `Stage: ${stage.stage.name} (day ${stage.dayNumber})` : `Day ${stage?.dayNumber ?? 0}`}
              {' — set an expected harvest date to see a progress bar'}
            </p>
          )}
        </div>
      )}

      <div className="cycle-details">
        <DetailRow label="Planted" value={formatDate(cycle.planting_date)} />
        <DetailRow label="Expected harvest" value={formatDate(cycle.expected_harvest_date)} />

        {isHarvested && (
          <>
            <DetailRow label="Harvested" value={formatDate(cycle.actual_harvest_date)} />
            <DetailRow
              label="Yield"
              value={cycle.yield_amount != null ? `${cycle.yield_amount} ${cycle.yield_unit}` : 'Not recorded'}
            />
            <DetailRow
              label="Selling price"
              value={cycle.selling_price_per_unit != null ? `${cycle.selling_price_per_unit} / unit` : '—'}
            />
            <DetailRow label="Revenue" value={revenue != null ? revenue.toFixed(2) : 'Not recorded'} />
            <DetailRow
              label="Other costs"
              value={cycle.other_costs != null ? cycle.other_costs.toFixed(2) : '—'}
            />
          </>
        )}

        <DetailRow label="Input cost so far" value={inputCost.toFixed(2)} />

        {profit != null && (
          <DetailRow
            label="Profit"
            value={`${profit.toFixed(2)}${marginPercent != null ? ` (${marginPercent.toFixed(1)}%)` : ''}`}
          />
        )}
      </div>

      <div className="cycle-card-actions">
        {isHarvested ? (
          <button type="button" className="btn-outline" onClick={onRecordSale}>
            {revenue != null ? 'Edit Sale' : 'Record Sale'}
          </button>
        ) : (
          <>
            <button type="button" className="btn-outline" onClick={onHarvest}>
              Mark as Harvested
            </button>
            <button type="button" className="btn-outline" onClick={onLogActivity}>
              Log Activity
            </button>
          </>
        )}
        <button type="button" onClick={onEdit}>
          Edit
        </button>
        <button type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}

export default CropCycleCard
