import { supabase } from '../../lib/supabaseClient'
import { listCropCycles, type CropCycle } from '../crops/cropCyclesApi'

export type CropCycleFinancials = {
  cycle: CropCycle
  inputCost: number
  revenue: number | null
  profit: number | null
  marginPercent: number | null
}

export async function listCropCycleFinancials(): Promise<CropCycleFinancials[]> {
  const cycles = await listCropCycles()

  const { data: usageLogs, error } = await supabase
    .from('input_usage_logs')
    .select('crop_cycle_id, cost')
    .not('crop_cycle_id', 'is', null)

  if (error) throw error

  const costByCycleId: Record<string, number> = {}
  for (const log of usageLogs as { crop_cycle_id: string; cost: number | null }[]) {
    costByCycleId[log.crop_cycle_id] = (costByCycleId[log.crop_cycle_id] ?? 0) + (log.cost ?? 0)
  }

  return cycles.map((cycle) => {
    const inputCost = costByCycleId[cycle.id] ?? 0
    const revenue =
      cycle.yield_amount != null && cycle.selling_price_per_unit != null
        ? cycle.yield_amount * cycle.selling_price_per_unit
        : null
    const profit = revenue != null ? revenue - inputCost - (cycle.other_costs ?? 0) : null
    const marginPercent = profit != null && revenue != null && revenue > 0 ? (profit / revenue) * 100 : null

    return { cycle, inputCost, revenue, profit, marginPercent }
  })
}

export const CSV_HEADERS = [
  'Plot',
  'Crop',
  'Planted',
  'Harvested',
  'Yield',
  'Yield Unit',
  'Selling Price/Ton',
  'Revenue',
  'Input Cost',
  'Other Costs',
  'Profit',
  'Margin %',
]

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function buildFinancialsCsvRows(rows: CropCycleFinancials[]): string[][] {
  return rows.map((row) => {
    const { cycle } = row
    return [
      cycle.plots.name,
      cycle.crop_types.name,
      cycle.planting_date,
      cycle.actual_harvest_date ?? '',
      cycle.yield_amount != null ? String(cycle.yield_amount) : '',
      cycle.yield_unit ?? '',
      cycle.selling_price_per_unit != null ? String(cycle.selling_price_per_unit) : '',
      row.revenue != null ? String(row.revenue) : '',
      String(row.inputCost),
      cycle.other_costs != null ? String(cycle.other_costs) : '',
      row.profit != null ? String(row.profit) : '',
      row.marginPercent != null ? row.marginPercent.toFixed(1) : '',
    ]
  })
}

export function buildFinancialsCsvText(rows: CropCycleFinancials[]): string {
  const lines = [CSV_HEADERS.join(',')]
  for (const cells of buildFinancialsCsvRows(rows)) {
    lines.push(cells.map(csvEscape).join(','))
  }
  return lines.join('\n')
}

export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
