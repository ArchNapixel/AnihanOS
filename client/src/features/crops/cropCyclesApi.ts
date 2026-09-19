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
  selling_price_per_unit: number | null
  other_costs: number | null
  // 0 = plant cane, 1 = 1st ratoon, 2 = 2nd ratoon, etc. Ratoon crops need
  // less fertilizer and yield less than a fresh planting — used by the
  // sugarcane fertilizer forecast's ratoon decline adjustment.
  ratoon_number: number
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
  ratoon_number: number
}

export type HarvestInput = {
  actual_harvest_date: string
  yield_amount: number
  yield_unit: string
}

export type SaleInput = {
  selling_price_per_unit: number
  other_costs: number
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

export async function updateCropCycle(id: string, input: CropCycleInput): Promise<CropCycle> {
  const { data, error } = await supabase
    .from('crop_cycles')
    .update(input)
    .eq('id', id)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as CropCycle
}

export async function deleteCropCycle(id: string): Promise<void> {
  const { error } = await supabase.from('crop_cycles').delete().eq('id', id)
  if (error) throw error
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

export async function recordCropCycleSale(id: string, input: SaleInput): Promise<CropCycle> {
  const { data, error } = await supabase
    .from('crop_cycles')
    .update(input)
    .eq('id', id)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as CropCycle
}
