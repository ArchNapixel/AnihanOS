import { supabase } from '../../lib/supabaseClient'

export type RecordType = 'feed' | 'health' | 'production'

export type FeedDetails = { amount: number; unit: string }
export type HealthDetails = { description: string }
export type ProductionDetails = { output_type: string; quantity: number; unit: string }
export type RecordDetails = FeedDetails | HealthDetails | ProductionDetails

export type LivestockRecord = {
  id: string
  livestock_group_id: string
  record_type: RecordType
  date: string
  details: RecordDetails
  notes: string | null
  created_at: string
}

export type LivestockRecordInput = {
  livestock_group_id: string
  record_type: RecordType
  date: string
  details: RecordDetails
  notes: string | null
}

export async function listRecordsForGroup(groupId: string): Promise<LivestockRecord[]> {
  const { data, error } = await supabase
    .from('livestock_records')
    .select('*')
    .eq('livestock_group_id', groupId)
    .order('date', { ascending: false })

  if (error) throw error
  return data as LivestockRecord[]
}

export async function createLivestockRecord(input: LivestockRecordInput): Promise<LivestockRecord> {
  const { data, error } = await supabase.from('livestock_records').insert(input).select('*').single()

  if (error) throw error
  return data as LivestockRecord
}

export async function listRecentRecordsForFarm(groupIds: string[]): Promise<LivestockRecord[]> {
  if (groupIds.length === 0) return []

  const { data, error } = await supabase
    .from('livestock_records')
    .select('*')
    .in('livestock_group_id', groupIds)
    .order('date', { ascending: false })
    .limit(20)

  if (error) throw error
  return data as LivestockRecord[]
}
