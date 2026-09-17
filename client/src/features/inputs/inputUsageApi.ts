import { supabase } from '../../lib/supabaseClient'
import type { InputStock } from './inputStockApi'

export type InputUsageLog = {
  id: string
  input_stock_id: string
  plot_id: string
  crop_cycle_id: string | null
  quantity_used: number
  date_used: string
  cost: number | null
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
