const EARTH_RADIUS_METERS = 6378137.0 // WGS84 equatorial radius

// Geodesic area of a polygon on the Earth's surface, in square meters.
// Standard spherical-excess algorithm (as used by Leaflet.GeometryUtil and
// most web-mapping area tools) — accurate to a fraction of a percent at
// farm-plot scale, which a flat shoelace formula on raw lat/lng isn't,
// since a degree of longitude covers less real distance further from the
// equator.
export function polygonAreaSqMeters(polygon: GeoJSON.Polygon): number {
  const ring = polygon.coordinates[0]
  const isClosed =
    ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
  const points = isClosed ? ring.slice(0, -1) : ring
  const pointCount = points.length
  if (pointCount < 3) return 0

  const toRad = Math.PI / 180
  let area = 0
  for (let i = 0; i < pointCount; i++) {
    const [lng1, lat1] = points[i]
    const [lng2, lat2] = points[(i + 1) % pointCount]
    area += (lng2 - lng1) * toRad * (2 + Math.sin(lat1 * toRad) + Math.sin(lat2 * toRad))
  }

  return Math.abs((area * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2)
}

export function polygonAreaHectares(polygon: GeoJSON.Polygon): number {
  return polygonAreaSqMeters(polygon) / 10_000
}

export function polygonCentroid(polygon: GeoJSON.Polygon): { latitude: number; longitude: number } {
  const ring = polygon.coordinates[0]
  const isClosed =
    ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
  const pointCount = isClosed ? ring.length - 1 : ring.length

  let sumLng = 0
  let sumLat = 0
  for (let i = 0; i < pointCount; i++) {
    sumLng += ring[i][0]
    sumLat += ring[i][1]
  }

  return {
    latitude: sumLat / pointCount,
    longitude: sumLng / pointCount,
  }
}
