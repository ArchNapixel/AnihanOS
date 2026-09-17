import { useEffect, useState } from 'react'
import {
  createInputStock,
  deleteInputStock,
  listInputStock,
  updateInputStock,
  type InputStock,
  type InputStockInput,
} from './inputStockApi'
import { logInputUsage, type InputUsageInput } from './inputUsageApi'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import { listCropCycles, type CropCycle } from '../crops/cropCyclesApi'
import InputStockFormModal from './InputStockFormModal'
import LogUsageModal from './LogUsageModal'
import UsageHistoryModal from './UsageHistoryModal'
import './InputsPage.css'

function InputsPage() {
  const [stockItems, setStockItems] = useState<InputStock[]>([])
  const [plots, setPlots] = useState<Plot[]>([])
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<InputStock | null>(null)
  const [loggingUsageFor, setLoggingUsageFor] = useState<InputStock | null>(null)
  const [historyFor, setHistoryFor] = useState<InputStock | null>(null)
  const [saving, setSaving] = useState(false)
  const [usageError, setUsageError] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [stockData, plotsData, cyclesData] = await Promise.all([listInputStock(), listPlots(), listCropCycles()])
      setStockItems(stockData)
      setPlots(plotsData)
      setCropCycles(cyclesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inputs')
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

  const openEditForm = (stock: InputStock) => {
    setEditingStock(stock)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingStock(null)
  }

  const handleSave = async (input: InputStockInput) => {
    setSaving(true)
    setError(null)
    try {
      if (editingStock) {
        await updateInputStock(editingStock.id, input)
      } else {
        await createInputStock(input)
      }
      closeForm()
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save input')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (stock: InputStock) => {
    const confirmed = window.confirm(`Delete "${stock.name}"? This cannot be undone.`)
    if (!confirmed) return

    setError(null)
    try {
      await deleteInputStock(stock.id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete input')
    }
  }

  const handleLogUsage = async (input: InputUsageInput) => {
    if (!loggingUsageFor) return
    setSaving(true)
    setUsageError(null)
    try {
      await logInputUsage(input, loggingUsageFor)
      setLoggingUsageFor(null)
      await loadAll()
    } catch (err) {
      setUsageError(err instanceof Error ? err.message : 'Failed to log usage')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="inputs-page">
      <div className="inputs-header">
        <h1>Fertilizer/Input Management</h1>
        <button type="button" className="btn-primary" onClick={openCreateForm}>
          + Add Input
        </button>
      </div>

      {error && <p className="inputs-error">{error}</p>}

      {loading ? (
        <p className="inputs-empty">Loading...</p>
      ) : stockItems.length === 0 ? (
        <p className="inputs-empty">No inputs yet. Add fertilizer, pesticide, or seed stock to get started.</p>
      ) : (
        <div className="input-grid">
          {stockItems.map((stock) => {
            const isLow = stock.current_quantity <= stock.low_stock_threshold
            return (
              <div className={isLow ? 'input-card input-card-low' : 'input-card'} key={stock.id}>
                <div className="input-card-header">
                  <h2>{stock.name}</h2>
                  <span className="input-type-badge">{stock.type}</span>
                </div>
                <p className="input-quantity">
                  {stock.current_quantity} {stock.unit}
                  {isLow && <span className="input-low-flag"> · Low stock</span>}
                </p>
                {stock.cost_per_unit != null && <p>Cost: {stock.cost_per_unit.toFixed(2)} / {stock.unit}</p>}
                <p className="input-threshold">Threshold: {stock.low_stock_threshold} {stock.unit}</p>

                <div className="input-card-actions">
                  <button type="button" onClick={() => setLoggingUsageFor(stock)}>
                    Log Usage
                  </button>
                  <button type="button" onClick={() => setHistoryFor(stock)}>
                    History
                  </button>
                  <button type="button" onClick={() => openEditForm(stock)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(stock)}>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <InputStockFormModal initialValue={editingStock} saving={saving} onCancel={closeForm} onSave={handleSave} />
      )}

      {loggingUsageFor && (
        <LogUsageModal
          stock={loggingUsageFor}
          plots={plots}
          cropCycles={cropCycles}
          saving={saving}
          error={usageError}
          onCancel={() => {
            setLoggingUsageFor(null)
            setUsageError(null)
          }}
          onSave={handleLogUsage}
        />
      )}

      {historyFor && <UsageHistoryModal stock={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  )
}

export default InputsPage
