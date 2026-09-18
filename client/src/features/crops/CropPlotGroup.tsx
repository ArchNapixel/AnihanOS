import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Plot } from '../landPlots/plotsApi'
import type { CropCycle } from './cropCyclesApi'
import type { CropCycleFinancials } from '../financials/financialsApi'
import CropCycleCard from './CropCycleCard'

function CropPlotGroup({
  plot,
  cycles,
  financialsByCycleId,
  dragEnabled,
  onAddCycle,
  onViewHistory,
  onHarvest,
  onRecordSale,
  onLogActivity,
  onEdit,
  onDelete,
}: {
  plot: Plot
  cycles: CropCycle[]
  financialsByCycleId: Record<string, CropCycleFinancials>
  dragEnabled: boolean
  onAddCycle: () => void
  onViewHistory: () => void
  onHarvest: (cycle: CropCycle) => void
  onRecordSale: (cycle: CropCycle) => void
  onLogActivity: (cycle: CropCycle) => void
  onEdit: (cycle: CropCycle) => void
  onDelete: (cycle: CropCycle) => void
}) {
  const activeCycles = cycles.filter((cycle) => cycle.status !== 'harvested')
  const harvestedCycles = cycles.filter((cycle) => cycle.status === 'harvested')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: plot.id,
    disabled: !dragEnabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <section className="crop-plot-group" ref={setNodeRef} style={style}>
      <div className="crop-plot-group-header">
        <div className="crop-plot-group-title">
          {dragEnabled && (
            <button
              type="button"
              className="crop-plot-drag-handle"
              aria-label="Drag to reorder plot"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={18} />
            </button>
          )}
          <div>
            <h2>{plot.name}</h2>
            <span className="crop-plot-group-meta">
              {plot.size} {plot.size_unit}
              {plot.municipality ? ` · ${plot.municipality}` : ''} · {activeCycles.length} active cycle
              {activeCycles.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="crop-plot-group-actions">
          {harvestedCycles.length > 0 && (
            <button type="button" className="btn-outline" onClick={onViewHistory}>
              Cycle History Logs
            </button>
          )}
          <button type="button" className="btn-outline" onClick={onAddCycle}>
            + Add Cycle
          </button>
        </div>
      </div>

      {activeCycles.length === 0 ? (
        <p className="crops-empty">No active crop cycles on this plot.</p>
      ) : (
        <div className="cycle-grid">
          {activeCycles.map((cycle) => (
            <CropCycleCard
              key={cycle.id}
              cycle={cycle}
              financials={financialsByCycleId[cycle.id]}
              onHarvest={() => onHarvest(cycle)}
              onRecordSale={() => onRecordSale(cycle)}
              onLogActivity={() => onLogActivity(cycle)}
              onEdit={() => onEdit(cycle)}
              onDelete={() => onDelete(cycle)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default CropPlotGroup
