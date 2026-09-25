import { useEffect, useState } from 'react'
import type { CropCycle } from './cropCyclesApi'
import type { Plot } from '../landPlots/plotsApi'
import type { WeatherDaily } from '../../api/weatherApi'
import { listFertilizerUsageForCycle } from '../inputs/inputUsageApi'
import { forecastSugarcane, baseYieldForLandQuality, type FertilizerApplication } from '../../domain/sugarcaneForecast'
import { CONDITIONAL_THREATS } from '../../domain/regionalDiseasePressure'
import { formatDateShort } from '../../lib/dateUtils'
import '../../styles/modal.css'
import './SugarcaneForecastModal.css'

const TIMING_LABELS: Record<string, string> = {
  on_track: 'On track',
  possible_delay: 'Possible delay',
  favorable: 'Favorable conditions',
  insufficient_data: 'Not enough data yet',
}

const DISEASE_LABELS: Record<string, string> = {
  low: 'Low',
  elevated: 'Elevated',
  unknown: 'Not enough data yet',
}

function SugarcaneForecastModal({
  cycle,
  plot,
  weatherDays,
  onClose,
}: {
  cycle: CropCycle
  plot: Plot | undefined
  weatherDays: WeatherDaily[]
  onClose: () => void
}) {
  const [fertilizerApplications, setFertilizerApplications] = useState<FertilizerApplication[]>([])
  const [loadingFertilizer, setLoadingFertilizer] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingFertilizer(true)
    listFertilizerUsageForCycle(cycle.id)
      .then((rows) => {
        if (cancelled) return
        setFertilizerApplications(
          rows.map((row) => ({
            dateUsed: row.date_used,
            quantityUsed: row.quantity_used,
            nitrogenPct: row.input_stock.nitrogen_pct,
            phosphorusPct: row.input_stock.phosphorus_pct,
            potassiumPct: row.input_stock.potassium_pct,
            kgPerUnit: row.input_stock.kg_per_unit,
          })),
        )
      })
      .catch(() => setFertilizerApplications([]))
      .finally(() => !cancelled && setLoadingFertilizer(false))
    return () => {
      cancelled = true
    }
  }, [cycle.id])

  const isHectares = plot?.size_unit?.trim().toLowerCase().startsWith('hectare') ?? false

  const forecast = forecastSugarcane({
    plantingDate: cycle.planting_date,
    weatherDays,
    baseYieldTonsPerHa: baseYieldForLandQuality(plot?.land_quality ?? null),
    ratoonNumber: cycle.ratoon_number,
    plotHectares: isHectares ? (plot?.size ?? null) : null,
    fertilizerApplications,
    soil: {
      soilType: plot?.soil_type ?? null,
      organicMatterPct: plot?.soil_organic_matter_pct ?? null,
      nPpm: plot?.soil_n_ppm ?? null,
      pBrayPpm: plot?.soil_p_bray_ppm ?? null,
      kExchangeablePpm: plot?.soil_k_exchangeable_ppm ?? null,
    },
  })

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide forecast-modal">
        <h2>Weather-Based Forecast — {cycle.crop_types.name}</h2>
        <p className="forecast-subtitle">
          {plot?.name ?? 'Plot'} · Planted {formatDateShort(cycle.planting_date)} · Day {forecast.daysSincePlanting}
          {cycle.ratoon_number > 0 ? ` · ${cycle.ratoon_number === 1 ? '1st' : cycle.ratoon_number === 2 ? '2nd' : `${cycle.ratoon_number}rd+`} ratoon` : ' · Plant cane'}
        </p>

        <div className="forecast-section">
          <span className="forecast-section-label">Current stage</span>
          <strong>{forecast.stageLabel}</strong>
        </div>

        <div className="forecast-grid">
          <div className="forecast-stat">
            <span>Avg. temperature</span>
            <strong>{forecast.avgTempC != null ? `${forecast.avgTempC.toFixed(1)}°C` : '—'}</strong>
          </div>
          <div className="forecast-stat">
            <span>Avg. daily rainfall</span>
            <strong>{forecast.avgDailyRainfallMm != null ? `${forecast.avgDailyRainfallMm.toFixed(1)}mm` : '—'}</strong>
          </div>
          <div className="forecast-stat">
            <span>Based on</span>
            <strong>{forecast.weatherDaysUsed} day{forecast.weatherDaysUsed === 1 ? '' : 's'} of data</strong>
          </div>
        </div>

        <div className="forecast-section">
          <span className="forecast-section-label">Growth timing outlook</span>
          <strong className={`forecast-outlook forecast-outlook-${forecast.timingOutlook}`}>
            {TIMING_LABELS[forecast.timingOutlook]}
          </strong>
          <p className="forecast-note">
            Expected harvest unchanged: <strong>{formatDateShort(cycle.expected_harvest_date)}</strong>
          </p>
        </div>

        <div className="forecast-section">
          <span className="forecast-section-label">Disease risk — this week's weather</span>
          <strong className={`forecast-outlook forecast-outlook-disease-${forecast.diseaseRisk.level}`}>
            {DISEASE_LABELS[forecast.diseaseRisk.level]}
          </strong>

          {forecast.diseaseRisk.signals.length > 0 && (
            <ul className="threat-list">
              {forecast.diseaseRisk.signals.map((signal) => (
                <li key={signal.id} className={signal.elevated ? 'threat-row threat-row-elevated' : 'threat-row'}>
                  <div className="threat-row-header">
                    <strong>
                      {signal.label}
                      {signal.estimatedChancePct != null && (
                        <span className="threat-chance"> ~{Math.round(signal.estimatedChancePct)}% chance</span>
                      )}
                    </strong>
                    <span>
                      {signal.elevated
                        ? `Conditions met ${signal.consecutiveDays} days running`
                        : `${signal.conditions.filter((c) => c.met).length} of ${signal.conditions.length} conditions`}
                    </span>
                  </div>
                  <div className="threat-conditions">
                    {signal.conditions.map((condition) => (
                      <span key={condition.label} className={condition.met ? 'threat-cond met' : 'threat-cond'}>
                        {condition.met ? '✓' : '·'} {condition.label}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {forecast.diseaseYieldLossRangePct && (
            <p className="forecast-note">
              If disease takes hold, it could cost an additional {forecast.diseaseYieldLossRangePct[0]}-
              {forecast.diseaseYieldLossRangePct[1]}% beyond the estimate below — a possible extra hit, not a
              certainty, so it isn't folded into the number.
            </p>
          )}
          <p className="forecast-note">
            Smut and red rot thresholds are provisional estimates — the source guide describes those conditions in
            words, not numbers.
          </p>
        </div>

        <div className="forecast-section">
          <span className="forecast-section-label">Estimated yield</span>
          {forecast.estimatedYieldTonsPerHa != null ? (
            <>
              <strong>{forecast.estimatedYieldTonsPerHa.toFixed(1)} tons/ha</strong>
              {isHectares && plot && (
                <p className="forecast-note">≈ {(forecast.estimatedYieldTonsPerHa * plot.size).toFixed(1)} tons ({plot.size} ha)</p>
              )}
            </>
          ) : (
            <strong>Not enough weather data yet</strong>
          )}
          <p className="forecast-note">
            Base {forecast.baseYieldTonsPerHa} tons/ha
            {plot?.land_quality ? ` (${plot.land_quality} land)` : ' (Bukidnon average — set this plot’s land quality for a closer fit)'}
            {' '}· adjusted for weather and regional disease pressure
          </p>
        </div>

        <div className="forecast-section">
          <span className="forecast-section-label">Regional disease pressure</span>
          <strong>
            −{(forecast.regionalDiseaseDrag.range[0] * 100).toFixed(1)}% to −
            {(forecast.regionalDiseaseDrag.range[1] * 100).toFixed(1)}%
          </strong>
          <p className="forecast-note">
            Already applied to the estimate above, using the midpoint (−
            {(forecast.regionalDiseaseDrag.midpoint * 100).toFixed(1)}%). This is a Mindanao regional average
            (incidence × loss), <strong>not an inspection of your field</strong> — your plot may have none of it.
          </p>
          <ul className="threat-list">
            {forecast.regionalDiseaseDrag.contributions.map((c) => (
              <li key={c.label} className="threat-row">
                <div className="threat-row-header">
                  <strong>{c.label}</strong>
                  <span>
                    −{(c.range[0] * 100).toFixed(1)}% to −{(c.range[1] * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="threat-conditions">
                  <span className="threat-cond">{c.source}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="forecast-note">
            Not included (real loss figures, but no published Mindanao incidence to multiply against):{' '}
            {CONDITIONAL_THREATS.map((t) => t.label).join(', ')}.
          </p>
        </div>

        {!loadingFertilizer && forecast.fertilizer && (
          <div className="forecast-section">
            <span className="forecast-section-label">Fertilizer contribution</span>
            <strong>
              {forecast.fertilizerContributionPct != null
                ? `${forecast.fertilizerContributionPct >= 0 ? '+' : ''}${forecast.fertilizerContributionPct.toFixed(0)}% vs. weather alone`
                : '—'}
            </strong>
            <div className="forecast-grid" style={{ marginTop: 12 }}>
              <div className="forecast-stat">
                <span>N applied</span>
                <strong>{forecast.fertilizer.nitrogenAppliedKgPerHa.toFixed(0)} kg/ha</strong>
              </div>
              <div className="forecast-stat">
                <span>P applied</span>
                <strong>{forecast.fertilizer.phosphorusAppliedKgPerHa.toFixed(0)} kg/ha</strong>
              </div>
              <div className="forecast-stat">
                <span>K applied</span>
                <strong>{forecast.fertilizer.potassiumAppliedKgPerHa.toFixed(0)} kg/ha</strong>
              </div>
            </div>
            {!forecast.fertilizer.soilDataProvided && (
              <p className="forecast-note">No soil test on file — assumes medium fertility.</p>
            )}
          </div>
        )}

        {forecast.riskNotes.length > 0 && (
          <div className="forecast-section">
            <span className="forecast-section-label">Notes</span>
            <ul className="forecast-risk-list">
              {forecast.riskNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default SugarcaneForecastModal
