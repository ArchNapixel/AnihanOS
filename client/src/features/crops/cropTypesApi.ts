import { supabase } from '../../lib/supabaseClient'
import { getOrCreateDefaultFarm } from '../../lib/farmApi'
import type { GrowthStage } from '../../lib/growthStage'

export type CropType = {
  id: string
  farm_id: string
  name: string
  growth_stages: GrowthStage[]
  // Days after planting when this crop's canopy closes and starts
  // shading out weeds on its own. Null means we don't know yet, in which
  // case the weed-risk heuristic can't make a confident call.
  canopy_closure_days: number | null
  created_at: string
  updated_at: string
}

export type CropTypeInput = {
  name: string
  growth_stages: GrowthStage[]
  canopy_closure_days: number | null
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
