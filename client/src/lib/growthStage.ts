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
  return date.toISOString().slice(0, 10)
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
