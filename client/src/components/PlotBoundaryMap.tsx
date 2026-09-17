import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import './PlotBoundaryMap.css'

// Vite doesn't resolve Leaflet's default marker asset paths automatically.
L.Marker.prototype.options.icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow })

const PHILIPPINES_CENTER: L.LatLngTuple = [12.8797, 121.774]
const DEFAULT_ZOOM = 6

type PlotBoundaryMapProps = {
  value: GeoJSON.Polygon
}

// Read-only display of a single plot's boundary — used for the plot detail
// view. Drawing/editing boundaries happens directly on the main map instead.
function PlotBoundaryMap({ value }: PlotBoundaryMapProps) {
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

    const layer = L.geoJSON(value)
    layer.addTo(map)
    map.fitBounds(layer.getBounds(), { maxZoom: 17, padding: [16, 16] })

    map.dragging.disable()
    map.scrollWheelZoom.disable()
    map.doubleClickZoom.disable()
    map.boxZoom.disable()
    map.keyboard.disable()
    map.touchZoom.disable()
    const tapHandler = (map as unknown as { tap?: L.Handler }).tap
    tapHandler?.disable()

    return () => {
      map.remove()
    }
    // Always reflects the value it was mounted with — this map is read-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="plot-boundary-map" />
}

export default PlotBoundaryMap
