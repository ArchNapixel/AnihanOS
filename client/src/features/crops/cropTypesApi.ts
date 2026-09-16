import { supabase } from '../../lib/supabaseClient'
import { getOrCreateDefaultFarm } from '../../lib/farmApi'
import type { GrowthStage } from '../../lib/growthStage'

export type CropType = {
  id: string
  farm_id: string
  name: string
  growth_stages: GrowthStage[]
  created_at: string
  updated_at: string
}

export type CropTypeInput = {
  name: string
  growth_stages: GrowthStage[]
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
