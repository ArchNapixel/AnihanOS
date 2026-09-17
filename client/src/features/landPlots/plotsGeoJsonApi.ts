import { supabase } from '../../lib/supabaseClient'

export type PlotFeatureProperties = {
  id: string
  name: string
  municipality: string | null
  area_sqm: number
  crop_type: string | null
}

export type PlotFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon, PlotFeatureProperties>

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export async function fetchFarmPlotsGeoJson(farmId: string): Promise<PlotFeatureCollection> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/plots/geojson`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed with status ${response.status}`)
  }

  return response.json()
}
