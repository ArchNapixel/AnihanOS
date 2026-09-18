export type WeedRiskLevel = 'low' | 'medium' | 'high'

// Heuristic, not a forecast: recent weeding keeps risk at Medium during the
// crop's early (pre-canopy) growth; anything longer, or no weeding record
// at all, pushes it to High. Once the crop's own canopy closes, its shade
// suppresses weeds regardless of weeding history, so risk drops to Low.
const RECENT_WEEDING_DAYS = 14

export function computeWeedRisk(
  plantingDate: string,
  canopyClosureDays: number | null,
  lastWeedingDate: string | null,
): WeedRiskLevel | null {
  if (canopyClosureDays == null) return null

  const elapsedDays = Math.floor((Date.now() - new Date(plantingDate).getTime()) / 86_400_000)

  if (elapsedDays >= canopyClosureDays) {
    return 'low'
  }

  if (!lastWeedingDate) {
    return 'high'
  }

  const daysSinceWeeding = Math.floor((Date.now() - new Date(lastWeedingDate).getTime()) / 86_400_000)
  return daysSinceWeeding <= RECENT_WEEDING_DAYS ? 'medium' : 'high'
}
