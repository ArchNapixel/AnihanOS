import { useEffect, useMemo, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { listPlots, reorderPlots, type Plot } from '../landPlots/plotsApi'
import { listCropTypes, createCropType, updateCropType, type CropType } from './cropTypesApi'
import {
  listCropCycles,
  createCropCycle,
  updateCropCycle,
  deleteCropCycle,
  markCropCycleHarvested,
  type CropCycle,
  type CropCycleInput,
  type HarvestInput,
} from './cropCyclesApi'
import { createFieldActivity, type FieldActivityInput } from './fieldActivitiesApi'
import { listCropCycleFinancials, type CropCycleFinancials } from '../financials/financialsApi'
import { listWeatherForFarm, type WeatherDaily } from '../../api/weatherApi'
import { useFarm } from '../../lib/FarmContext'
import CropPlotGroup from './CropPlotGroup'
import CropCycleFormModal, { type CropTypeAction } from './CropCycleFormModal'
import HarvestModal from './HarvestModal'
import FieldActivityModal from './FieldActivityModal'
import SugarcaneForecastModal from './SugarcaneForecastModal'
import PlotCycleHistoryModal from '../../components/PlotCycleHistoryModal'
import './CropsPage.css'

function CropsPage() {
  const { farm } = useFarm()
  const [plots, setPlots] = useState<Plot[]>([])
  const [cropTypes, setCropTypes] = useState<CropType[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [financials, setFinancials] = useState<CropCycleFinancials[]>([])
  const [weatherDays, setWeatherDays] = useState<WeatherDaily[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plotFilter, setPlotFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCycle, setEditingCycle] = useState<CropCycle | null>(null)
  const [createForPlotId, setCreateForPlotId] = useState<string | undefined>(undefined)
  const [harvestingCycle, setHarvestingCycle] = useState<CropCycle | null>(null)
  const [loggingActivityFor, setLoggingActivityFor] = useState<CropCycle | null>(null)
  const [historyForPlotId, setHistoryForPlotId] = useState<string | null>(null)
  const [forecastCycle, setForecastCycle] = useState<CropCycle | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [plotsData, cropTypesData, cyclesData, financialsData] = await Promise.all([
        listPlots(),
        listCropTypes(),
        listCropCycles(),
        listCropCycleFinancials(),
      ])
      setPlots(plotsData)
      setCropTypes(cropTypesData)
      setCycles(cyclesData)
      setFinancials(financialsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load crop cycles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (!farm) return
    listWeatherForFarm(farm.id)
      .then(setWeatherDays)
      .catch(() => setWeatherDays([]))
  }, [farm])

  const financialsByCycleId = useMemo(
    () => Object.fromEntries(financials.map((f) => [f.cycle.id, f])),
    [financials],
  )

  const groupedByPlot = useMemo(() => {
    const cyclesByPlotId = new Map<string, CropCycle[]>()
    for (const cycle of cycles) {
      const list = cyclesByPlotId.get(cycle.plot_id) ?? []
      list.push(cycle)
      cyclesByPlotId.set(cycle.plot_id, list)
    }
    return plots
      .filter((plot) => plotFilter === 'all' || plot.id === plotFilter)
      .map((plot) => ({ plot, cycles: cyclesByPlotId.get(plot.id) ?? [] }))
  }, [plots, cycles, plotFilter])

  const dragEnabled = plotFilter === 'all' && groupedByPlot.length > 1
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setPlots((current) => {
      const oldIndex = current.findIndex((p) => p.id === active.id)
      const newIndex = current.findIndex((p) => p.id === over.id)
      const reordered = arrayMove(current, oldIndex, newIndex)
      if (farm) {
        reorderPlots(
          farm.id,
          reordered.map((p) => p.id),
        ).catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to save plot order')
        })
      }
      return reordered
    })
  }

  const openCreateForm = (plotId?: string) => {
    setEditingCycle(null)
    setCreateForPlotId(plotId)
    setModalOpen(true)
  }

  const openEditForm = (cycle: CropCycle) => {
    setEditingCycle(cycle)
    setCreateForPlotId(undefined)
    setModalOpen(true)
  }

  const closeForm = () => {
    setModalOpen(false)
    setEditingCycle(null)
    setCreateForPlotId(undefined)
  }

  const handleSaveCycle = async (input: CropCycleInput, cropTypeAction: CropTypeAction) => {
    setSaving(true)
    setError(null)
    try {
      let cropTypeId = input.crop_type_id
      if (cropTypeAction.kind === 'create') {
        const created = await createCropType(cropTypeAction.input)
        cropTypeId = created.id
      } else {
        const updated = await updateCropType(cropTypeAction.id, cropTypeAction.input)
        cropTypeId = updated.id
        setCropTypes((current) => current.map((c) => (c.id === updated.id ? updated : c)))
      }
      if (editingCycle) {
        await updateCropCycle(editingCycle.id, { ...input, crop_type_id: cropTypeId })
      } else {
        await createCropCycle({ ...input, crop_type_id: cropTypeId })
      }
      closeForm()
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save crop cycle')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCycle = async (cycle: CropCycle) => {
    const confirmed = window.confirm(
      `Delete this ${cycle.crop_types.name} cycle on ${cycle.plots.name}? This cannot be undone.`,
    )
    if (!confirmed) return

    setError(null)
    try {
      await deleteCropCycle(cycle.id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete crop cycle')
    }
  }

  const handleHarvest = async (input: HarvestInput) => {
    if (!harvestingCycle) return
    setSaving(true)
    setError(null)
    try {
      await markCropCycleHarvested(harvestingCycle.id, input)
      setHarvestingCycle(null)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record harvest')
    } finally {
      setSaving(false)
    }
  }

  const handleLogActivity = async (input: FieldActivityInput) => {
    setSaving(true)
    setError(null)
    try {
      await createFieldActivity(input)
      setLoggingActivityFor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log field activity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="crops-page">
      <div className="crops-header">
        <h1>Crop Inventory & Lifecycle</h1>
      </div>

      {plots.length === 0 && <p className="crops-empty">Add a plot in Plots before creating a crop cycle.</p>}

      {error && <p className="crops-error">{error}</p>}

      {plots.length > 0 && (
        <div className="crops-filter">
          <label htmlFor="plot-filter">Plot</label>
          <select id="plot-filter" value={plotFilter} onChange={(e) => setPlotFilter(e.target.value)}>
            <option value="all">All plots</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="crops-empty">Loading...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={groupedByPlot.map(({ plot }) => plot.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="crop-plot-groups">
              {groupedByPlot.map(({ plot, cycles: plotCycles }) => (
                <CropPlotGroup
                  key={plot.id}
                  plot={plot}
                  cycles={plotCycles}
                  financialsByCycleId={financialsByCycleId}
                  dragEnabled={dragEnabled}
                  onAddCycle={() => openCreateForm(plot.id)}
                  onViewHistory={() => setHistoryForPlotId(plot.id)}
                  onHarvest={(cycle) => setHarvestingCycle(cycle)}
                  onLogActivity={(cycle) => setLoggingActivityFor(cycle)}
                  onEdit={(cycle) => openEditForm(cycle)}
                  onDelete={(cycle) => handleDeleteCycle(cycle)}
                  onForecast={(cycle) => setForecastCycle(cycle)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modalOpen && (
        <CropCycleFormModal
          initialValue={editingCycle}
          initialPlotId={createForPlotId}
          plots={plots}
          cropTypes={cropTypes}
          saving={saving}
          onCancel={closeForm}
          onSave={handleSaveCycle}
        />
      )}

      {harvestingCycle && (
        <HarvestModal
          cycle={harvestingCycle}
          saving={saving}
          onCancel={() => setHarvestingCycle(null)}
          onSave={handleHarvest}
        />
      )}

      {loggingActivityFor && (
        <FieldActivityModal
          cycle={loggingActivityFor}
          saving={saving}
          onCancel={() => setLoggingActivityFor(null)}
          onSave={handleLogActivity}
        />
      )}

      {historyForPlotId &&
        (() => {
          const historyPlot = plots.find((p) => p.id === historyForPlotId)
          if (!historyPlot) return null
          return (
            <PlotCycleHistoryModal
              plot={historyPlot}
              cycles={cycles.filter((c) => c.plot_id === historyForPlotId && c.status === 'harvested')}
              onClose={() => setHistoryForPlotId(null)}
            />
          )
        })()}

      {forecastCycle && (
        <SugarcaneForecastModal
          cycle={forecastCycle}
          plot={plots.find((p) => p.id === forecastCycle.plot_id)}
          weatherDays={weatherDays}
          onClose={() => setForecastCycle(null)}
        />
      )}
    </div>
  )
}

export default CropsPage
