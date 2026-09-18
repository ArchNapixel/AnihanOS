import type { CropCycle } from './cropCyclesApi'
import type { Plot } from '../landPlots/plotsApi'
import type { WeatherDaily } from '../../api/weatherApi'
import { forecastSugarcane } from '../../domain/sugarcaneForecast'
import { formatDateShort } from '../../lib/dateUtils'
import '../../styles/modal.css'
import './SugarcaneForecastModal.css'

const TIMING_LABELS: Record<string, string> = {
  on_track: 'On track',
  possible_delay: 'Possible delay',
  favorable: 'Favorable conditions',
  insufficient_data: 'Not enough data yet',
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
  const forecast = forecastSugarcane(cycle.planting_date, weatherDays)
  const isHectares = plot?.size_unit?.trim().toLowerCase().startsWith('hectare') ?? false

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide forecast-modal">
        <h2>Weather-Based Forecast — {cycle.crop_types.name}</h2>
        <p className="forecast-subtitle">
          {plot?.name ?? 'Plot'} · Planted {formatDateShort(cycle.planting_date)} · Day {forecast.daysSincePlanting}
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
            Calendar expected harvest date stays{' '}
            <strong>{formatDateShort(cycle.expected_harvest_date)}</strong>. This outlook reflects how current
            weather is likely affecting that timeline — not a replacement date.
          </p>
        </div>

        <div className="forecast-section">
          <span className="forecast-section-label">Estimated yield</span>
          {forecast.estimatedYieldTonsPerHa != null ? (
            <>
              <strong>{forecast.estimatedYieldTonsPerHa.toFixed(1)} tons/ha</strong>
              {isHectares && plot && (
                <p className="forecast-note">
                  ≈ {(forecast.estimatedYieldTonsPerHa * plot.size).toFixed(1)} tons for this {plot.size}-hectare plot
                </p>
              )}
            </>
          ) : (
            <strong>Not enough weather data yet</strong>
          )}
          <p className="forecast-note">
            Based on a {forecast.baseYieldTonsPerHa} tons/ha reference yield, adjusted for observed temperature and
            rainfall. Assumes no disease or pest pressure (not yet tracked in AnihanOS).
          </p>
        </div>

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
