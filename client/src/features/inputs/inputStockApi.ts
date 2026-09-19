import { supabase } from '../../lib/supabaseClient'
import { getOrCreateDefaultFarm } from '../../api/farmApi'

export type InputType = 'fertilizer' | 'pesticide' | 'seed'

export type InputStock = {
  id: string
  farm_id: string
  type: InputType
  name: string
  current_quantity: number
  unit: string
  low_stock_threshold: number
  cost_per_unit: number | null
  // Nutrient composition (e.g. "14-14-14" printed on the bag) and a
  // conversion to kg per unit (e.g. unit = "bag", kg_per_unit = 50) — only
  // meaningful for type = 'fertilizer'. Used by the sugarcane fertilizer
  // forecast to convert real usage logs into actual kg of N/P/K applied.
  nitrogen_pct: number | null
  phosphorus_pct: number | null
  potassium_pct: number | null
  kg_per_unit: number | null
  created_at: string
  updated_at: string
}

export type InputStockInput = {
  type: InputType
  name: string
  current_quantity: number
  unit: string
  low_stock_threshold: number
  cost_per_unit: number | null
  nitrogen_pct: number | null
  phosphorus_pct: number | null
  potassium_pct: number | null
  kg_per_unit: number | null
}

export async function listInputStock(): Promise<InputStock[]> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('input_stock')
    .select('*')
    .eq('farm_id', farmId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as InputStock[]
}

export async function createInputStock(input: InputStockInput): Promise<InputStock> {
  const { id: farmId } = await getOrCreateDefaultFarm()

  const { data, error } = await supabase
    .from('input_stock')
    .insert({ farm_id: farmId, ...input })
    .select('*')
    .single()

  if (error) throw error
  return data as InputStock
}

export async function updateInputStock(id: string, input: InputStockInput): Promise<InputStock> {
  const { data, error } = await supabase
    .from('input_stock')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as InputStock
}

export async function deleteInputStock(id: string): Promise<void> {
  const { error } = await supabase.from('input_stock').delete().eq('id', id)
  if (error) throw error
}

export async function addStockQuantity(stock: InputStock, quantityToAdd: number): Promise<InputStock> {
  const { data, error } = await supabase
    .from('input_stock')
    .update({ current_quantity: stock.current_quantity + quantityToAdd })
    .eq('id', stock.id)
    .select('*')
    .single()

  if (error) throw error
  return data as InputStock
}
