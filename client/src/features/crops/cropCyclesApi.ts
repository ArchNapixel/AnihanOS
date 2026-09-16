import { supabase } from '../../lib/supabaseClient'
import type { CropType } from './cropTypesApi'

export type CropCycleStatus = 'planted' | 'growing' | 'harvested'

export type CropCycle = {
  id: string
  plot_id: string
  crop_type_id: string
  planting_date: string
  expected_harvest_date: string | null
  actual_harvest_date: string | null
  yield_amount: number | null
  yield_unit: string | null
  status: CropCycleStatus
  created_at: string
  updated_at: string
  crop_types: CropType
  plots: { name: string }
}

export type CropCycleInput = {
  plot_id: string
  crop_type_id: string
  planting_date: string
  expected_harvest_date: string | null
}

export type HarvestInput = {
  actual_harvest_date: string
  yield_amount: number
  yield_unit: string
}

const SELECT_WITH_RELATIONS = '*, crop_types(*), plots(name)'

export async function listCropCycles(): Promise<CropCycle[]> {
  const { data, error } = await supabase
    .from('crop_cycles')
    .select(SELECT_WITH_RELATIONS)
    .order('planting_date', { ascending: false })

  if (error) throw error
  return data as unknown as CropCycle[]
}

export async function createCropCycle(input: CropCycleInput): Promise<CropCycle> {
  const { data, error } = await supabase
    .from('crop_cycles')
    .insert({ ...input, status: 'planted' })
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as CropCycle
}

export async function markCropCycleHarvested(id: string, input: HarvestInput): Promise<CropCycle> {
  const { data, error } = await supabase
    .from('crop_cycles')
    .update({ ...input, status: 'harvested' })
    .eq('id', id)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as CropCycle
}
