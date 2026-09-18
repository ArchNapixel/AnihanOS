import { useEffect, useState } from 'react'
import ModulePicker from '../../components/ModulePicker'
import { useFarm } from '../../lib/FarmContext'
import { updateFarmModules, type FarmModule } from '../../lib/farmApi'
import './SettingsPage.css'

function SettingsPage() {
  const { farm, enabledModules, refresh } = useFarm()
  const [selected, setSelected] = useState<FarmModule[]>(enabledModules)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSelected(enabledModules)
  }, [enabledModules])

  const handleSave = async () => {
    if (!farm) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateFarmModules(farm.id, selected)
      await refresh()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your selection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-section">
        <h2>Farm modules</h2>
        <p className="settings-hint">
          Dashboard, Land &amp; Plot Management, and Financials are always available. Choose which other
          tools show up for your farm.
        </p>

        <ModulePicker selected={selected} onChange={setSelected} />

        {error && <p className="settings-error">{error}</p>}
        {saved && !error && <p className="settings-saved">Saved.</p>}

        <button type="button" className="btn-primary settings-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

export default SettingsPage
