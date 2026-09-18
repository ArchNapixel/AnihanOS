import { useState } from 'react'
import LeafIcon from '../../components/LeafIcon'
import ModulePicker from '../../components/ModulePicker'
import { useFarm } from '../../lib/FarmContext'
import { updateFarmModules, type FarmModule } from '../../api/farmApi'
import './ModuleSelectionPage.css'

function ModuleSelectionPage() {
  const { farm, refresh } = useFarm()
  const [selected, setSelected] = useState<FarmModule[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!farm) return
    setSaving(true)
    setError(null)
    try {
      await updateFarmModules(farm.id, selected)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your selection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-content">
        <div className="onboarding-brand">
          <span className="onboarding-brand-icon">
            <LeafIcon />
          </span>
          <h1>AnihanOS</h1>
        </div>
        <p className="onboarding-tagline">What does your farm do?</p>
        <p className="onboarding-hint">
          Pick as many as apply. You'll always have Dashboard, Land &amp; Plot Management, and Financials —
          this just decides which other tools show up. You can change this later in Settings.
        </p>

        <ModulePicker selected={selected} onChange={setSelected} />

        {error && <p className="onboarding-error">{error}</p>}

        <button type="button" className="onboarding-submit" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

export default ModuleSelectionPage
