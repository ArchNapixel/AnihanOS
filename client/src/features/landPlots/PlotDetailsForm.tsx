import { useState, type FormEvent } from 'react'
import type { Plot, PlotType } from './plotsApi'
import './PlotDetailsForm.css'

export type PlotDetailsInput = {
  name: string
  type: PlotType
  size: number
  size_unit: string
  soil_type: string | null
  municipality: string | null
  soil_organic_matter_pct: number | null
  soil_n_ppm: number | null
  soil_p_bray_ppm: number | null
  soil_k_exchangeable_ppm: number | null
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
  const [type, setType] = useState<PlotType>(initialValue?.type ?? 'land')
  const [size, setSize] = useState(initialValue ? String(initialValue.size) : '')
  const [sizeUnit, setSizeUnit] = useState(initialValue?.size_unit ?? 'hectares')
  const [soilType, setSoilType] = useState(initialValue?.soil_type ?? '')
  const [municipality, setMunicipality] = useState(initialValue?.municipality ?? '')
  const [soilOrganicMatterPct, setSoilOrganicMatterPct] = useState(
    initialValue?.soil_organic_matter_pct != null ? String(initialValue.soil_organic_matter_pct) : '',
  )
  const [soilNPpm, setSoilNPpm] = useState(initialValue?.soil_n_ppm != null ? String(initialValue.soil_n_ppm) : '')
  const [soilPBrayPpm, setSoilPBrayPpm] = useState(
    initialValue?.soil_p_bray_ppm != null ? String(initialValue.soil_p_bray_ppm) : '',
  )
  const [soilKExchangeablePpm, setSoilKExchangeablePpm] = useState(
    initialValue?.soil_k_exchangeable_ppm != null ? String(initialValue.soil_k_exchangeable_ppm) : '',
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      type,
      size: Number(size),
      size_unit: sizeUnit,
      soil_type: type === 'land' ? soilType.trim() || null : null,
      municipality: municipality.trim() || null,
      soil_organic_matter_pct: type === 'land' && soilOrganicMatterPct ? Number(soilOrganicMatterPct) : null,
      soil_n_ppm: type === 'land' && soilNPpm ? Number(soilNPpm) : null,
      soil_p_bray_ppm: type === 'land' && soilPBrayPpm ? Number(soilPBrayPpm) : null,
      soil_k_exchangeable_ppm: type === 'land' && soilKExchangeablePpm ? Number(soilKExchangeablePpm) : null,
    })
  }

  return (
    <form className="plot-details-form" onSubmit={handleSubmit}>
      <div className="plot-form-field">
        <label>Type</label>
        <div className="plot-type-toggle">
          <button type="button" className={type === 'land' ? 'active' : ''} onClick={() => setType('land')}>
            Land
          </button>
          <button type="button" className={type === 'water' ? 'active' : ''} onClick={() => setType('water')}>
            Water (pond/cage/pen)
          </button>
        </div>
      </div>

      <div className="plot-form-field">
        <label htmlFor="plot-name">{type === 'water' ? 'Pond/Cage name' : 'Land / plot name'}</label>
        <input
          id="plot-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'water' ? 'e.g. Pond 1' : 'e.g. North Field'}
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

      {type === 'land' && (
        <div className="plot-form-field">
          <label htmlFor="plot-soil">Soil type</label>
          <input
            id="plot-soil"
            value={soilType}
            onChange={(e) => setSoilType(e.target.value)}
            placeholder="e.g. clay loam (optional)"
          />
        </div>
      )}

      {type === 'land' && (
        <div className="plot-form-field">
          <label>Soil test results (optional)</label>
          <p className="plot-form-hint">
            Only fill this in if you have lab results for this plot. Left blank, fertilizer forecasts assume a
            medium-fertility baseline instead.
          </p>
          <div className="plot-form-field-row">
            <div className="plot-form-field">
              <label htmlFor="plot-soil-om">Organic matter (%)</label>
              <input
                id="plot-soil-om"
                type="number"
                min="0"
                step="0.1"
                value={soilOrganicMatterPct}
                onChange={(e) => setSoilOrganicMatterPct(e.target.value)}
              />
            </div>
            <div className="plot-form-field">
              <label htmlFor="plot-soil-n">Soil N (ppm)</label>
              <input
                id="plot-soil-n"
                type="number"
                min="0"
                step="0.1"
                value={soilNPpm}
                onChange={(e) => setSoilNPpm(e.target.value)}
              />
            </div>
          </div>
          <div className="plot-form-field-row">
            <div className="plot-form-field">
              <label htmlFor="plot-soil-p">Soil P, Bray (ppm)</label>
              <input
                id="plot-soil-p"
                type="number"
                min="0"
                step="0.1"
                value={soilPBrayPpm}
                onChange={(e) => setSoilPBrayPpm(e.target.value)}
              />
            </div>
            <div className="plot-form-field">
              <label htmlFor="plot-soil-k">Soil K, exchangeable (ppm)</label>
              <input
                id="plot-soil-k"
                type="number"
                min="0"
                step="0.1"
                value={soilKExchangeablePpm}
                onChange={(e) => setSoilKExchangeablePpm(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

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
            : 'Now draw this plot’s outline on the map — click each corner once, then double-click the last one to finish. On a phone, switch to the Map tab to draw, then back to List to save.'}
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
