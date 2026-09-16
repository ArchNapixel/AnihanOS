import { useState, type FormEvent } from 'react'
import type { Plot, PlotInput } from './plotsApi'
import PlotBoundaryMap from '../../components/PlotBoundaryMap'
import { polygonCentroid } from '../../lib/geo'
import '../../styles/modal.css'
import './PlotFormModal.css'

const SIZE_UNITS = ['hectares', 'acres', 'sqm']

function PlotFormModal({
  initialValue,
  saving,
  onCancel,
  onSave,
}: {
  initialValue: Plot | null
  saving: boolean
  onCancel: () => void
  onSave: (input: PlotInput) => void
}) {
  const [name, setName] = useState(initialValue?.name ?? '')
  const [size, setSize] = useState(initialValue ? String(initialValue.size) : '')
  const [sizeUnit, setSizeUnit] = useState(initialValue?.size_unit ?? 'hectares')
  const [soilType, setSoilType] = useState(initialValue?.soil_type ?? '')
  const [boundary, setBoundary] = useState<GeoJSON.Polygon | null>(initialValue?.boundary ?? null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const centroid = boundary ? polygonCentroid(boundary) : null

    onSave({
      name: name.trim(),
      size: Number(size),
      size_unit: sizeUnit,
      soil_type: soilType.trim() || null,
      boundary,
      latitude: centroid?.latitude ?? null,
      longitude: centroid?.longitude ?? null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <h2>{initialValue ? 'Edit Land' : 'Add Land'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="plot-name">Land / plot name</label>
            <input
              id="plot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Field"
              required
            />
          </div>

          <div className="modal-field-row">
            <div className="modal-field">
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
            <div className="modal-field">
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

          <div className="modal-field">
            <label htmlFor="plot-soil">Soil type</label>
            <input
              id="plot-soil"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              placeholder="e.g. clay loam (optional)"
            />
          </div>

          <div className="modal-field">
            <label>Land boundary (optional)</label>
            <p className="modal-hint">Use the polygon tool on the left of the map to trace this plot's outline.</p>
            <PlotBoundaryMap value={boundary} onChange={setBoundary} />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PlotFormModal
