import type { FertilizingStage } from '../features/crops/cropTypesApi'

export type FertilizingStageRow = {
  name: string
  isRange: boolean
  startDays: string
  endDays: string
  nutrients: string
  purpose: string
}

export function emptyFertilizingRow(): FertilizingStageRow {
  return { name: '', isRange: true, startDays: '', endDays: '', nutrients: '', purpose: '' }
}

export function fertilizingStagesToRows(stages: FertilizingStage[]): FertilizingStageRow[] {
  if (stages.length === 0) return [emptyFertilizingRow()]
  return stages.map((stage) => ({
    name: stage.name,
    isRange: stage.offset_days_end != null,
    startDays: String(stage.offset_days_start),
    endDays: stage.offset_days_end != null ? String(stage.offset_days_end) : '',
    nutrients: stage.nutrients,
    purpose: stage.purpose,
  }))
}

export function parseFertilizingStages(rows: FertilizingStageRow[]): FertilizingStage[] {
  return rows
    .filter((row) => row.name.trim() && row.startDays.trim() !== '')
    .map((row) => ({
      name: row.name.trim(),
      offset_days_start: Math.round(Number(row.startDays)),
      offset_days_end: row.isRange && row.endDays.trim() !== '' ? Math.round(Number(row.endDays)) : null,
      nutrients: row.nutrients.trim(),
      purpose: row.purpose.trim(),
    }))
    .sort((a, b) => a.offset_days_start - b.offset_days_start)
}
