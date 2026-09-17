import { supabase } from '../../lib/supabaseClient'
import { getOrCreateDefaultFarm } from '../../lib/farmApi'

export type Plot = {
  id: string
  farm_id: string
  name: string
  size: number
  size_unit: string
  soil_type: string | null
  municipality: string | null
  latitude: number | null
  longitude: number | null
  boundary: GeoJSON.Polygon | null
  created_at: string
  updated_at: string
}

export type PlotInput = {
  name: string
  size: number
  size_unit: string
  soil_type: string | null
  municipality: string | null
  latitude: number | null
  longitude: number | null
  boundary: GeoJSON.Polygon | null
}

export async function listPlots(): Promise<Plot[]> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('plots')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Plot[]
}

export async function createPlot(input: PlotInput): Promise<Plot> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('plots')
    .insert({ farm_id: farmId, ...input })
    .select('*')
    .single()

  if (error) throw error
  return data as Plot
}

export async function updatePlot(id: string, input: PlotInput): Promise<Plot> {
  const { data, error } = await supabase
    .from('plots')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Plot
}

export async function deletePlot(id: string): Promise<void> {
  const { error } = await supabase.from('plots').delete().eq('id', id)
  if (error) throw error
}
