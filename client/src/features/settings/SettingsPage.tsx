import { useEffect, useMemo, useState } from 'react'
import { useFarm } from '../../lib/FarmContext'
import { updateFarmLocation } from '../../api/farmApi'
import { PH_PROVINCES } from '../../lib/phProvinces'
import './SettingsPage.css'

function SettingsPage() {
  const { farm, refresh } = useFarm()

  const [province, setProvince] = useState(farm?.province ?? '')
  const [locationSaving, setLocationSaving] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationSaved, setLocationSaved] = useState(false)

  useEffect(() => {
    setProvince(farm?.province ?? '')
  }, [farm?.province])

  const regions = useMemo(() => {
    const map = new Map<string, typeof PH_PROVINCES>()
    for (const p of PH_PROVINCES) {
      const list = map.get(p.region) ?? []
      list.push(p)
      map.set(p.region, list)
    }
    return Array.from(map.entries())
  }, [])

  const handleSaveLocation = async () => {
    if (!farm) return
    setLocationSaving(true)
    setLocationError(null)
    setLocationSaved(false)
    try {
      const match = PH_PROVINCES.find((p) => p.name === province)
      await updateFarmLocation(farm.id, match ? { province: match.name, latitude: match.latitude, longitude: match.longitude } : null)
      await refresh()
      setLocationSaved(true)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Failed to save your location')
    } finally {
      setLocationSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-section">
        <h2>Farm location</h2>
        <p className="settings-hint">
          Used for weather forecasts and future harvest predictions. Province-level accuracy is enough — pick
          the one closest to your farm.
        </p>

        <select
          className="settings-province-select"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="">Not set (estimate from my plots' locations)</option>
          {regions.map(([region, provinces]) => (
            <optgroup key={region} label={region}>
              {provinces.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {locationError && <p className="settings-error">{locationError}</p>}
        {locationSaved && !locationError && <p className="settings-saved">Saved.</p>}

        <button
          type="button"
          className="btn-primary settings-save"
          onClick={handleSaveLocation}
          disabled={locationSaving}
        >
          {locationSaving ? 'Saving...' : 'Save location'}
        </button>
      </div>
    </div>
  )
}

export default SettingsPage
