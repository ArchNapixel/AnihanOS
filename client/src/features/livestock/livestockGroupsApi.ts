import { supabase } from '../../lib/supabaseClient'
import { getOrCreateDefaultFarm } from '../../api/farmApi'

export type LivestockGroup = {
  id: string
  farm_id: string
  animal_type: string
  count: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type LivestockGroupInput = {
  animal_type: string
  count: number
  notes: string | null
}

export async function listLivestockGroups(): Promise<LivestockGroup[]> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('livestock_groups')
    .select('*')
    .eq('farm_id', farmId)
    .order('animal_type', { ascending: true })

  if (error) throw error
  return data as LivestockGroup[]
}

export async function createLivestockGroup(input: LivestockGroupInput): Promise<LivestockGroup> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('livestock_groups')
    .insert({ farm_id: farmId, ...input })
    .select('*')
    .single()

  if (error) throw error
  return data as LivestockGroup
}

export async function updateLivestockGroup(id: string, input: LivestockGroupInput): Promise<LivestockGroup> {
  const { data, error } = await supabase
    .from('livestock_groups')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as LivestockGroup
}

export async function deleteLivestockGroup(id: string): Promise<void> {
  const { error } = await supabase.from('livestock_groups').delete().eq('id', id)
  if (error) throw error
}
