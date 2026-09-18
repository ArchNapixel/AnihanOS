import { supabase } from '../../lib/supabaseClient'
import { getOrCreateDefaultFarm } from '../../api/farmApi'
import type { GrowthStage } from '../../domain/growthStage'

export type FertilizingStage = {
  name: string
  // Days after planting. offset_days_end null means a single point in time
  // or an open-ended stage (e.g. "90 days to 7+ months").
  offset_days_start: number
  offset_days_end: number | null
  nutrients: string
  purpose: string
}

export type CropType = {
  id: string
  farm_id: string
  name: string
  growth_stages: GrowthStage[]
  // Days after planting when this crop's canopy closes and starts
  // shading out weeds on its own. Null means we don't know yet, in which
  // case the weed-risk heuristic can't make a confident call.
  canopy_closure_days: number | null
  description: string | null
  harvest_estimate_note: string | null
  fertilizing_schedule: FertilizingStage[]
  created_at: string
  updated_at: string
}

export type CropTypeInput = {
  name: string
  growth_stages: GrowthStage[]
  canopy_closure_days: number | null
  description: string | null
  harvest_estimate_note: string | null
  fertilizing_schedule: FertilizingStage[]
}

export async function listCropTypes(): Promise<CropType[]> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('crop_types')
    .select('*')
    .eq('farm_id', farmId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as CropType[]
}

export async function createCropType(input: CropTypeInput): Promise<CropType> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('crop_types')
    .insert({ farm_id: farmId, ...input })
    .select('*')
    .single()

  if (error) throw error
  return data as CropType
}

export async function updateCropType(id: string, input: CropTypeInput): Promise<CropType> {
  const { data, error } = await supabase.from('crop_types').update(input).eq('id', id).select('*').single()

  if (error) throw error
  return data as CropType
}
