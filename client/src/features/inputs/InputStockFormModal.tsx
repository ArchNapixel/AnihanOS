import { useState, type FormEvent } from 'react'
import type { InputStock, InputStockInput } from './inputStockApi'
import '../../styles/modal.css'

// Inputs (fertilizer/pesticide/seed products) are developer-set presets, not
// farmer-created — this modal only ever edits an existing stock row now.
// Product identity (name, type, nutrient composition, unit) is fixed; only
// the farm-specific operational fields below are editable.
function InputStockFormModal({
  initialValue,
  saving,
  onCancel,
  onSave,
}: {
  initialValue: InputStock
  saving: boolean
  onCancel: () => void
  onSave: (input: InputStockInput) => void
}) {
  const [currentQuantity, setCurrentQuantity] = useState(String(initialValue.current_quantity))
  const [lowStockThreshold, setLowStockThreshold] = useState(String(initialValue.low_stock_threshold))
  const [costPerUnit, setCostPerUnit] = useState(
    initialValue.cost_per_unit != null ? String(initialValue.cost_per_unit) : '',
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      type: initialValue.type,
      name: initialValue.name,
      current_quantity: Number(currentQuantity),
      unit: initialValue.unit,
      low_stock_threshold: Number(lowStockThreshold),
      cost_per_unit: costPerUnit ? Number(costPerUnit) : null,
      nitrogen_pct: initialValue.nitrogen_pct,
      phosphorus_pct: initialValue.phosphorus_pct,
      potassium_pct: initialValue.potassium_pct,
      kg_per_unit: initialValue.kg_per_unit,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Edit Input — {initialValue.name}</h2>
        <p className="modal-hint">
          {initialValue.type} · unit: {initialValue.unit}
          {initialValue.type === 'fertilizer' && initialValue.nitrogen_pct != null
            ? ` · N-P-K ${initialValue.nitrogen_pct}-${initialValue.phosphorus_pct ?? 0}-${initialValue.potassium_pct ?? 0}`
            : ''}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="modal-field-row">
            <div className="modal-field">
              <label htmlFor="input-quantity">Current quantity ({initialValue.unit})</label>
              <input
                id="input-quantity"
                type="number"
                min="0"
                step="0.01"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                required
              />
            </div>
            <div className="modal-field">
              <label htmlFor="input-threshold">Low-stock threshold</label>
              <input
                id="input-threshold"
                type="number"
                min="0"
                step="0.01"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="input-cost">Cost per unit (optional — prices change, update this at the current rate)</label>
            <input
              id="input-cost"
              type="number"
              min="0"
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InputStockFormModal
