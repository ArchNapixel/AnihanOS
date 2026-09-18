import { supabase } from '../../lib/supabaseClient'
import { getOrCreateDefaultFarm } from '../../lib/farmApi'

export type PlotType = 'land' | 'water'

export type Plot = {
  id: string
  farm_id: string
  name: string
  type: PlotType
  size: number
  size_unit: string
  soil_type: string | null
  municipality: string | null
  latitude: number | null
  longitude: number | null
  boundary: GeoJSON.Polygon | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type PlotInput = {
  name: string
  type: PlotType
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
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as Plot[]
}

export async function createPlot(input: PlotInput): Promise<Plot> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data: lastPlot, error: lastPlotError } = await supabase
    .from('plots')
    .select('sort_order')
    .eq('farm_id', farmId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastPlotError) throw lastPlotError
  const nextSortOrder = (lastPlot?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('plots')
    .insert({ farm_id: farmId, ...input, sort_order: nextSortOrder })
    .select('*')
    .single()

  if (error) throw error
  return data as Plot
}

export async function reorderPlots(farmId: string, orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from('plots').update({ sort_order: index }).eq('id', id).eq('farm_id', farmId)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
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
