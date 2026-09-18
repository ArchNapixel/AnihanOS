import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { PlotFeatureCollection } from '../api/plotsGeoJsonApi'
import type { CropProgressInfo } from '../domain/growthStage'
import { formatDateShort } from '../lib/dateUtils'
import './AllPlotsMap.css'

function escapeHtml(value: string): string {
  const div = document.createElement('div')
  div.textContent = value
  return div.innerHTML
}

function buildCropPopupEntryHtml(info: CropProgressInfo): string {
  const pct = info.percentage
  const stageLabel = escapeHtml(info.stageName ?? 'Growing')
  const cropName = escapeHtml(info.cropName)
  const plantedLabel = formatDateShort(info.plantingDate)
  const harvestLabel = info.expectedHarvestDate ? formatDateShort(info.expectedHarvestDate) : 'Not set'

  return `
    <div class="crop-progress-entry">
      <strong>${cropName}</strong>
      <div class="crop-progress-track"><div class="crop-progress-fill" style="width:${pct ?? 0}%"></div></div>
      <div class="crop-progress-meta"><span>${stageLabel}</span><span>${pct != null ? `${pct}%` : '—'}</span></div>
      <div class="crop-progress-dates"><span>Planted ${plantedLabel}</span><span>Est. harvest ${harvestLabel}</span></div>
    </div>
  `
}

function buildCropPopupHtml(infoList: CropProgressInfo[]): string {
  return `<div class="crop-progress-popup">${infoList.map(buildCropPopupEntryHtml).join('')}</div>`
}

// Vite doesn't resolve Leaflet's default marker asset paths automatically.
L.Marker.prototype.options.icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow })

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY
const PHILIPPINES_CENTER: L.LatLngTuple = [12.8797, 121.774]
const DEFAULT_ZOOM = 6
// Loose bounding box around the Philippine archipelago, used to keep panning
// from wandering off into the rest of the world map.
const PHILIPPINES_BOUNDS = L.latLngBounds([4.5, 116.0], [21.5, 127.0])

const MAP_STYLE_URLS = {
  streets: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
  // "hybrid" overlays roads/place labels on top of satellite imagery, which
  // is more useful for orientation than bare satellite tiles.
  satellite: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
} as const
type MapStyleKey = keyof typeof MAP_STYLE_URLS

export type AllPlotsMapHandle = {
  flyToBounds: (bounds: L.LatLngBounds) => void
  flyToPoint: (lat: number, lng: number) => void
}

type AllPlotsMapProps = {
  featureCollection: PlotFeatureCollection
  cropProgressByPlotId: Record<string, CropProgressInfo[]>
  onPlotClick: (plotId: string) => void
  drawModeActive: boolean
  editingPlotId: string | null
  initialBoundary: GeoJSON.Polygon | null
  onBoundaryDrawn: (polygon: GeoJSON.Polygon) => void
  onDrawingInProgressChange: (isDrawing: boolean) => void
}

const AllPlotsMap = forwardRef<AllPlotsMapHandle, AllPlotsMapProps>(
  (
    {
      featureCollection,
      cropProgressByPlotId,
      onPlotClick,
      drawModeActive,
      editingPlotId,
      initialBoundary,
      onBoundaryDrawn,
      onDrawingInProgressChange,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<L.Map | null>(null)
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)
    const draftLayerRef = useRef<L.FeatureGroup | null>(null)
    const activeDrawHandlerRef = useRef<L.Draw.Polygon | null>(null)
    const hasFitBoundsRef = useRef(false)
    const onPlotClickRef = useRef(onPlotClick)
    onPlotClickRef.current = onPlotClick
    const onBoundaryDrawnRef = useRef(onBoundaryDrawn)
    onBoundaryDrawnRef.current = onBoundaryDrawn
    const initialBoundaryRef = useRef(initialBoundary)
    initialBoundaryRef.current = initialBoundary
    const onDrawingInProgressChangeRef = useRef(onDrawingInProgressChange)
    onDrawingInProgressChangeRef.current = onDrawingInProgressChange
    const tileLayerRef = useRef<L.TileLayer | null>(null)
    const [mapStyle, setMapStyle] = useState<MapStyleKey>('streets')

    useImperativeHandle(ref, () => ({
      flyToBounds: (bounds) => {
        mapRef.current?.flyToBounds(bounds, { maxZoom: 18, duration: 1 })
      },
      flyToPoint: (lat, lng) => {
        mapRef.current?.flyTo([lat, lng], 17, { duration: 1 })
      },
    }))

    // Create the map once.
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      // React StrictMode double-invokes effects in dev mode; guard against a
      // leftover Leaflet instance from the first invocation still owning this node.
      if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
        return
      }

      const map = L.map(container, {
        minZoom: 6,
        maxBounds: PHILIPPINES_BOUNDS.pad(0.2),
        maxBoundsViscosity: 1,
      }).setView(PHILIPPINES_CENTER, DEFAULT_ZOOM)
      mapRef.current = map

      const draftLayer = new L.FeatureGroup()
      map.addLayer(draftLayer)
      draftLayerRef.current = draftLayer

      // Leaflet measures its container's pixel size at init time and caches
      // it — a single delayed invalidateSize() call wasn't enough here, so
      // instead keep watching the container's actual size for as long as the
      // map exists and re-measure Leaflet every time it changes.
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize()
      })
      resizeObserver.observe(container)

      return () => {
        resizeObserver.disconnect()
        map.remove()
        mapRef.current = null
        draftLayerRef.current = null
      }
    }, [])

    // Swap the base tile layer when the street/satellite toggle changes,
    // without touching the map instance or any of the plot overlays.
    useEffect(() => {
      const map = mapRef.current
      if (!map) return

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }

      const tileLayer = L.tileLayer(MAP_STYLE_URLS[mapStyle], {
        attribution:
          '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; OpenStreetMap contributors',
        maxZoom: 19,
      })
      tileLayer.addTo(map)
      tileLayer.bringToBack()
      tileLayerRef.current = tileLayer
    }, [mapStyle])

    // Re-render the read-only plots layer whenever the data changes. The
    // plot currently being edited is left out here — its shape lives in the
    // draft layer instead, while it's being actively redrawn.
    useEffect(() => {
      const map = mapRef.current
      if (!map) return

      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current)
      }

      const visibleCollection = editingPlotId
        ? { ...featureCollection, features: featureCollection.features.filter((f) => f.properties.id !== editingPlotId) }
        : featureCollection

      const geoJsonLayer = L.geoJSON(visibleCollection, {
        style: {
          color: '#55643c',
          weight: 2,
          fillColor: '#a8c48a',
          fillOpacity: 0.4,
        },
        onEachFeature: (feature, layer) => {
          const { id, name, area_sqm } = feature.properties as PlotFeatureCollection['features'][number]['properties']
          const hectares = (area_sqm / 10000).toFixed(2)
          layer.bindTooltip(`${escapeHtml(name)} — ${hectares} ha`, {
            permanent: true,
            direction: 'center',
            className: 'plot-map-tooltip',
          })
          layer.on('click', () => onPlotClickRef.current(id))

          const progressList = cropProgressByPlotId[id]
          if (progressList && progressList.length > 0) {
            layer.bindPopup(buildCropPopupHtml(progressList), {
              className: 'crop-progress-popup-wrapper',
              closeButton: false,
            })
            layer.on('mouseover', () => layer.openPopup())
            layer.on('mouseout', () => layer.closePopup())
          }
        },
      }).addTo(map)

      geoJsonLayerRef.current = geoJsonLayer

      if (!hasFitBoundsRef.current && featureCollection.features.length > 0) {
        map.fitBounds(geoJsonLayer.getBounds(), { padding: [32, 32] })
        hasFitBoundsRef.current = true
      }
    }, [featureCollection, editingPlotId, cropProgressByPlotId])

    // Draw mode: activates the polygon tool immediately (no toolbar hunting)
    // as soon as editing starts, and keeps re-arming it after each completed
    // shape so a farmer can redraw without any extra clicks.
    useEffect(() => {
      const map = mapRef.current
      const draftLayer = draftLayerRef.current
      if (!map || !draftLayer) return
      if (!drawModeActive) return

      if (initialBoundaryRef.current) {
        L.geoJSON(initialBoundaryRef.current, {
          style: { color: '#c17a45', weight: 2, dashArray: '6 6', fillOpacity: 0.15 },
        }).eachLayer((layer) => draftLayer.addLayer(layer))
      }

      const startDrawing = () => {
        const handler = new L.Draw.Polygon(map as unknown as L.DrawMap, {
          allowIntersection: true,
          showArea: true,
          shapeOptions: { color: '#c17a45' },
        })
        activeDrawHandlerRef.current = handler
        handler.enable()
      }

      const handleCreated = (event: L.LeafletEvent) => {
        const layer = (event as L.DrawEvents.Created).layer
        draftLayer.clearLayers()
        draftLayer.addLayer(layer)
        const geoJson = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>
        onBoundaryDrawnRef.current(geoJson.geometry)
        // Immediately ready for a redraw — no need to click a tool again.
        startDrawing()
      }

      const handleDrawStart = () => onDrawingInProgressChangeRef.current(true)
      const handleDrawStop = () => onDrawingInProgressChangeRef.current(false)

      map.on(L.Draw.Event.CREATED, handleCreated)
      map.on(L.Draw.Event.DRAWSTART, handleDrawStart)
      map.on(L.Draw.Event.DRAWSTOP, handleDrawStop)
      startDrawing()

      return () => {
        map.off(L.Draw.Event.CREATED, handleCreated)
        map.off(L.Draw.Event.DRAWSTART, handleDrawStart)
        map.off(L.Draw.Event.DRAWSTOP, handleDrawStop)
        activeDrawHandlerRef.current?.disable()
        activeDrawHandlerRef.current = null
        draftLayer.clearLayers()
        onDrawingInProgressChangeRef.current(false)
      }
    }, [drawModeActive])

    return (
      <div className="all-plots-map-wrapper">
        <div ref={containerRef} className="all-plots-map" />
        <button
          type="button"
          className="map-style-toggle"
          onClick={() => setMapStyle((style) => (style === 'streets' ? 'satellite' : 'streets'))}
        >
          {mapStyle === 'streets' ? 'Satellite view' : 'Street view'}
        </button>
      </div>
    )
  },
)

AllPlotsMap.displayName = 'AllPlotsMap'

export default AllPlotsMap
