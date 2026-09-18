import { useEffect, useState } from 'react'
import { CloudRain, CloudSun } from 'lucide-react'
import type { WeatherDaily } from '../../lib/weatherApi'
import { todayIso } from '../../lib/dateUtils'
import './WeatherWidget.css'

// The sync cron runs daily at 22:00 UTC (see server/vercel.json) — anchored
// to UTC rather than the viewer's own local time, so this stays correct
// regardless of what timezone the dashboard is being viewed from.
const SYNC_HOUR_UTC = 22

function getNextSyncTime(): Date {
  const now = new Date()
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), SYNC_HOUR_UTC, 0, 0, 0),
  )
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next
}

function formatCountdown(target: Date): string {
  const diffMs = target.getTime() - Date.now()
  if (diffMs <= 0) return 'due any moment'
  const totalMinutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`
}

function dayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return 'Today'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}

function WeatherWidget({ days }: { days: WeatherDaily[] }) {
  const today = todayIso()
  const [nextSync, setNextSync] = useState(getNextSyncTime)

  useEffect(() => {
    const interval = setInterval(() => {
      setNextSync((current) => (current.getTime() <= Date.now() ? getNextSyncTime() : current))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard-card weather-card">
      <div className="weather-card-header">
        <h2>
          <CloudSun size={18} /> Weather
        </h2>
        <span className="weather-next-sync">
          Next update in {formatCountdown(nextSync)} (
          {nextSync.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })})
        </span>
      </div>

      {days.length === 0 ? (
        <p className="dashboard-empty">
          No weather data yet — it appears here after the first daily sync runs for your farm.
        </p>
      ) : (
        <div className="weather-strip">
          {days.map((day) => (
            <div className="weather-day" key={day.date}>
              <span className="weather-day-label">{dayLabel(day.date, today)}</span>
              <span className="weather-day-temps">
                {day.temp_max_c != null ? Math.round(day.temp_max_c) : '—'}° /{' '}
                {day.temp_min_c != null ? Math.round(day.temp_min_c) : '—'}°
              </span>
              {day.precipitation_mm != null && day.precipitation_mm > 0 && (
                <span className="weather-day-rain">
                  <CloudRain size={12} /> {day.precipitation_mm.toFixed(0)}mm
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WeatherWidget
