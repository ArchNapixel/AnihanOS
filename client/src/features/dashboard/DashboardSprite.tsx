import type { SpriteMood, WeeklySpriteForecast } from '../../domain/weeklySpriteForecast'
import './DashboardSprite.css'

const MOOD_PATHS: Record<SpriteMood, string> = {
  // Simple curved mouth, no separate assets — happy (smile), neutral
  // (flat), worried (frown), drawn as one SVG path per mood.
  happy: 'M 9 15 Q 12 19 15 15',
  neutral: 'M 9 16 L 15 16',
  worried: 'M 9 17 Q 12 13 15 17',
}

function SpriteFace({ mood }: { mood: SpriteMood }) {
  return (
    <svg viewBox="0 0 24 24" width={48} height={48} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--color-primary)" />
      <circle cx="8.5" cy="10" r="1.4" fill="#f5f0e2" />
      <circle cx="15.5" cy="10" r="1.4" fill="#f5f0e2" />
      <path d={MOOD_PATHS[mood]} stroke="#f5f0e2" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function DashboardSprite({ forecast }: { forecast: WeeklySpriteForecast }) {
  return (
    <div className="dashboard-sprite">
      <div className={`sprite-avatar sprite-mood-${forecast.mood}`}>
        <SpriteFace mood={forecast.mood} />
      </div>
      <div className="sprite-bubble">
        <span className="sprite-bubble-label">This week</span>
        {forecast.lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  )
}

export default DashboardSprite
