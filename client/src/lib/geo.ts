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
