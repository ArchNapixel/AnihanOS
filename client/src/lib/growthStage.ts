import { toDateStr } from './dateUtils'

export type GrowthStage = {
  name: string
  offset_days: number
}

export function totalDurationDays(stages: GrowthStage[]): number {
  if (stages.length === 0) return 0
  return stages[stages.length - 1].offset_days
}

export function computeExpectedHarvestDate(plantingDate: string, stages: GrowthStage[]): string | null {
  if (!plantingDate || stages.length === 0) return null
  const date = new Date(plantingDate)
  date.setDate(date.getDate() + totalDurationDays(stages))
  return toDateStr(date)
}

export function getCurrentStage(
  plantingDate: string,
  stages: GrowthStage[],
): { stage: GrowthStage | null; dayNumber: number; readyForHarvest: boolean } {
  const elapsedDays = Math.floor((Date.now() - new Date(plantingDate).getTime()) / 86_400_000)

  if (stages.length === 0) {
    return { stage: null, dayNumber: elapsedDays, readyForHarvest: false }
  }

  const totalDays = totalDurationDays(stages)
  if (elapsedDays >= totalDays) {
    return { stage: stages[stages.length - 1], dayNumber: elapsedDays, readyForHarvest: true }
  }

  let current = stages[0]
  for (const stage of stages) {
    if (elapsedDays >= stage.offset_days) {
      current = stage
    }
  }

  return { stage: current, dayNumber: elapsedDays, readyForHarvest: false }
}

export function getProgressPercentage(plantingDate: string, expectedHarvestDate: string | null): number | null {
  if (!expectedHarvestDate) return null
  const totalDays = Math.floor(
    (new Date(expectedHarvestDate).getTime() - new Date(plantingDate).getTime()) / 86_400_000,
  )
  if (totalDays <= 0) return null
  const elapsedDays = Math.floor((Date.now() - new Date(plantingDate).getTime()) / 86_400_000)
  return Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)))
}

export type CropProgressInfo = {
  cropName: string
  stageName: string | null
  percentage: number | null
  plantingDate: string
  expectedHarvestDate: string | null
}
