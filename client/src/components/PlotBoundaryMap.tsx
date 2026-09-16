import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import './PlotBoundaryMap.css'

// Vite doesn't resolve Leaflet's default marker asset paths automatically.
L.Marker.prototype.options.icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow })

const PHILIPPINES_CENTER: L.LatLngTuple = [12.8797, 121.774]
const DEFAULT_ZOOM = 6

type PlotBoundaryMapProps = {
  value: GeoJSON.Polygon | null
  onChange?: (polygon: GeoJSON.Polygon | null) => void
  readOnly?: boolean
}

function PlotBoundaryMap({ value, onChange, readOnly = false }: PlotBoundaryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // React StrictMode double-invokes effects in dev mode; guard against a
    // leftover Leaflet instance from the first invocation still owning this node.
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
      return
    }

    const map = L.map(container).setView(PHILIPPINES_CENTER, DEFAULT_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)

    if (value) {
      L.geoJSON(value).eachLayer((layer) => drawnItems.addLayer(layer))
      map.fitBounds(drawnItems.getBounds(), { maxZoom: 17, padding: [16, 16] })
    }

    if (readOnly) {
      map.dragging.disable()
      map.scrollWheelZoom.disable()
      map.doubleClickZoom.disable()
      map.boxZoom.disable()
      map.keyboard.disable()
      map.touchZoom.disable()
      const tapHandler = (map as unknown as { tap?: L.Handler }).tap
      tapHandler?.disable()
    } else {
      const drawControl = new L.Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: { color: '#55643c' },
          },
          marker: false,
          circle: false,
          circlemarker: false,
          rectangle: false,
          polyline: false,
        },
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
      })
      map.addControl(drawControl)

      map.on(L.Draw.Event.CREATED, (event) => {
        const layer = (event as L.DrawEvents.Created).layer
        drawnItems.clearLayers()
        drawnItems.addLayer(layer)
        const geoJson = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>
        onChange?.(geoJson.geometry)
      })

      map.on(L.Draw.Event.EDITED, (event) => {
        const layers = (event as L.DrawEvents.Edited).layers
        layers.eachLayer((layer) => {
          const geoJson = (layer as L.Polygon).toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>
          onChange?.(geoJson.geometry)
        })
      })

      map.on(L.Draw.Event.DELETED, () => {
        onChange?.(null)
      })
    }

    return () => {
      map.remove()
    }
    // Boundary map only reflects the value it was mounted with — draw edits report back via onChange instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="plot-boundary-map" />
}

export default PlotBoundaryMap
