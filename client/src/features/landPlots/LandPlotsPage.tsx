import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import { createPlot, deletePlot, listPlots, updatePlot, type Plot, type PlotInput } from './plotsApi'
import { fetchFarmPlotsGeoJson, type PlotFeatureCollection } from '../../api/plotsGeoJsonApi'
import { getOrCreateDefaultFarm } from '../../api/farmApi'
import { polygonCentroid } from '../../lib/geo'
import { getCurrentStage, getProgressPercentage, type CropProgressInfo } from '../../domain/growthStage'
import { listCropCycles } from '../crops/cropCyclesApi'
import AllPlotsMap, { type AllPlotsMapHandle } from '../../components/AllPlotsMap'
import PlotDetailsForm, { type PlotDetailsInput } from './PlotDetailsForm'
import PlotDetailModal from './PlotDetailModal'
import './LandPlotsPage.css'

const EMPTY_COLLECTION: PlotFeatureCollection = { type: 'FeatureCollection', features: [] }

function buildCropProgressByPlotId(
  cycles: Awaited<ReturnType<typeof listCropCycles>>,
): Record<string, CropProgressInfo[]> {
  const result: Record<string, CropProgressInfo[]> = {}

  for (const cycle of cycles) {
    if (cycle.status === 'harvested') continue

    const stage = getCurrentStage(cycle.planting_date, cycle.crop_types.growth_stages)
    const info: CropProgressInfo = {
      cropName: cycle.crop_types.name,
      stageName: stage.readyForHarvest ? 'Ready for harvest' : (stage.stage?.name ?? null),
      percentage: getProgressPercentage(cycle.planting_date, cycle.expected_harvest_date),
      plantingDate: cycle.planting_date,
      expectedHarvestDate: cycle.expected_harvest_date,
    }

    result[cycle.plot_id] = result[cycle.plot_id] ?? []
    result[cycle.plot_id].push(info)
  }

  for (const plotId in result) {
    result[plotId].sort((a, b) => (a.plantingDate < b.plantingDate ? 1 : -1))
  }

  return result
}

function LandPlotsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mapHandleRef = useRef<AllPlotsMapHandle>(null)
  const [plots, setPlots] = useState<Plot[]>([])
  const [featureCollection, setFeatureCollection] = useState<PlotFeatureCollection>(EMPTY_COLLECTION)
  const [cropProgressByPlotId, setCropProgressByPlotId] = useState<Record<string, CropProgressInfo[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<'list' | 'form'>('list')
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null)
  const [draftBoundary, setDraftBoundary] = useState<GeoJSON.Polygon | null>(null)
  const [boundaryMode, setBoundaryMode] = useState<'draw' | 'coordinates'>('draw')
  const [viewingPlot, setViewingPlot] = useState<Plot | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDrawingInProgress, setIsDrawingInProgress] = useState(false)
  // Mobile-only: the map+floating-panel layout doesn't fit a phone screen,
  // so below a breakpoint the two become full-screen tabs instead (see CSS).
  // Ignored entirely on desktop.
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list')

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const farm = await getOrCreateDefaultFarm()
      const [plotsData, geoJson, cropCycles] = await Promise.all([
        listPlots(),
        fetchFarmPlotsGeoJson(farm.id),
        listCropCycles(),
      ])
      setPlots(plotsData)
      setFeatureCollection(geoJson)
      setCropProgressByPlotId(buildCropProgressByPlotId(cropCycles))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plots')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  // Deep-link support: other pages (e.g. the Dashboard) link here with
  // ?plot=<id> to jump straight to a specific plot once it's loaded.
  useEffect(() => {
    const plotId = searchParams.get('plot')
    if (!plotId || plots.length === 0) return

    const match = plots.find((plot) => plot.id === plotId)
    if (match) {
      flyToPlot(match)
    }
    setSearchParams(
      (params) => {
        params.delete('plot')
        return params
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plots])

  const flyToPlot = (plot: Plot) => {
    if (plot.boundary) {
      mapHandleRef.current?.flyToBounds(L.geoJSON(plot.boundary).getBounds())
    } else if (plot.latitude != null && plot.longitude != null) {
      mapHandleRef.current?.flyToPoint(plot.latitude, plot.longitude)
    }
  }

  const flyToPlotAndShowMap = (plot: Plot) => {
    flyToPlot(plot)
    setMobileView('map')
  }

  const openCreateForm = () => {
    setEditingPlot(null)
    setDraftBoundary(null)
    setBoundaryMode('draw')
    setError(null)
    setIsDrawingInProgress(false)
    setPanelMode('form')
  }

  const openEditForm = (plot: Plot) => {
    setEditingPlot(plot)
    setDraftBoundary(plot.boundary)
    setBoundaryMode('draw')
    setError(null)
    setIsDrawingInProgress(false)
    setPanelMode('form')
    flyToPlot(plot)
  }

  const closeForm = () => {
    setPanelMode('list')
    setEditingPlot(null)
    setDraftBoundary(null)
    setBoundaryMode('draw')
    setIsDrawingInProgress(false)
  }

  const handleSaveDetails = async (details: PlotDetailsInput) => {
    setSaving(true)
    setError(null)
    try {
      const centroid = draftBoundary ? polygonCentroid(draftBoundary) : null
      const input: PlotInput = {
        ...details,
        boundary: draftBoundary,
        latitude: centroid?.latitude ?? null,
        longitude: centroid?.longitude ?? null,
      }
      const saved = editingPlot ? await updatePlot(editingPlot.id, input) : await createPlot(input)
      closeForm()
      await loadAll()
      flyToPlotAndShowMap(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plot')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (plot: Plot) => {
    const confirmed = window.confirm(`Delete "${plot.name}"? This cannot be undone.`)
    if (!confirmed) return

    setError(null)
    try {
      await deletePlot(plot.id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plot')
    }
  }

  const handleMapPlotClick = (plotId: string) => {
    if (panelMode === 'form') return
    const match = plots.find((plot) => plot.id === plotId)
    if (match) {
      setViewingPlot(match)
    }
  }

  return (
    <div className="plots-page">
      <div className="plots-map-background">
        <AllPlotsMap
          ref={mapHandleRef}
          featureCollection={featureCollection}
          cropProgressByPlotId={cropProgressByPlotId}
          onPlotClick={handleMapPlotClick}
          drawModeActive={panelMode === 'form' && boundaryMode === 'draw'}
          editingPlotId={editingPlot?.id ?? null}
          initialBoundary={editingPlot?.boundary ?? null}
          onBoundaryDrawn={setDraftBoundary}
          onDrawingInProgressChange={setIsDrawingInProgress}
        />
      </div>

      <div className="plots-mobile-toggle">
        <button type="button" className={mobileView === 'map' ? 'active' : ''} onClick={() => setMobileView('map')}>
          Map
        </button>
        <button type="button" className={mobileView === 'list' ? 'active' : ''} onClick={() => setMobileView('list')}>
          List
        </button>
      </div>

      <div className={mobileView === 'list' ? 'plots-panel mobile-visible' : 'plots-panel'}>
        {panelMode === 'list' ? (
          <>
            <div className="plots-panel-header">
              <div>
                <h1>Land & Plot Management</h1>
                <p>{loading ? 'Loading...' : `${plots.length} plot${plots.length === 1 ? '' : 's'}`}</p>
              </div>
              <Link to="/plots/schematic" className="btn-outline">
                Schematic
              </Link>
            </div>

            <button type="button" className="btn-primary plots-panel-add" onClick={openCreateForm}>
              + Add Land
            </button>

            {error && <p className="plots-panel-error">{error}</p>}

            <div className="plots-panel-list">
              {loading ? (
                <p className="plots-panel-empty">Loading...</p>
              ) : plots.length === 0 ? (
                <p className="plots-panel-empty">No plots yet. Add your first one.</p>
              ) : (
                plots.map((plot) => (
                  <div className="plot-list-item" key={plot.id}>
                    <button type="button" className="plot-list-button" onClick={() => flyToPlotAndShowMap(plot)}>
                      <strong>
                        {plot.name}
                        {plot.type === 'water' && <span className="plot-type-badge">Water</span>}
                      </strong>
                      <span>
                        {plot.size} {plot.size_unit}
                        {plot.municipality ? ` · ${plot.municipality}` : ''}
                      </span>
                    </button>
                    <div className="plot-list-actions">
                      <button type="button" onClick={() => setViewingPlot(plot)}>
                        View
                      </button>
                      <button type="button" onClick={() => openEditForm(plot)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(plot)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="plots-panel-header">
              <h1>{editingPlot ? 'Edit Land' : 'Add Land'}</h1>
            </div>

            {error && <p className="plots-panel-error">{error}</p>}

            <PlotDetailsForm
              initialValue={editingPlot}
              saving={saving}
              hasBoundary={!!draftBoundary}
              currentBoundary={draftBoundary}
              isDrawingInProgress={isDrawingInProgress}
              boundaryMode={boundaryMode}
              onBoundaryModeChange={setBoundaryMode}
              onCoordinatesChange={setDraftBoundary}
              onCancel={closeForm}
              onSave={handleSaveDetails}
            />
          </>
        )}
      </div>

      {viewingPlot && <PlotDetailModal plot={viewingPlot} onClose={() => setViewingPlot(null)} />}
    </div>
  )
}

export default LandPlotsPage
