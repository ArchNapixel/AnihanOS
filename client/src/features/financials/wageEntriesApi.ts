import { supabase } from '../../lib/supabaseClient'
import { getOrCreateDefaultFarm } from '../../lib/farmApi'

export type WageEntry = {
  id: string
  farm_id: string
  plot_id: string | null
  job_done: string
  work_date: string
  hours: number | null
  amount: number
  notes: string | null
  created_at: string
  updated_at: string
  plots: { name: string } | null
}

export type WageEntryInput = {
  plot_id: string | null
  job_done: string
  work_date: string
  hours: number | null
  amount: number
  notes: string | null
}

const SELECT_WITH_RELATIONS = '*, plots(name)'

export async function listWageEntries(): Promise<WageEntry[]> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('wage_entries')
    .select(SELECT_WITH_RELATIONS)
    .eq('farm_id', farmId)
    .order('work_date', { ascending: false })

  if (error) throw error
  return data as unknown as WageEntry[]
}

export async function createWageEntry(input: WageEntryInput): Promise<WageEntry> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('wage_entries')
    .insert({ farm_id: farmId, ...input })
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as WageEntry
}

export async function updateWageEntry(id: string, input: WageEntryInput): Promise<WageEntry> {
  const { data, error } = await supabase
    .from('wage_entries')
    .update(input)
    .eq('id', id)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as WageEntry
}

export async function deleteWageEntry(id: string): Promise<void> {
  const { error } = await supabase.from('wage_entries').delete().eq('id', id)
  if (error) throw error
}
