import { supabase } from '../../lib/supabaseClient'
import type { InputStock, InputType } from './inputStockApi'

export type InputUsageLog = {
  id: string
  input_stock_id: string
  plot_id: string
  crop_cycle_id: string | null
  quantity_used: number
  date_used: string
  cost: number | null
  fertilizing_stage: string | null
  created_at: string
  plots: { name: string }
  crop_cycles: { crop_types: { name: string } } | null
}

export type InputUsageInput = {
  input_stock_id: string
  plot_id: string
  crop_cycle_id: string | null
  quantity_used: number
  date_used: string
  cost: number | null
  fertilizing_stage: string | null
}

export async function logInputUsage(input: InputUsageInput, stock: InputStock): Promise<void> {
  if (input.quantity_used > stock.current_quantity) {
    throw new Error(`Not enough stock: only ${stock.current_quantity} ${stock.unit} left`)
  }

  const { error: logError } = await supabase.from('input_usage_logs').insert(input)
  if (logError) throw logError

  const { error: stockError } = await supabase
    .from('input_stock')
    .update({ current_quantity: stock.current_quantity - input.quantity_used })
    .eq('id', stock.id)

  if (stockError) throw stockError
}

export async function listUsageForStock(stockId: string): Promise<InputUsageLog[]> {
  const { data, error } = await supabase
    .from('input_usage_logs')
    .select('*, plots(name), crop_cycles(crop_types(name))')
    .eq('input_stock_id', stockId)
    .order('date_used', { ascending: false })

  if (error) throw error
  return data as unknown as InputUsageLog[]
}

export type PlotInputUsageLog = {
  id: string
  input_stock_id: string
  crop_cycle_id: string | null
  quantity_used: number
  date_used: string
  cost: number | null
  fertilizing_stage: string | null
  input_stock: { name: string; type: InputType; unit: string }
  crop_cycles: { planting_date: string; crop_types: { name: string } } | null
}

export type CycleFertilizerApplication = {
  quantity_used: number
  date_used: string
  input_stock: {
    type: InputType
    nitrogen_pct: number | null
    phosphorus_pct: number | null
    potassium_pct: number | null
    kg_per_unit: number | null
  }
}

// Only fertilizer-type applications, with the product's nutrient composition
// joined in — feeds the sugarcane fertilizer forecast's real kg N/P/K
// calculation. Filtered client-side since the join can't be limited to one
// input_stock.type value in a single Supabase select.
export async function listFertilizerUsageForCycle(cropCycleId: string): Promise<CycleFertilizerApplication[]> {
  const { data, error } = await supabase
    .from('input_usage_logs')
    .select('quantity_used, date_used, input_stock(type, nitrogen_pct, phosphorus_pct, potassium_pct, kg_per_unit)')
    .eq('crop_cycle_id', cropCycleId)

  if (error) throw error
  return (data as unknown as CycleFertilizerApplication[]).filter((row) => row.input_stock?.type === 'fertilizer')
}

export async function listUsageForPlot(plotId: string): Promise<PlotInputUsageLog[]> {
  const { data, error } = await supabase
    .from('input_usage_logs')
    .select(
      'id, input_stock_id, crop_cycle_id, quantity_used, date_used, cost, fertilizing_stage, input_stock(name, type, unit), crop_cycles(planting_date, crop_types(name))',
    )
    .eq('plot_id', plotId)
    .order('date_used', { ascending: true })

  if (error) throw error
  return data as unknown as PlotInputUsageLog[]
}
