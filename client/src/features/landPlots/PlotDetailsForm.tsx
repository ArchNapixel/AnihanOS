import { useEffect, useState, type FormEvent } from 'react'
import type { Plot, PlotType } from './plotsApi'
import { polygonAreaHectares } from '../../lib/geo'
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
  land_quality: 'good' | 'average' | 'marginal' | null
}

export type BoundaryMode = 'draw' | 'coordinates'

type CornerRow = { lat: string; lng: string }

const emptyCornerRow = (): CornerRow => ({ lat: '', lng: '' })

// GeoJSON stores rings as [lng, lat] and repeats the first point at the end
// to close the shape — neither of which a farmer typing coordinates should
// have to think about.
function cornersFromBoundary(boundary: GeoJSON.Polygon | null): CornerRow[] {
  if (!boundary) return [emptyCornerRow(), emptyCornerRow(), emptyCornerRow()]
  const ring = boundary.coordinates[0]
  const isClosed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
  const points = isClosed ? ring.slice(0, -1) : ring
  return points.map(([lng, lat]) => ({ lat: String(lat), lng: String(lng) }))
}

function polygonFromCorners(rows: CornerRow[]): GeoJSON.Polygon | null {
  const parsed = rows
    .filter((row) => row.lat.trim() !== '' && row.lng.trim() !== '')
    .map((row) => ({ lat: Number(row.lat), lng: Number(row.lng) }))
    .filter(
      (row) =>
        Number.isFinite(row.lat) &&
        Number.isFinite(row.lng) &&
        row.lat >= -90 &&
        row.lat <= 90 &&
        row.lng >= -180 &&
        row.lng <= 180,
    )

  if (parsed.length < 3) return null

  const ring: [number, number][] = parsed.map((p) => [p.lng, p.lat])
  ring.push(ring[0])
  return { type: 'Polygon', coordinates: [ring] }
}

function PlotDetailsForm({
  initialValue,
  saving,
  hasBoundary,
  currentBoundary,
  isDrawingInProgress,
  boundaryMode,
  onBoundaryModeChange,
  onCoordinatesChange,
  onCancel,
  onSave,
}: {
  initialValue: Plot | null
  saving: boolean
  hasBoundary: boolean
  currentBoundary: GeoJSON.Polygon | null
  isDrawingInProgress: boolean
  boundaryMode: BoundaryMode
  onBoundaryModeChange: (mode: BoundaryMode) => void
  onCoordinatesChange: (polygon: GeoJSON.Polygon | null) => void
  onCancel: () => void
  onSave: (input: PlotDetailsInput) => void
}) {
  const [name, setName] = useState(initialValue?.name ?? '')
  // Sugarcane-only since the 2026-09-22 pivot — the water/pond option went
  // with the aquaculture module. Kept in the type so existing rows still read.
  const type: PlotType = 'land'
  const [size, setSize] = useState(initialValue ? String(initialValue.size) : '')
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
  const [landQuality, setLandQuality] = useState<string>(initialValue?.land_quality ?? '')
  const [cornerRows, setCornerRows] = useState<CornerRow[]>(() => cornersFromBoundary(initialValue?.boundary ?? null))
  const [showSoilTest, setShowSoilTest] = useState(
    () =>
      initialValue?.soil_organic_matter_pct != null ||
      initialValue?.soil_n_ppm != null ||
      initialValue?.soil_p_bray_ppm != null ||
      initialValue?.soil_k_exchangeable_ppm != null,
  )

  // Only pushes a polygon up while coordinate-entry is the active mode, so
  // switching back to drawing doesn't get immediately overwritten by
  // whatever's sitting in the (now hidden) coordinate rows.
  useEffect(() => {
    if (boundaryMode !== 'coordinates') return
    onCoordinatesChange(polygonFromCorners(cornerRows))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundaryMode, JSON.stringify(cornerRows)])

  const updateCornerRow = (index: number, field: keyof CornerRow, value: string) => {
    setCornerRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addCornerRow = () => setCornerRows((rows) => [...rows, emptyCornerRow()])

  const removeCornerRow = (index: number) => setCornerRows((rows) => rows.filter((_, i) => i !== index))

  // Re-seeds from whatever is currently drafted (a freshly-drawn shape, or
  // the original saved boundary) at the moment of switching, so hopping
  // from Draw to Coordinates never silently discards a new drawing.
  const switchToCoordinates = () => {
    setCornerRows(cornersFromBoundary(currentBoundary))
    onBoundaryModeChange('coordinates')
  }

  const coordinatesBoundary = polygonFromCorners(cornerRows)
  const activeBoundary = boundaryMode === 'draw' ? currentBoundary : coordinatesBoundary

  // Recalculates hectares from the shape whenever it changes. The field
  // stays a normal editable input, so a plot without a drawn shape (or one
  // whose farmer prefers their land title's exact figure) can still be
  // typed in manually.
  useEffect(() => {
    if (!activeBoundary) return
    setSize(polygonAreaHectares(activeBoundary).toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeBoundary)])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      type,
      size: Number(size),
      size_unit: 'hectares',
      soil_type: type === 'land' ? soilType.trim() || null : null,
      municipality: municipality.trim() || null,
      soil_organic_matter_pct: type === 'land' && soilOrganicMatterPct ? Number(soilOrganicMatterPct) : null,
      soil_n_ppm: type === 'land' && soilNPpm ? Number(soilNPpm) : null,
      soil_p_bray_ppm: type === 'land' && soilPBrayPpm ? Number(soilPBrayPpm) : null,
      soil_k_exchangeable_ppm: type === 'land' && soilKExchangeablePpm ? Number(soilKExchangeablePpm) : null,
      land_quality:
        type === 'land' && landQuality ? (landQuality as 'good' | 'average' | 'marginal') : null,
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

      <div className="plot-form-field">
        <label htmlFor="plot-size">Size (hectares)</label>
        <input
          id="plot-size"
          type="number"
          min="0.01"
          step="0.01"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          required
        />
        <p className="plot-form-hint">
          {activeBoundary
            ? 'Auto-calculated from the boundary — edit if your land title states a different figure.'
            : 'Draw or enter a boundary below to auto-calculate this, or type it in manually.'}
        </p>
      </div>

      {type === 'land' && (
        <div className="plot-form-field">
          <label htmlFor="plot-land-quality">How good is this land?</label>
          <p className="plot-form-hint">
            Your own judgement is enough — it sets the starting yield estimate for this plot. Leave blank and
            forecasts use the Bukidnon average.
          </p>
          <select id="plot-land-quality" value={landQuality} onChange={(e) => setLandQuality(e.target.value)}>
            <option value="">Not sure — use the Bukidnon average (55 tons/ha)</option>
            <option value="good">Good land — flat, fertile (60 tons/ha)</option>
            <option value="average">Average land (55 tons/ha)</option>
            <option value="marginal">Marginal — steep, thin or poor soil (50 tons/ha)</option>
          </select>
        </div>
      )}

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

      {type === 'land' && !showSoilTest && (
        <button type="button" className="plot-form-cancel" onClick={() => setShowSoilTest(true)}>
          + Add soil test results (optional)
        </button>
      )}

      {type === 'land' && showSoilTest && (
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

      <div className="plot-form-field">
        <label>Plot boundary</label>
        <div className="plot-type-toggle">
          <button
            type="button"
            className={boundaryMode === 'draw' ? 'active' : ''}
            onClick={() => onBoundaryModeChange('draw')}
          >
            Draw on map
          </button>
          <button
            type="button"
            className={boundaryMode === 'coordinates' ? 'active' : ''}
            onClick={switchToCoordinates}
          >
            Enter coordinates
          </button>
        </div>
      </div>

      {boundaryMode === 'draw' ? (
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
      ) : (
        <div className="plot-form-field">
          <p className="plot-form-hint">
            Enter each corner's GPS coordinates in order (e.g. from a land title, a handheld GPS, or by walking the
            perimeter with a GPS app). Needs at least 3 corners to form a shape.
          </p>
          {cornerRows.map((row, index) => (
            <div className="corner-row" key={index}>
              <span className="corner-row-index">{index + 1}</span>
              <input
                type="number"
                step="any"
                value={row.lat}
                onChange={(e) => updateCornerRow(index, 'lat', e.target.value)}
                placeholder="Latitude"
              />
              <input
                type="number"
                step="any"
                value={row.lng}
                onChange={(e) => updateCornerRow(index, 'lng', e.target.value)}
                placeholder="Longitude"
              />
              <button
                type="button"
                className="corner-row-remove"
                onClick={() => removeCornerRow(index)}
                disabled={cornerRows.length <= 3}
              >
                &times;
              </button>
            </div>
          ))}
          <button type="button" className="plot-form-cancel" onClick={addCornerRow}>
            + Add corner
          </button>
          <p className={coordinatesBoundary ? 'plot-form-boundary-status ready' : 'plot-form-boundary-status'}>
            {coordinatesBoundary
              ? '✓ Shape formed from these coordinates.'
              : 'Fill in at least 3 valid corners to form a shape.'}
          </p>
        </div>
      )}

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
