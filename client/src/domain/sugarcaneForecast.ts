import type { WeatherDaily } from '../api/weatherApi'

// Derived from the "Sugarcane Weather Impact & Yield Forecasting Guide"
// (Philippines context) provided by the user. Stage boundaries use the
// midpoint of each stage's stated duration range, measured in days from
// planting. Ripening is treated as open-ended (runs until actual harvest)
// since the guide's per-stage durations don't cleanly sum to its separately
// stated 12-18 month total cycle length.
export type SugarcaneStage = 'germination' | 'tillering' | 'grand_growth' | 'ripening'

const STAGE_BOUNDARIES: { stage: SugarcaneStage; startDay: number }[] = [
  { stage: 'germination', startDay: 0 },
  { stage: 'tillering', startDay: 15 }, // midpoint of 10-20 day germination
  { stage: 'grand_growth', startDay: 60 }, // 15 + midpoint of 30-60 day tillering (45)
  { stage: 'ripening', startDay: 180 }, // 60 + midpoint of 90-150 day grand growth (120)
]

const STAGE_LABELS: Record<SugarcaneStage, string> = {
  germination: 'Germination',
  tillering: 'Tillering',
  grand_growth: 'Grand Growth',
  ripening: 'Ripening',
}

export function getSugarcaneStage(daysSincePlanting: number): SugarcaneStage {
  let current: SugarcaneStage = 'germination'
  for (const boundary of STAGE_BOUNDARIES) {
    if (daysSincePlanting >= boundary.startDay) {
      current = boundary.stage
    }
  }
  return current
}

function daysBetween(from: string, to: string): number {
  return Math.floor((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000)
}

function averageTemp(days: WeatherDaily[]): number | null {
  const temps = days
    .filter((d) => d.temp_min_c != null && d.temp_max_c != null)
    .map((d) => (d.temp_min_c! + d.temp_max_c!) / 2)
  if (temps.length === 0) return null
  return temps.reduce((sum, t) => sum + t, 0) / temps.length
}

function averageDailyRainfall(days: WeatherDaily[]): number | null {
  const values = days.filter((d) => d.precipitation_mm != null).map((d) => d.precipitation_mm!)
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// Temperature Factor — table 5 of the guide. Ripening prefers cooler temps
// (boosts sucrose); other stages use the general growing-season curve.
function temperatureFactor(avgTempC: number, stage: SugarcaneStage): number {
  if (stage === 'ripening') {
    if (avgTempC <= 22) return 1.1
    if (avgTempC <= 24) return 1.0
    if (avgTempC <= 28) return 0.95
    return 0.9
  }
  if (avgTempC < 18) return 0.85
  if (avgTempC <= 26) return 1.0
  if (avgTempC <= 28) return 0.95
  return 0.9
}

// Rainfall Factor — the guide's grand-growth figures (1,200-1,500mm optimal)
// are stated per the ~120-day grand growth window, prorated here to a daily
// rate so they can be compared against whatever days of data are available.
const GRAND_GROWTH_DAYS = 120
function rainfallFactor(avgDailyMm: number): number {
  const dailyOptimalLow = 1200 / GRAND_GROWTH_DAYS
  const dailyOptimalHigh = 1500 / GRAND_GROWTH_DAYS
  const dailyGoodHigh = 2000 / GRAND_GROWTH_DAYS
  const dailyDeficitLow = 1000 / GRAND_GROWTH_DAYS

  if (avgDailyMm >= dailyOptimalLow && avgDailyMm <= dailyOptimalHigh) return 1.0
  if (avgDailyMm > dailyOptimalHigh && avgDailyMm <= dailyGoodHigh) return 0.98
  if (avgDailyMm > dailyGoodHigh) return 0.92
  if (avgDailyMm >= dailyDeficitLow) return 0.8
  return 0.6 // sustained deficit well below the guide's <1,000mm case
}

// --- Fertilizer model ---------------------------------------------------
// Derived from the "Sugarcane Fertilizer System: Research Findings"
// document provided by the user (NPK uptake patterns, N response curve,
// P/K response tiers, split-timing effects, ratoon decline, soil-type
// multipliers). Every input here comes from data AnihanOS actually tracks
// (real fertilizer usage logs, a product's nutrient composition, optional
// soil test results) — nothing here is invented per-cycle.

export type FertilizerApplication = {
  dateUsed: string
  quantityUsed: number
  nitrogenPct: number | null
  phosphorusPct: number | null
  potassiumPct: number | null
  kgPerUnit: number | null
}

export type SoilInputs = {
  soilType: string | null // free text from the plot's existing "soil type" field
  organicMatterPct: number | null
  nPpm: number | null
  pBrayPpm: number | null
  kExchangeablePpm: number | null
}

// Section 8 of the document — soil texture changes how responsive the same
// kg of applied N actually is. Matched by keyword against the plot's
// free-text soil type field, since that field isn't a fixed enum.
function soilTypeResponseMultiplier(soilTypeRaw: string | null): number {
  if (!soilTypeRaw) return 1.0
  const s = soilTypeRaw.toLowerCase()
  if (s.includes('sand')) return 1.15
  if (s.includes('laterite')) return 1.2
  if (s.includes('clay')) return 0.85
  if (s.includes('volcanic') || s.includes('loam')) return 1.0
  return 1.0
}

// Section 8 organic matter effect, expressed as an adjustment to the
// "effective" nitrogen applied before the response curve is evaluated.
function organicMatterAdjustmentKg(organicMatterPct: number | null): number {
  if (organicMatterPct == null) return 0
  if (organicMatterPct < 2) return -20
  if (organicMatterPct > 4) return 17.5
  return 0
}

// Model 1 — quadratic nitrogen response curve (document section 6).
function nitrogenResponse(effectiveNKgHa: number): number {
  const a = 0.35
  const b = 0.0008
  const boostPct = a * effectiveNKgHa - b * effectiveNKgHa * effectiveNKgHa
  // Clamped so a badly out-of-range input (e.g. an implausibly large single
  // application) can't swing the multiplier to an extreme value.
  return Math.max(-0.3, Math.min(0.5, boostPct / 100))
}

// Section 3 — phosphorus response tiers. Falls back to an applied-amount-only
// heuristic (against the document's stated 25-35 kg/ha typical recommendation)
// when no soil test is available.
function phosphorusFactor(pAppliedKgHa: number, soilPBrayPpm: number | null): number {
  if (soilPBrayPpm == null) {
    if (pAppliedKgHa >= 25) return 1.05
    if (pAppliedKgHa >= 15) return 1.0
    return 0.92
  }
  if (soilPBrayPpm < 10) return pAppliedKgHa >= 25 ? 1.08 : 0.95
  if (soilPBrayPpm <= 25) return 1.05
  return 1.02
}

// Section 3 — potassium response tiers, same fallback approach as phosphorus.
function potassiumFactor(kAppliedKgHa: number, soilKExchangeablePpm: number | null): number {
  if (soilKExchangeablePpm == null) {
    if (kAppliedKgHa >= 120) return 1.07
    if (kAppliedKgHa >= 80) return 1.0
    return 0.92
  }
  if (soilKExchangeablePpm < 100) return kAppliedKgHa >= 120 ? 1.1 : 0.92
  if (soilKExchangeablePpm <= 150) return 1.07
  return 1.04
}

// Section 4 — split-application timing. Uses each application's real
// logged date against planting date, mapped onto the same stage boundaries
// the weather engine uses, rather than a separately-invented timeline.
function timingFactor(nApplications: { daysSincePlanting: number; nKg: number }[]): number {
  const totalN = nApplications.reduce((sum, a) => sum + a.nKg, 0)
  if (totalN <= 0) return 1.0

  const lateN = nApplications
    .filter((a) => getSugarcaneStage(a.daysSincePlanting) === 'ripening')
    .reduce((sum, a) => sum + a.nKg, 0)

  if (lateN / totalN > 0.4) return 0.9

  const splitCount = nApplications.filter((a) => a.nKg > 0).length
  if (splitCount >= 3) return 1.03
  if (splitCount >= 2) return 1.0
  return 0.98
}

// Section 5 — ratoon decline. Applied to the nitrogen response specifically,
// since that's the dominant driver of the fertilizer effect and the
// document's ratoon figures are themselves expressed as "% of plant crop
// response". Representative midpoints of each stated range.
function ratoonResponseMultiplier(ratoonNumber: number): number {
  if (ratoonNumber <= 0) return 1.0
  if (ratoonNumber === 1) return 0.925
  if (ratoonNumber === 2) return 0.85
  return 0.775
}

export type FertilizerForecast = {
  nitrogenAppliedKgPerHa: number
  phosphorusAppliedKgPerHa: number
  potassiumAppliedKgPerHa: number
  fertilizerFactor: number
  soilDataProvided: boolean
  applicationCount: number
}

function computeFertilizerFactor(
  applications: FertilizerApplication[],
  plantingDate: string,
  plotHectares: number,
  ratoonNumber: number,
  soil: SoilInputs,
): FertilizerForecast {
  let nKg = 0
  let pKg = 0
  let kKg = 0
  const nApplications: { daysSincePlanting: number; nKg: number }[] = []

  for (const app of applications) {
    const kg = app.quantityUsed * (app.kgPerUnit ?? 1)
    const appNKg = kg * ((app.nitrogenPct ?? 0) / 100)
    nKg += appNKg
    pKg += kg * ((app.phosphorusPct ?? 0) / 100)
    kKg += kg * ((app.potassiumPct ?? 0) / 100)
    nApplications.push({ daysSincePlanting: daysBetween(plantingDate, app.dateUsed), nKg: appNKg })
  }

  const nPerHa = nKg / plotHectares
  const pPerHa = pKg / plotHectares
  const kPerHa = kKg / plotHectares

  const soilMultiplier = soilTypeResponseMultiplier(soil.soilType)
  const effectiveN = Math.max(0, nPerHa + organicMatterAdjustmentKg(soil.organicMatterPct))

  const nResponse = nitrogenResponse(effectiveN) * soilMultiplier * ratoonResponseMultiplier(ratoonNumber)
  const pFactor = phosphorusFactor(pPerHa, soil.pBrayPpm)
  const kFactor = potassiumFactor(kPerHa, soil.kExchangeablePpm)
  const tFactor = timingFactor(nApplications)

  const rawFactor = (1 + nResponse) * pFactor * kFactor * tFactor
  const fertilizerFactor = Math.max(0.5, Math.min(2.0, rawFactor))

  return {
    nitrogenAppliedKgPerHa: nPerHa,
    phosphorusAppliedKgPerHa: pPerHa,
    potassiumAppliedKgPerHa: kPerHa,
    fertilizerFactor,
    soilDataProvided: soil.nPpm != null || soil.pBrayPpm != null || soil.kExchangeablePpm != null,
    applicationCount: applications.length,
  }
}

// --- Weather-only outlook -------------------------------------------------
// Split out from forecastSugarcane() so callers that only need a stage/timing
// read (e.g. the dashboard's weekly summary) aren't forced to also carry the
// fertilizer-specific caveats below, which don't apply outside a per-cycle
// detailed forecast.

export type WeatherOutlook = {
  stage: SugarcaneStage
  stageLabel: string
  daysSincePlanting: number
  weatherDaysUsed: number
  avgTempC: number | null
  avgDailyRainfallMm: number | null
  temperatureFactor: number | null
  rainfallFactor: number | null
  timingOutlook: 'on_track' | 'possible_delay' | 'favorable' | 'insufficient_data'
  riskNotes: string[]
}

export function computeWeatherOutlook(plantingDate: string, weatherDays: WeatherDaily[]): WeatherOutlook {
  const daysSincePlanting = daysBetween(plantingDate, new Date().toISOString().slice(0, 10))
  const stage = getSugarcaneStage(daysSincePlanting)

  const avgTempC = averageTemp(weatherDays)
  const avgDailyRainfallMm = averageDailyRainfall(weatherDays)
  const tempFactor = avgTempC != null ? temperatureFactor(avgTempC, stage) : null
  const rainFactor = avgDailyRainfallMm != null ? rainfallFactor(avgDailyRainfallMm) : null

  const riskNotes: string[] = []
  let timingOutlook: WeatherOutlook['timingOutlook'] = 'insufficient_data'

  if (weatherDays.length === 0) {
    riskNotes.push('No weather data yet.')
  } else {
    timingOutlook = 'on_track'

    if (avgTempC != null && avgTempC < 15 && stage === 'grand_growth') {
      riskNotes.push('Below 15°C in Grand Growth — growth stalled.')
      timingOutlook = 'possible_delay'
    }
    if (avgTempC != null && avgTempC > 32) {
      riskNotes.push('Above 32°C — fiber hardening, lower sucrose.')
    }
    if (stage === 'ripening' && avgTempC != null && avgTempC > 24) {
      riskNotes.push('Ripening temp above 16-22°C ideal — delayed harvest, slower sugar buildup.')
      timingOutlook = 'possible_delay'
    }
    if (stage === 'ripening' && avgTempC != null && avgTempC <= 20) {
      riskNotes.push('Cool ripening nights — sucrose boosted.')
      timingOutlook = 'favorable'
    }
    if (stage === 'grand_growth' && rainFactor != null && rainFactor <= 0.6) {
      riskNotes.push('Rainfall well below Grand Growth needs — yield risk.')
    }
    if (stage === 'ripening' && avgDailyRainfallMm != null && avgDailyRainfallMm * 30 > 100) {
      riskNotes.push('Ripening rainfall may dilute sugar (lower brix).')
    }
  }

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    daysSincePlanting,
    weatherDaysUsed: weatherDays.length,
    avgTempC,
    avgDailyRainfallMm,
    temperatureFactor: tempFactor,
    rainfallFactor: rainFactor,
    timingOutlook,
    riskNotes,
  }
}

// --- Combined forecast ---------------------------------------------------

export type SugarcaneForecast = {
  stage: SugarcaneStage
  stageLabel: string
  daysSincePlanting: number
  weatherDaysUsed: number
  avgTempC: number | null
  avgDailyRainfallMm: number | null
  temperatureFactor: number | null
  rainfallFactor: number | null
  diseaseFactor: number
  fertilizer: FertilizerForecast | null
  baseYieldTonsPerHa: number
  weatherOnlyYieldTonsPerHa: number | null
  estimatedYieldTonsPerHa: number | null
  fertilizerContributionPct: number | null
  timingOutlook: 'on_track' | 'possible_delay' | 'favorable' | 'insufficient_data'
  riskNotes: string[]
}

export function forecastSugarcane(params: {
  plantingDate: string
  weatherDays: WeatherDaily[]
  baseYieldTonsPerHa?: number
  ratoonNumber: number
  plotHectares: number | null
  fertilizerApplications: FertilizerApplication[]
  soil: SoilInputs
}): SugarcaneForecast {
  const { plantingDate, weatherDays, baseYieldTonsPerHa = 75, ratoonNumber, plotHectares, fertilizerApplications, soil } = params

  const outlook = computeWeatherOutlook(plantingDate, weatherDays)
  const { stage, avgTempC, avgDailyRainfallMm, daysSincePlanting } = outlook
  const tempFactor = outlook.temperatureFactor
  const rainFactor = outlook.rainfallFactor
  const diseaseFactor = 1.0 // no disease tracking yet — assumed healthy

  const weatherOnlyYieldTonsPerHa =
    tempFactor != null && rainFactor != null ? baseYieldTonsPerHa * tempFactor * rainFactor * diseaseFactor : null

  const fertilizer =
    plotHectares != null && plotHectares > 0 && fertilizerApplications.length > 0
      ? computeFertilizerFactor(fertilizerApplications, plantingDate, plotHectares, ratoonNumber, soil)
      : null

  const estimatedYieldTonsPerHa =
    weatherOnlyYieldTonsPerHa != null
      ? weatherOnlyYieldTonsPerHa * (fertilizer?.fertilizerFactor ?? 1)
      : null

  const fertilizerContributionPct =
    weatherOnlyYieldTonsPerHa != null && estimatedYieldTonsPerHa != null && weatherOnlyYieldTonsPerHa > 0
      ? ((estimatedYieldTonsPerHa - weatherOnlyYieldTonsPerHa) / weatherOnlyYieldTonsPerHa) * 100
      : null

  const riskNotes: string[] = [...outlook.riskNotes]
  const timingOutlook = outlook.timingOutlook

  if (plotHectares == null || plotHectares <= 0) {
    riskNotes.push('Plot size not in hectares — fertilizer rate not calculated.')
  } else if (fertilizerApplications.length === 0) {
    riskNotes.push('No fertilizer logged — estimate is weather-only.')
  } else if (fertilizer) {
    if (fertilizer.nitrogenAppliedKgPerHa < 50 && (soil.nPpm == null || soil.nPpm < 30)) {
      riskNotes.push('N well below recommended — 25-40% yield loss risk.')
    } else if (fertilizer.nitrogenAppliedKgPerHa < 100) {
      riskNotes.push('N below optimal 140-180 kg/ha zone.')
    }
    if (fertilizer.phosphorusAppliedKgPerHa < 20 && (soil.pBrayPpm == null || soil.pBrayPpm < 10)) {
      riskNotes.push('P low — watch for purple leaves, weak roots.')
    }
    if (fertilizer.potassiumAppliedKgPerHa < 80 && (soil.kExchangeablePpm == null || soil.kExchangeablePpm < 100)) {
      riskNotes.push('K low — higher lodging risk, modest yield penalty.')
    }
    if (fertilizer.nitrogenAppliedKgPerHa > 0 && fertilizer.potassiumAppliedKgPerHa > 0) {
      const nkRatio = fertilizer.nitrogenAppliedKgPerHa / fertilizer.potassiumAppliedKgPerHa
      if (nkRatio > 1.8) {
        riskNotes.push('N:K imbalanced — quality and lodging risk.')
      }
    }
  }

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    daysSincePlanting,
    weatherDaysUsed: weatherDays.length,
    avgTempC,
    avgDailyRainfallMm,
    temperatureFactor: tempFactor,
    rainfallFactor: rainFactor,
    diseaseFactor,
    fertilizer,
    baseYieldTonsPerHa,
    weatherOnlyYieldTonsPerHa,
    estimatedYieldTonsPerHa,
    fertilizerContributionPct,
    timingOutlook,
    riskNotes,
  }
}
