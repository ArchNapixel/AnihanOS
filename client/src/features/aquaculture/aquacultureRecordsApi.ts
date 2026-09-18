import { supabase } from '../../lib/supabaseClient'

export type AquaRecordType = 'feed' | 'water_quality' | 'harvest'

export type FeedDetails = { amount: number; unit: string }
export type WaterQualityDetails = {
  temperature_c?: number
  ph?: number
  dissolved_oxygen_mgl?: number
  salinity_ppt?: number
}
export type HarvestDetails = { quantity: number; unit: string }
export type AquaRecordDetails = FeedDetails | WaterQualityDetails | HarvestDetails

export type AquacultureRecord = {
  id: string
  aquaculture_stock_id: string
  record_type: AquaRecordType
  date: string
  details: AquaRecordDetails
  notes: string | null
  created_at: string
}

export type AquacultureRecordInput = {
  aquaculture_stock_id: string
  record_type: AquaRecordType
  date: string
  details: AquaRecordDetails
  notes: string | null
}

export async function listRecordsForStock(stockId: string): Promise<AquacultureRecord[]> {
  const { data, error } = await supabase
    .from('aquaculture_records')
    .select('*')
    .eq('aquaculture_stock_id', stockId)
    .order('date', { ascending: false })

  if (error) throw error
  return data as AquacultureRecord[]
}

export async function createAquacultureRecord(input: AquacultureRecordInput): Promise<AquacultureRecord> {
  const { data, error } = await supabase.from('aquaculture_records').insert(input).select('*').single()
  if (error) throw error
  return data as AquacultureRecord
}
