import { useEffect, useState } from 'react'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import {
  createPerennialPlanting,
  deletePerennialPlanting,
  listPerennialPlantings,
  updatePerennialPlanting,
  type PerennialPlanting,
  type PerennialPlantingInput,
} from './perennialPlantingsApi'
import { createHarvestRecord, type HarvestRecordInput } from './harvestRecordsApi'
import PerennialPlantingFormModal from './PerennialPlantingFormModal'
import HarvestRecordFormModal from './HarvestRecordFormModal'
import HarvestRecordHistoryModal from './HarvestRecordHistoryModal'
import './PerennialsPage.css'

const STATUS_LABELS: Record<string, string> = {
  planted: 'Planted',
  maturing: 'Maturing',
  productive: 'Productive',
  declining: 'Declining',
}

function PerennialsPage() {
  const [plantings, setPlantings] = useState<PerennialPlanting[]>([])
  const [landPlots, setLandPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPlanting, setEditingPlanting] = useState<PerennialPlanting | null>(null)
  const [loggingHarvestFor, setLoggingHarvestFor] = useState<PerennialPlanting | null>(null)
  const [historyFor, setHistoryFor] = useState<PerennialPlanting | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [plantingsData, plotsData] = await Promise.all([listPerennialPlantings(), listPlots()])
      setPlantings(plantingsData)
      setLandPlots(plotsData.filter((plot) => plot.type === 'land'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plantings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const openCreateForm = () => {
    setEditingPlanting(null)
    setFormOpen(true)
  }

  const openEditForm = (planting: PerennialPlanting) => {
    setEditingPlanting(planting)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingPlanting(null)
  }

  const handleSave = async (input: PerennialPlantingInput) => {
    setSaving(true)
    setError(null)
    try {
      if (editingPlanting) {
        await updatePerennialPlanting(editingPlanting.id, input)
      } else {
        await createPerennialPlanting(input)
      }
      closeForm()
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save planting')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (planting: PerennialPlanting) => {
    const confirmed = window.confirm(`Delete "${planting.crop_type}" in ${planting.plots.name}? This cannot be undone.`)
    if (!confirmed) return

    setError(null)
    try {
      await deletePerennialPlanting(planting.id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete planting')
    }
  }

  const handleLogHarvest = async (input: HarvestRecordInput) => {
    setSaving(true)
    setError(null)
    try {
      await createHarvestRecord(input)
      setLoggingHarvestFor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log harvest')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="perennials-page">
      <div className="perennials-header">
        <h1>Perennial & Tree Crops</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={openCreateForm}
          disabled={!loading && landPlots.length === 0}
          title={!loading && landPlots.length === 0 ? 'Add a land-type plot in Plots first' : undefined}
        >
          + Add Planting
        </button>
      </div>

      {!loading && landPlots.length === 0 && (
        <p className="perennials-hint">
          No land plots yet. Go to Plots and add one, setting its type to "Land", before adding a planting here.
        </p>
      )}

      {error && <p className="perennials-error">{error}</p>}

      {loading ? (
        <p className="perennials-empty">Loading...</p>
      ) : plantings.length === 0 ? (
        <p className="perennials-empty">No plantings yet. Add your first one to get started.</p>
      ) : (
        <div className="perennials-grid">
          {plantings.map((planting) => (
            <div className="perennials-card" key={planting.id}>
              <h2>{planting.crop_type}</h2>
              <p className="perennials-meta">
                {planting.plots.name} · {STATUS_LABELS[planting.status] ?? planting.status}
              </p>
              <p>Planted {planting.planting_date}</p>
              {planting.expected_first_harvest_date && (
                <p>Expected first harvest {planting.expected_first_harvest_date}</p>
              )}
              {planting.notes && <p>{planting.notes}</p>}

              <div className="perennials-card-actions">
                <button type="button" onClick={() => setLoggingHarvestFor(planting)}>
                  Log Harvest
                </button>
                <button type="button" onClick={() => setHistoryFor(planting)}>
                  History
                </button>
                <button type="button" onClick={() => openEditForm(planting)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(planting)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <PerennialPlantingFormModal
          initialValue={editingPlanting}
          landPlots={landPlots}
          saving={saving}
          onCancel={closeForm}
          onSave={handleSave}
        />
      )}

      {loggingHarvestFor && (
        <HarvestRecordFormModal
          planting={loggingHarvestFor}
          saving={saving}
          onCancel={() => setLoggingHarvestFor(null)}
          onSave={handleLogHarvest}
        />
      )}

      {historyFor && <HarvestRecordHistoryModal planting={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  )
}

export default PerennialsPage
