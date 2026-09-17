import { useState, type FormEvent } from 'react'
import type { Plot } from './plotsApi'
import './PlotDetailsForm.css'

export type PlotDetailsInput = {
  name: string
  size: number
  size_unit: string
  soil_type: string | null
  municipality: string | null
}

const SIZE_UNITS = ['hectares', 'acres', 'sqm']

function PlotDetailsForm({
  initialValue,
  saving,
  hasBoundary,
  isDrawingInProgress,
  onCancel,
  onSave,
}: {
  initialValue: Plot | null
  saving: boolean
  hasBoundary: boolean
  isDrawingInProgress: boolean
  onCancel: () => void
  onSave: (input: PlotDetailsInput) => void
}) {
  const [name, setName] = useState(initialValue?.name ?? '')
  const [size, setSize] = useState(initialValue ? String(initialValue.size) : '')
  const [sizeUnit, setSizeUnit] = useState(initialValue?.size_unit ?? 'hectares')
  const [soilType, setSoilType] = useState(initialValue?.soil_type ?? '')
  const [municipality, setMunicipality] = useState(initialValue?.municipality ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      size: Number(size),
      size_unit: sizeUnit,
      soil_type: soilType.trim() || null,
      municipality: municipality.trim() || null,
    })
  }

  return (
    <form className="plot-details-form" onSubmit={handleSubmit}>
      <div className="plot-form-field">
        <label htmlFor="plot-name">Land / plot name</label>
        <input
          id="plot-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. North Field"
          required
        />
      </div>

      <div className="plot-form-field-row">
        <div className="plot-form-field">
          <label htmlFor="plot-size">Size</label>
          <input
            id="plot-size"
            type="number"
            min="0.01"
            step="0.01"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            required
          />
        </div>
        <div className="plot-form-field">
          <label htmlFor="plot-size-unit">Unit</label>
          <select id="plot-size-unit" value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)}>
            {SIZE_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="plot-form-field">
        <label htmlFor="plot-soil">Soil type</label>
        <input
          id="plot-soil"
          value={soilType}
          onChange={(e) => setSoilType(e.target.value)}
          placeholder="e.g. clay loam (optional)"
        />
      </div>

      <div className="plot-form-field">
        <label htmlFor="plot-municipality">Municipality/Town</label>
        <input
          id="plot-municipality"
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          placeholder="e.g. Bacolod (optional)"
        />
      </div>

      <p
        className={
          isDrawingInProgress
            ? 'plot-form-boundary-status drawing'
            : hasBoundary
              ? 'plot-form-boundary-status ready'
              : 'plot-form-boundary-status'
        }
      >
        {isDrawingInProgress
          ? '✏️ Finish this shape first — double-click the last corner (or click the first point again) to close it.'
          : hasBoundary
            ? '✓ Boundary drawn on the map.'
            : 'Now draw this plot’s outline directly on the map behind this panel — click each corner once, then double-click the last one to finish.'}
      </p>

      <div className="plot-form-actions">
        <button type="button" className="plot-form-cancel" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving || isDrawingInProgress}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default PlotDetailsForm
