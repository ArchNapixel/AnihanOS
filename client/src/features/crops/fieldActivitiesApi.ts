import { supabase } from '../../lib/supabaseClient'

export type ActivityType = 'weeding' | 'plowing' | 'cultivation'

export type FieldActivity = {
  id: string
  plot_id: string
  crop_cycle_id: string | null
  activity_type: ActivityType
  date: string
  created_at: string
}

export type FieldActivityInput = {
  plot_id: string
  crop_cycle_id: string | null
  activity_type: ActivityType
  date: string
}

export async function createFieldActivity(input: FieldActivityInput): Promise<FieldActivity> {
  const { data, error } = await supabase.from('field_activities').insert(input).select('*').single()
  if (error) throw error
  return data as FieldActivity
}

export async function listActivitiesForPlot(plotId: string): Promise<FieldActivity[]> {
  const { data, error } = await supabase
    .from('field_activities')
    .select('*')
    .eq('plot_id', plotId)
    .order('date', { ascending: false })

  if (error) throw error
  return data as FieldActivity[]
}

export async function listActivitiesForFarm(plotIds: string[]): Promise<FieldActivity[]> {
  if (plotIds.length === 0) return []

  const { data, error } = await supabase
    .from('field_activities')
    .select('*')
    .in('plot_id', plotIds)
    .order('date', { ascending: false })

  if (error) throw error
  return data as FieldActivity[]
}
