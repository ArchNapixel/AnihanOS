import { supabase } from '../../lib/supabaseClient'

export type PerennialPlantingStatus = 'planted' | 'maturing' | 'productive' | 'declining'

export type PerennialPlanting = {
  id: string
  plot_id: string
  crop_type: string
  planting_date: string
  status: PerennialPlantingStatus
  expected_first_harvest_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  plots: { name: string }
}

export type PerennialPlantingInput = {
  plot_id: string
  crop_type: string
  planting_date: string
  status: PerennialPlantingStatus
  expected_first_harvest_date: string | null
  notes: string | null
}

const SELECT_WITH_RELATIONS = '*, plots(name)'

export async function listPerennialPlantings(): Promise<PerennialPlanting[]> {
  const { data, error } = await supabase
    .from('perennial_plantings')
    .select(SELECT_WITH_RELATIONS)
    .order('planting_date', { ascending: false })

  if (error) throw error
  return data as unknown as PerennialPlanting[]
}

export async function createPerennialPlanting(input: PerennialPlantingInput): Promise<PerennialPlanting> {
  const { data, error } = await supabase
    .from('perennial_plantings')
    .insert(input)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as PerennialPlanting
}

export async function updatePerennialPlanting(
  id: string,
  input: PerennialPlantingInput,
): Promise<PerennialPlanting> {
  const { data, error } = await supabase
    .from('perennial_plantings')
    .update(input)
    .eq('id', id)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as PerennialPlanting
}

export async function deletePerennialPlanting(id: string): Promise<void> {
  const { error } = await supabase.from('perennial_plantings').delete().eq('id', id)
  if (error) throw error
}
