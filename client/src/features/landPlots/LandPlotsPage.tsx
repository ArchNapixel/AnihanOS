import { useEffect, useState } from 'react'
import { createPlot, deletePlot, listPlots, updatePlot, type Plot, type PlotInput } from './plotsApi'
import PlotFormModal from './PlotFormModal'
import PlotDetailModal from './PlotDetailModal'
import './LandPlotsPage.css'

function LandPlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null)
  const [viewingPlot, setViewingPlot] = useState<Plot | null>(null)
  const [saving, setSaving] = useState(false)

  const loadPlots = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPlots()
      setPlots(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plots')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlots()
  }, [])

  const openCreateModal = () => {
    setEditingPlot(null)
    setModalOpen(true)
  }

  const openEditModal = (plot: Plot) => {
    setEditingPlot(plot)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPlot(null)
  }

  const handleSave = async (input: PlotInput) => {
    setSaving(true)
    setError(null)
    try {
      if (editingPlot) {
        await updatePlot(editingPlot.id, input)
      } else {
        await createPlot(input)
      }
      closeModal()
      await loadPlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plot')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (plot: Plot) => {
    const confirmed = window.confirm(`Delete "${plot.name}"? This cannot be undone.`)
    if (!confirmed) return

    setError(null)
    try {
      await deletePlot(plot.id)
      await loadPlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plot')
    }
  }

  return (
    <div className="land-plots-page">
      <div className="land-plots-header">
        <h1>Land & Plot Management</h1>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Add Land
        </button>
      </div>

      {error && <p className="land-plots-error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : plots.length === 0 ? (
        <p className="land-plots-empty">No plots yet. Add your first one.</p>
      ) : (
        <div className="plot-grid">
          {plots.map((plot) => (
            <div className="plot-card" key={plot.id}>
              <h2>{plot.name}</h2>
              <p>
                {plot.size} {plot.size_unit}
              </p>
              {plot.soil_type && <p>Soil: {plot.soil_type}</p>}
              <div className="plot-card-actions">
                <button type="button" onClick={() => setViewingPlot(plot)}>
                  View
                </button>
                <button type="button" onClick={() => openEditModal(plot)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(plot)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <PlotFormModal initialValue={editingPlot} saving={saving} onCancel={closeModal} onSave={handleSave} />
      )}

      {viewingPlot && <PlotDetailModal plot={viewingPlot} onClose={() => setViewingPlot(null)} />}
    </div>
  )
}

export default LandPlotsPage
