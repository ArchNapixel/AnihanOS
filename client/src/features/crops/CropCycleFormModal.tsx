import { useEffect, useState, type FormEvent } from 'react'
import type { Plot } from '../landPlots/plotsApi'
import type { CropType, CropTypeInput } from './cropTypesApi'
import type { CropCycle, CropCycleInput } from './cropCyclesApi'
import { computeExpectedHarvestDate, type GrowthStage } from '../../domain/growthStage'
import { emptyFertilizingRow, fertilizingStagesToRows, parseFertilizingStages, type FertilizingStageRow } from '../../domain/fertilizingSchedule'
import FertilizingScheduleEditor from './FertilizingScheduleEditor'
import { todayIso } from '../../lib/dateUtils'
import '../../styles/modal.css'
import './CropCycleFormModal.css'

type StageUnit = 'days' | 'months'
type StageRow = { name: string; amount: string; unit: StageUnit }

const emptyStageRow = (): StageRow => ({ name: '', amount: '', unit: 'days' })

function parseStages(rows: StageRow[]): GrowthStage[] {
  return rows
    .filter((row) => row.name.trim() && Number(row.amount) > 0)
    .map((row) => ({
      name: row.name.trim(),
      offset_days: Math.round(Number(row.amount) * (row.unit === 'months' ? 30 : 1)),
    }))
    .sort((a, b) => a.offset_days - b.offset_days)
}

function stagesToRows(stages: GrowthStage[]): StageRow[] {
  if (stages.length === 0) return [emptyStageRow()]
  return stages.map((stage) => ({ name: stage.name, amount: String(stage.offset_days), unit: 'days' as StageUnit }))
}

export type CropTypeAction =
  | { kind: 'create'; input: CropTypeInput }
  | { kind: 'update'; id: string; input: CropTypeInput }

function CropCycleFormModal({
  initialValue,
  initialPlotId,
  plots,
  cropTypes,
  saving,
  onCancel,
  onSave,
}: {
  initialValue?: CropCycle | null
  initialPlotId?: string
  plots: Plot[]
  cropTypes: CropType[]
  saving: boolean
  onCancel: () => void
  onSave: (input: CropCycleInput, cropTypeAction: CropTypeAction) => void
}) {
  const isEditing = !!initialValue
  const [plotId, setPlotId] = useState(initialValue?.plot_id ?? initialPlotId ?? plots[0]?.id ?? '')
  const [selectedCropTypeId, setSelectedCropTypeId] = useState(initialValue?.crop_type_id ?? cropTypes[0]?.id ?? '')
  const [stageRows, setStageRows] = useState<StageRow[]>([emptyStageRow()])
  const [canopyAmount, setCanopyAmount] = useState('')
  const [canopyUnit, setCanopyUnit] = useState<StageUnit>('days')
  const [description, setDescription] = useState('')
  const [harvestEstimateNote, setHarvestEstimateNote] = useState('')
  const [fertilizingRows, setFertilizingRows] = useState<FertilizingStageRow[]>([emptyFertilizingRow()])
  const [plantingDate, setPlantingDate] = useState(initialValue?.planting_date ?? todayIso())
  const [expectedHarvestDate, setExpectedHarvestDate] = useState(initialValue?.expected_harvest_date ?? '')
  const [ratoonNumber, setRatoonNumber] = useState(initialValue?.ratoon_number ?? 0)
  const [autoExpectedHarvestDate, setAutoExpectedHarvestDate] = useState('')
  // Product Book fields (growth stages, fertilizing schedule, etc.) are the
  // same for every cycle of a crop type and are rarely touched — collapsed
  // by default so adding a routine cycle is just plot/date/ratoon.
  const [showCropSetup, setShowCropSetup] = useState(false)

  const selectedCropType = cropTypes.find((c) => c.id === selectedCropTypeId) ?? null

  // Whenever an existing crop is selected (including on first render, e.g.
  // when editing a cycle), load its current Product Book fields into the
  // form so they're editable right here — same fields, same layout, whether
  // you're adding a cycle for it or editing one.
  useEffect(() => {
    const type = cropTypes.find((c) => c.id === selectedCropTypeId)
    if (!type) return
    setStageRows(stagesToRows(type.growth_stages))
    setCanopyAmount(type.canopy_closure_days != null ? String(type.canopy_closure_days) : '')
    setCanopyUnit('days')
    setDescription(type.description ?? '')
    setHarvestEstimateNote(type.harvest_estimate_note ?? '')
    setFertilizingRows(fertilizingStagesToRows(type.fertilizing_schedule))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCropTypeId])

  useEffect(() => {
    const stages = parseStages(stageRows)
    const computed = computeExpectedHarvestDate(plantingDate, stages)
    if (computed) {
      setExpectedHarvestDate((prev) => (prev === '' || prev === autoExpectedHarvestDate ? computed : prev))
      setAutoExpectedHarvestDate(computed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(stageRows), plantingDate])

  const updateStageRow = (index: number, field: keyof StageRow, value: string) => {
    setStageRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addStageRow = () => setStageRows((rows) => [...rows, emptyStageRow()])

  const removeStageRow = (index: number) => setStageRows((rows) => rows.filter((_, i) => i !== index))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const growth_stages = parseStages(stageRows)
    const canopy_closure_days = canopyAmount
      ? Math.round(Number(canopyAmount) * (canopyUnit === 'months' ? 30 : 1))
      : null
    const cropTypeInput: CropTypeInput = {
      name: selectedCropType?.name ?? '',
      growth_stages,
      canopy_closure_days,
      description: description.trim() || null,
      harvest_estimate_note: harvestEstimateNote.trim() || null,
      fertilizing_schedule: parseFertilizingStages(fertilizingRows),
    }

    const cycleInput: CropCycleInput = {
      plot_id: plotId,
      crop_type_id: selectedCropTypeId,
      planting_date: plantingDate,
      expected_harvest_date: expectedHarvestDate || null,
      ratoon_number: ratoonNumber,
    }

    onSave(cycleInput, { kind: 'update', id: selectedCropTypeId, input: cropTypeInput })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide crop-cycle-modal">
        <h2>{isEditing ? 'Edit Crop Cycle' : 'Add Crop Cycle'}</h2>
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

          {cropTypes.length === 0 ? (
            <p className="modal-hint">No crop types are set up for this farm yet — contact support to add one.</p>
          ) : (
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
          )}

          {!showCropSetup ? (
            <button type="button" className="modal-cancel" onClick={() => setShowCropSetup(true)}>
              + Edit crop setup (growth stages, fertilizing schedule — rarely needed)
            </button>
          ) : (
            <>
              <div className="modal-field">
                <label htmlFor="crop-description">Description (optional)</label>
                <textarea
                  id="crop-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="General growth info / overview"
                />
              </div>

              <div className="modal-field">
                <label>Growth stages (time from planting)</label>
                <p className="modal-hint">
                  Add each stage in order, ending with the stage where it's ready to harvest. Use whichever unit fits
                  each stage best. These are shared by every cycle of this crop, so editing them here updates the crop
                  itself.
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

              <div className="modal-field">
                <label htmlFor="crop-harvest-estimate">Harvest estimate (optional)</label>
                <textarea
                  id="crop-harvest-estimate"
                  value={harvestEstimateNote}
                  onChange={(e) => setHarvestEstimateNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Typically yields 60-80 tons/hectare"
                />
              </div>

              <FertilizingScheduleEditor rows={fertilizingRows} onChange={setFertilizingRows} />
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

          <div className="modal-field">
            <label htmlFor="cycle-ratoon">Ratoon generation</label>
            <p className="modal-hint">
              Is this a fresh planting or a regrowth from a previous harvest's stubble? Ratoons need less fertilizer
              and yield somewhat less than plant cane — used by the fertilizer forecast.
            </p>
            <select
              id="cycle-ratoon"
              value={ratoonNumber}
              onChange={(e) => setRatoonNumber(Number(e.target.value))}
            >
              <option value={0}>Plant cane (fresh planting)</option>
              <option value={1}>1st ratoon</option>
              <option value={2}>2nd ratoon</option>
              <option value={3}>3rd+ ratoon</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !plotId || !selectedCropTypeId}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CropCycleFormModal
