import { useEffect, useState } from 'react'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import { listCropTypes, createCropType, type CropType } from './cropTypesApi'
import {
  listCropCycles,
  createCropCycle,
  markCropCycleHarvested,
  recordCropCycleSale,
  type CropCycle,
  type CropCycleInput,
  type HarvestInput,
  type SaleInput,
} from './cropCyclesApi'
import { createFieldActivity, type FieldActivityInput } from './fieldActivitiesApi'
import { getCurrentStage, type GrowthStage } from '../../lib/growthStage'
import CropCycleFormModal from './CropCycleFormModal'
import HarvestModal from './HarvestModal'
import RecordSaleModal from './RecordSaleModal'
import FieldActivityModal from './FieldActivityModal'
import './CropsPage.css'

function CropsPage() {
  const [plots, setPlots] = useState<Plot[]>([])
  const [cropTypes, setCropTypes] = useState<CropType[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plotFilter, setPlotFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [harvestingCycle, setHarvestingCycle] = useState<CropCycle | null>(null)
  const [sellingCycle, setSellingCycle] = useState<CropCycle | null>(null)
  const [loggingActivityFor, setLoggingActivityFor] = useState<CropCycle | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [plotsData, cropTypesData, cyclesData] = await Promise.all([
        listPlots(),
        listCropTypes(),
        listCropCycles(),
      ])
      setPlots(plotsData)
      setCropTypes(cropTypesData)
      setCycles(cyclesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load crop cycles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleSaveCycle = async (
    input: CropCycleInput,
    newCropType: { name: string; growth_stages: GrowthStage[]; canopy_closure_days: number | null } | null,
  ) => {
    setSaving(true)
    setError(null)
    try {
      let cropTypeId = input.crop_type_id
      if (newCropType) {
        const created = await createCropType(newCropType)
        cropTypeId = created.id
      }
      await createCropCycle({ ...input, crop_type_id: cropTypeId })
      setModalOpen(false)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save crop cycle')
    } finally {
      setSaving(false)
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

  const handleRecordSale = async (input: SaleInput) => {
    if (!sellingCycle) return
    setSaving(true)
    setError(null)
    try {
      await recordCropCycleSale(sellingCycle.id, input)
      setSellingCycle(null)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale')
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

  const visibleCycles = plotFilter === 'all' ? cycles : cycles.filter((c) => c.plot_id === plotFilter)

  return (
    <div className="crops-page">
      <div className="crops-header">
        <h1>Crop Inventory & Lifecycle</h1>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)} disabled={plots.length === 0}>
          + Add Crop Cycle
        </button>
      </div>

      {plots.length === 0 && (
        <p className="crops-empty">Add a plot in Plots before creating a crop cycle.</p>
      )}

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
      ) : visibleCycles.length === 0 ? (
        <p className="crops-empty">No crop cycles yet.</p>
      ) : (
        <div className="cycle-grid">
          {visibleCycles.map((cycle) => {
            const stage =
              cycle.status !== 'harvested'
                ? getCurrentStage(cycle.planting_date, cycle.crop_types.growth_stages)
                : null

            const revenue =
              cycle.yield_amount != null && cycle.selling_price_per_unit != null
                ? cycle.yield_amount * cycle.selling_price_per_unit
                : null

            return (
              <div className="cycle-card" key={cycle.id}>
                <div className="cycle-card-header">
                  <h2>{cycle.crop_types.name}</h2>
                  <span className={`cycle-status cycle-status-${cycle.status}`}>{cycle.status}</span>
                </div>
                <p className="cycle-plot-name">{cycle.plots.name}</p>
                <p>Planted: {cycle.planting_date}</p>

                {cycle.status === 'harvested' ? (
                  <>
                    <p>Harvested: {cycle.actual_harvest_date}</p>
                    {cycle.yield_amount != null && (
                      <p>
                        Yield: {cycle.yield_amount} {cycle.yield_unit}
                      </p>
                    )}
                    {revenue != null ? (
                      <p>Revenue: {revenue.toFixed(2)}</p>
                    ) : (
                      <p className="cycle-hint">Sale not recorded yet</p>
                    )}
                    <button type="button" className="btn-outline" onClick={() => setSellingCycle(cycle)}>
                      {revenue != null ? 'Edit Sale' : 'Record Sale'}
                    </button>
                  </>
                ) : (
                  <>
                    {cycle.expected_harvest_date && <p>Expected harvest: {cycle.expected_harvest_date}</p>}
                    {stage?.stage && (
                      <p className="cycle-stage">
                        {stage.readyForHarvest ? 'Ready for harvest' : `Stage: ${stage.stage.name}`} (day{' '}
                        {stage.dayNumber})
                      </p>
                    )}
                    <div className="cycle-card-actions">
                      <button type="button" className="btn-outline" onClick={() => setHarvestingCycle(cycle)}>
                        Mark as Harvested
                      </button>
                      <button type="button" className="btn-outline" onClick={() => setLoggingActivityFor(cycle)}>
                        Log Activity
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <CropCycleFormModal
          plots={plots}
          cropTypes={cropTypes}
          saving={saving}
          onCancel={() => setModalOpen(false)}
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

      {sellingCycle && (
        <RecordSaleModal
          cycle={sellingCycle}
          saving={saving}
          onCancel={() => setSellingCycle(null)}
          onSave={handleRecordSale}
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
    </div>
  )
}

export default CropsPage
