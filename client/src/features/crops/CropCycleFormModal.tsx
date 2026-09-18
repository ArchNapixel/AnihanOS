import { useEffect, useState, type FormEvent } from 'react'
import type { Plot } from '../landPlots/plotsApi'
import type { CropType } from './cropTypesApi'
import type { CropCycleInput } from './cropCyclesApi'
import { computeExpectedHarvestDate, type GrowthStage } from '../../lib/growthStage'
import '../../styles/modal.css'
import './CropCycleFormModal.css'

type StageUnit = 'days' | 'months'
type StageRow = { name: string; amount: string; unit: StageUnit }

const todayIso = () => new Date().toISOString().slice(0, 10)

function parseStages(rows: StageRow[]): GrowthStage[] {
  return rows
    .filter((row) => row.name.trim() && Number(row.amount) > 0)
    .map((row) => ({
      name: row.name.trim(),
      offset_days: Math.round(Number(row.amount) * (row.unit === 'months' ? 30 : 1)),
    }))
    .sort((a, b) => a.offset_days - b.offset_days)
}

function CropCycleFormModal({
  plots,
  cropTypes,
  saving,
  onCancel,
  onSave,
}: {
  plots: Plot[]
  cropTypes: CropType[]
  saving: boolean
  onCancel: () => void
  onSave: (
    input: CropCycleInput,
    newCropType: { name: string; growth_stages: GrowthStage[]; canopy_closure_days: number | null } | null,
  ) => void
}) {
  const [plotId, setPlotId] = useState(plots[0]?.id ?? '')
  const [cropMode, setCropMode] = useState<'existing' | 'new'>(cropTypes.length > 0 ? 'existing' : 'new')
  const [selectedCropTypeId, setSelectedCropTypeId] = useState(cropTypes[0]?.id ?? '')
  const [newCropName, setNewCropName] = useState('')
  const [stageRows, setStageRows] = useState<StageRow[]>([{ name: '', amount: '', unit: 'months' }])
  const [canopyAmount, setCanopyAmount] = useState('')
  const [canopyUnit, setCanopyUnit] = useState<StageUnit>('months')
  const [plantingDate, setPlantingDate] = useState(todayIso())
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('')
  const [autoExpectedHarvestDate, setAutoExpectedHarvestDate] = useState('')

  const selectedCropType = cropTypes.find((c) => c.id === selectedCropTypeId) ?? null

  useEffect(() => {
    const stages = cropMode === 'existing' ? selectedCropType?.growth_stages ?? [] : parseStages(stageRows)
    const computed = computeExpectedHarvestDate(plantingDate, stages)
    if (computed) {
      setExpectedHarvestDate((prev) => (prev === '' || prev === autoExpectedHarvestDate ? computed : prev))
      setAutoExpectedHarvestDate(computed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropMode, selectedCropTypeId, JSON.stringify(stageRows), plantingDate])

  const updateStageRow = (index: number, field: keyof StageRow, value: string) => {
    setStageRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addStageRow = () => setStageRows((rows) => [...rows, { name: '', amount: '', unit: 'months' }])

  const removeStageRow = (index: number) => setStageRows((rows) => rows.filter((_, i) => i !== index))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (cropMode === 'new') {
      const growth_stages = parseStages(stageRows)
      const canopy_closure_days = canopyAmount
        ? Math.round(Number(canopyAmount) * (canopyUnit === 'months' ? 30 : 1))
        : null
      onSave(
        {
          plot_id: plotId,
          crop_type_id: '', // filled in by the caller once the new crop type is created
          planting_date: plantingDate,
          expected_harvest_date: expectedHarvestDate || null,
        },
        { name: newCropName.trim(), growth_stages, canopy_closure_days },
      )
    } else {
      onSave(
        {
          plot_id: plotId,
          crop_type_id: selectedCropTypeId,
          planting_date: plantingDate,
          expected_harvest_date: expectedHarvestDate || null,
        },
        null,
      )
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>Add Crop Cycle</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="cycle-plot">Plot</label>
            <select id="cycle-plot" value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
              {plots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label>Crop</label>
            <div className="crop-mode-toggle">
              <button
                type="button"
                className={cropMode === 'existing' ? 'active' : ''}
                onClick={() => setCropMode('existing')}
                disabled={cropTypes.length === 0}
              >
                Use existing crop
              </button>
              <button
                type="button"
                className={cropMode === 'new' ? 'active' : ''}
                onClick={() => setCropMode('new')}
              >
                Add new crop
              </button>
            </div>
          </div>

          {cropMode === 'existing' ? (
            <div className="modal-field">
              <label htmlFor="cycle-crop-type">Crop type</label>
              <select
                id="cycle-crop-type"
                value={selectedCropTypeId}
                onChange={(e) => setSelectedCropTypeId(e.target.value)}
                required
              >
                {cropTypes.map((cropType) => (
                  <option key={cropType.id} value={cropType.id}>
                    {cropType.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="modal-field">
                <label htmlFor="new-crop-name">New crop name</label>
                <input
                  id="new-crop-name"
                  value={newCropName}
                  onChange={(e) => setNewCropName(e.target.value)}
                  placeholder="e.g. Sugarcane"
                  required
                />
              </div>

              <div className="modal-field">
                <label>Growth stages (time from planting)</label>
                <p className="modal-hint">
                  Add each stage in order, ending with the stage where it's ready to harvest. Use whichever unit
                  fits each stage best. You only need to do this once per crop — future cycles of the same crop
                  reuse this.
                </p>
                {stageRows.map((row, index) => (
                  <div className="stage-row" key={index}>
                    <input
                      value={row.name}
                      onChange={(e) => updateStageRow(index, 'name', e.target.value)}
                      placeholder="e.g. Tillering"
                    />
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={row.amount}
                      onChange={(e) => updateStageRow(index, 'amount', e.target.value)}
                      placeholder="Amount"
                    />
                    <select value={row.unit} onChange={(e) => updateStageRow(index, 'unit', e.target.value)}>
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                    <button
                      type="button"
                      className="stage-row-remove"
                      onClick={() => removeStageRow(index)}
                      disabled={stageRows.length === 1}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button type="button" className="modal-cancel" onClick={addStageRow}>
                  + Add stage
                </button>
              </div>

              <div className="modal-field">
                <label htmlFor="canopy-amount">Weeding needed until (optional)</label>
                <p className="modal-hint">
                  How long after planting this crop still needs weeding, before its own leaves grow enough to shade
                  weeds out on their own. Used to estimate weed risk later — leave blank if unsure.
                </p>
                <div className="stage-row">
                  <input
                    id="canopy-amount"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={canopyAmount}
                    onChange={(e) => setCanopyAmount(e.target.value)}
                    placeholder="Amount"
                  />
                  <select value={canopyUnit} onChange={(e) => setCanopyUnit(e.target.value as StageUnit)}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="modal-field-row">
            <div className="modal-field">
              <label htmlFor="cycle-planting-date">Planting date</label>
              <input
                id="cycle-planting-date"
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                required
              />
            </div>
            <div className="modal-field">
              <label htmlFor="cycle-expected-date">Expected harvest date</label>
              <input
                id="cycle-expected-date"
                type="date"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !plotId}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CropCycleFormModal
