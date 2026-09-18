import { supabase } from '../../lib/supabaseClient'

export type HarvestRecord = {
  id: string
  perennial_planting_id: string
  harvest_date: string
  quantity_harvested: number
  harvest_unit: string
  notes: string | null
  created_at: string
}

export type HarvestRecordInput = {
  perennial_planting_id: string
  harvest_date: string
  quantity_harvested: number
  harvest_unit: string
  notes: string | null
}

export async function listHarvestRecordsForPlanting(plantingId: string): Promise<HarvestRecord[]> {
  const { data, error } = await supabase
    .from('harvest_records')
    .select('*')
    .eq('perennial_planting_id', plantingId)
    .order('harvest_date', { ascending: false })

  if (error) throw error
  return data as HarvestRecord[]
}

export async function createHarvestRecord(input: HarvestRecordInput): Promise<HarvestRecord> {
  const { data, error } = await supabase.from('harvest_records').insert(input).select('*').single()
  if (error) throw error
  return data as HarvestRecord
}
