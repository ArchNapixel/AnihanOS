import { useEffect, useState } from 'react'
import {
  createInputStock,
  deleteInputStock,
  listInputStock,
  updateInputStock,
  addStockQuantity,
  type InputStock,
  type InputStockInput,
  type InputType,
} from './inputStockApi'
import { logInputUsage, type InputUsageInput } from './inputUsageApi'
import { listPlots, type Plot } from '../landPlots/plotsApi'
import { listCropCycles, type CropCycle } from '../crops/cropCyclesApi'
import InputStockFormModal from './InputStockFormModal'
import AddStockModal from './AddStockModal'
import QuickLogUsageModal from './QuickLogUsageModal'
import UsageHistoryModal from './UsageHistoryModal'
import PlotInputHistoryModal from './PlotInputHistoryModal'
import './InputsPage.css'

function InputsPage() {
  const [stockItems, setStockItems] = useState<InputStock[]>([])
  const [plots, setPlots] = useState<Plot[]>([])
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [addStockOpen, setAddStockOpen] = useState(false)
  const [addStockError, setAddStockError] = useState<string | null>(null)
  const [editingStock, setEditingStock] = useState<InputStock | null>(null)
  const [historyFor, setHistoryFor] = useState<InputStock | null>(null)
  const [plotHistoryFor, setPlotHistoryFor] = useState<Plot | null>(null)
  const [quickLogFor, setQuickLogFor] = useState<{ plot: Plot; type: InputType } | null>(null)
  const [saving, setSaving] = useState(false)
  const [quickLogError, setQuickLogError] = useState<string | null>(null)

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

  const handleAddStock = async (stock: InputStock, quantityToAdd: number) => {
    setSaving(true)
    setAddStockError(null)
    try {
      await addStockQuantity(stock, quantityToAdd)
      setAddStockOpen(false)
      await loadAll()
    } catch (err) {
      setAddStockError(err instanceof Error ? err.message : 'Failed to add stock')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickLogUsage = async (input: InputUsageInput) => {
    const stock = stockItems.find((s) => s.id === input.input_stock_id)
    if (!stock) return
    setSaving(true)
    setQuickLogError(null)
    try {
      await logInputUsage(input, stock)
      setQuickLogFor(null)
      await loadAll()
    } catch (err) {
      setQuickLogError(err instanceof Error ? err.message : 'Failed to log usage')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="inputs-page">
      <div className="inputs-header">
        <h1>Fertilizer/Input Management</h1>
        <div className="inputs-header-actions">
          <button type="button" className="btn-primary" onClick={openCreateForm}>
            + Add Input
          </button>
          <button type="button" className="btn-outline" onClick={() => setAddStockOpen(true)} disabled={stockItems.length === 0}>
            + Add Stock
          </button>
        </div>
      </div>

      {error && <p className="inputs-error">{error}</p>}

      {loading ? (
        <p className="inputs-empty">Loading...</p>
      ) : stockItems.length === 0 ? (
        <p className="inputs-empty">No inputs yet. Add fertilizer, pesticide, or seed stock to get started.</p>
      ) : (
        <div className="input-table-wrap">
          <table className="input-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Cost / Unit</th>
                <th>Threshold</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stockItems.map((stock) => {
                const isLow = stock.current_quantity <= stock.low_stock_threshold
                return (
                  <tr key={stock.id} className={isLow ? 'input-row-low' : ''}>
                    <td>{stock.name}</td>
                    <td>
                      <span className="input-type-badge">{stock.type}</span>
                    </td>
                    <td>
                      {stock.current_quantity} {stock.unit}
                      {isLow && <span className="input-low-flag"> · Low</span>}
                    </td>
                    <td>{stock.cost_per_unit != null ? `${stock.cost_per_unit.toFixed(2)} / ${stock.unit}` : '—'}</td>
                    <td>
                      {stock.low_stock_threshold} {stock.unit}
                    </td>
                    <td className="input-row-actions">
                      <button type="button" onClick={() => setHistoryFor(stock)}>
                        History
                      </button>
                      <button type="button" onClick={() => openEditForm(stock)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(stock)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {plots.length > 0 && (
        <div className="inputs-plot-section">
          <h2>Usage by Plot</h2>
          <p className="inputs-plot-hint">
            See every fertilizer, pesticide, and other input applied to a plot, in order, from planting through
            harvest.
          </p>
          <div className="inputs-plot-list">
            {plots.map((plot) => (
              <div className="inputs-plot-row" key={plot.id}>
                <span>{plot.name}</span>
                <div className="inputs-plot-row-actions">
                  <button type="button" onClick={() => setQuickLogFor({ plot, type: 'fertilizer' })}>
                    + Fertilizer
                  </button>
                  <button type="button" onClick={() => setQuickLogFor({ plot, type: 'pesticide' })}>
                    + Pesticide
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setPlotHistoryFor(plot)}>
                    View Breakdown
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {formOpen && (
        <InputStockFormModal initialValue={editingStock} saving={saving} onCancel={closeForm} onSave={handleSave} />
      )}

      {addStockOpen && (
        <AddStockModal
          stockItems={stockItems}
          saving={saving}
          error={addStockError}
          onCancel={() => {
            setAddStockOpen(false)
            setAddStockError(null)
          }}
          onSave={handleAddStock}
        />
      )}

      {historyFor && <UsageHistoryModal stock={historyFor} onClose={() => setHistoryFor(null)} />}

      {plotHistoryFor && (
        <PlotInputHistoryModal
          plot={plotHistoryFor}
          cropCycles={cropCycles}
          onClose={() => setPlotHistoryFor(null)}
        />
      )}

      {quickLogFor && (
        <QuickLogUsageModal
          plot={quickLogFor.plot}
          type={quickLogFor.type}
          stockItems={stockItems}
          cropCycles={cropCycles}
          saving={saving}
          error={quickLogError}
          onCancel={() => {
            setQuickLogFor(null)
            setQuickLogError(null)
          }}
          onSave={handleQuickLogUsage}
        />
      )}
    </div>
  )
}

export default InputsPage
