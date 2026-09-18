import { useEffect, useState } from 'react'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import {
  createAquacultureStock,
  deleteAquacultureStock,
  listAquacultureStock,
  updateAquacultureStock,
  type AquacultureStock,
  type AquacultureStockInput,
} from './aquacultureStockApi'
import { createAquacultureRecord, type AquacultureRecordInput } from './aquacultureRecordsApi'
import AquacultureStockFormModal from './AquacultureStockFormModal'
import AquacultureRecordFormModal from './AquacultureRecordFormModal'
import AquacultureRecordHistoryModal from './AquacultureRecordHistoryModal'
import './AquaculturePage.css'

const PRODUCTION_SYSTEM_LABELS: Record<string, string> = {
  pond: 'Pond',
  cage: 'Cage',
  pen: 'Pen',
  tank_ras: 'Tank (RAS)',
}

function AquaculturePage() {
  const [stock, setStock] = useState<AquacultureStock[]>([])
  const [waterPlots, setWaterPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<AquacultureStock | null>(null)
  const [loggingRecordFor, setLoggingRecordFor] = useState<AquacultureStock | null>(null)
  const [historyFor, setHistoryFor] = useState<AquacultureStock | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [stockData, plotsData] = await Promise.all([listAquacultureStock(), listPlots()])
      setStock(stockData)
      setWaterPlots(plotsData.filter((plot) => plot.type === 'water'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load aquaculture stock')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const openCreateForm = () => {
    setEditingStock(null)
    setFormOpen(true)
  }

  const openEditForm = (item: AquacultureStock) => {
    setEditingStock(item)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingStock(null)
  }

  const handleSave = async (input: AquacultureStockInput) => {
    setSaving(true)
    setError(null)
    try {
      if (editingStock) {
        await updateAquacultureStock(editingStock.id, input)
      } else {
        await createAquacultureStock(input)
      }
      closeForm()
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save aquaculture stock')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: AquacultureStock) => {
    const confirmed = window.confirm(`Delete "${item.species}" in ${item.plots.name}? This cannot be undone.`)
    if (!confirmed) return

    setError(null)
    try {
      await deleteAquacultureStock(item.id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete aquaculture stock')
    }
  }

  const handleLogRecord = async (input: AquacultureRecordInput) => {
    setSaving(true)
    setError(null)
    try {
      await createAquacultureRecord(input)
      setLoggingRecordFor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log record')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="aquaculture-page">
      <div className="aquaculture-header">
        <h1>Aquaculture</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={openCreateForm}
          disabled={!loading && waterPlots.length === 0}
          title={!loading && waterPlots.length === 0 ? 'Add a water-type plot in Plots first' : undefined}
        >
          + Add Stock
        </button>
      </div>

      {!loading && waterPlots.length === 0 && (
        <p className="aquaculture-hint">
          No water plots yet. Go to Plots and add one, setting its type to "Water", before adding stock here.
        </p>
      )}

      {error && <p className="aquaculture-error">{error}</p>}

      {loading ? (
        <p className="aquaculture-empty">Loading...</p>
      ) : stock.length === 0 ? (
        <p className="aquaculture-empty">No aquaculture stock yet. Add your first one to get started.</p>
      ) : (
        <div className="aquaculture-grid">
          {stock.map((item) => (
            <div className="aquaculture-card" key={item.id}>
              <h2>{item.species}</h2>
              <p className="aquaculture-meta">
                {item.plots.name} · {PRODUCTION_SYSTEM_LABELS[item.production_system] ?? item.production_system}
              </p>
              <p className="aquaculture-count">
                {item.quantity_stocked} {item.stocking_unit}
              </p>
              <p>Stocked {item.stocking_date}</p>
              {item.notes && <p>{item.notes}</p>}

              <div className="aquaculture-card-actions">
                <button type="button" onClick={() => setLoggingRecordFor(item)}>
                  Log Record
                </button>
                <button type="button" onClick={() => setHistoryFor(item)}>
                  History
                </button>
                <button type="button" onClick={() => openEditForm(item)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(item)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <AquacultureStockFormModal
          initialValue={editingStock}
          waterPlots={waterPlots}
          saving={saving}
          onCancel={closeForm}
          onSave={handleSave}
        />
      )}

      {loggingRecordFor && (
        <AquacultureRecordFormModal
          stock={loggingRecordFor}
          saving={saving}
          onCancel={() => setLoggingRecordFor(null)}
          onSave={handleLogRecord}
        />
      )}

      {historyFor && <AquacultureRecordHistoryModal stock={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  )
}

export default AquaculturePage
