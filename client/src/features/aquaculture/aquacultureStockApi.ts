import { supabase } from '../../lib/supabaseClient'

export type ProductionSystem = 'pond' | 'cage' | 'pen' | 'tank_ras'

export type AquacultureStock = {
  id: string
  plot_id: string
  species: string
  production_system: ProductionSystem
  stocking_date: string
  quantity_stocked: number
  stocking_unit: string
  notes: string | null
  created_at: string
  updated_at: string
  plots: { name: string }
}

export type AquacultureStockInput = {
  plot_id: string
  species: string
  production_system: ProductionSystem
  stocking_date: string
  quantity_stocked: number
  stocking_unit: string
  notes: string | null
}

const SELECT_WITH_RELATIONS = '*, plots(name)'

export async function listAquacultureStock(): Promise<AquacultureStock[]> {
  const { data, error } = await supabase
    .from('aquaculture_stock')
    .select(SELECT_WITH_RELATIONS)
    .order('stocking_date', { ascending: false })

  if (error) throw error
  return data as unknown as AquacultureStock[]
}

export async function createAquacultureStock(input: AquacultureStockInput): Promise<AquacultureStock> {
  const { data, error } = await supabase
    .from('aquaculture_stock')
    .insert(input)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as AquacultureStock
}

export async function updateAquacultureStock(id: string, input: AquacultureStockInput): Promise<AquacultureStock> {
  const { data, error } = await supabase
    .from('aquaculture_stock')
    .update(input)
    .eq('id', id)
    .select(SELECT_WITH_RELATIONS)
    .single()

  if (error) throw error
  return data as unknown as AquacultureStock
}

export async function deleteAquacultureStock(id: string): Promise<void> {
  const { error } = await supabase.from('aquaculture_stock').delete().eq('id', id)
  if (error) throw error
}
