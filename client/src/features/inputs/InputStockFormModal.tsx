import { useState, type FormEvent } from 'react'
import type { InputStock, InputStockInput, InputType } from './inputStockApi'
import '../../styles/modal.css'

const INPUT_TYPES: InputType[] = ['fertilizer', 'pesticide', 'seed']

function InputStockFormModal({
  initialValue,
  saving,
  onCancel,
  onSave,
}: {
  initialValue: InputStock | null
  saving: boolean
  onCancel: () => void
  onSave: (input: InputStockInput) => void
}) {
  const [type, setType] = useState<InputType>(initialValue?.type ?? 'fertilizer')
  const [name, setName] = useState(initialValue?.name ?? '')
  const [currentQuantity, setCurrentQuantity] = useState(
    initialValue ? String(initialValue.current_quantity) : '0',
  )
  const [unit, setUnit] = useState(initialValue?.unit ?? '')
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialValue ? String(initialValue.low_stock_threshold) : '0',
  )
  const [costPerUnit, setCostPerUnit] = useState(initialValue?.cost_per_unit != null ? String(initialValue.cost_per_unit) : '')
  const [nitrogenPct, setNitrogenPct] = useState(initialValue?.nitrogen_pct != null ? String(initialValue.nitrogen_pct) : '')
  const [phosphorusPct, setPhosphorusPct] = useState(
    initialValue?.phosphorus_pct != null ? String(initialValue.phosphorus_pct) : '',
  )
  const [potassiumPct, setPotassiumPct] = useState(
    initialValue?.potassium_pct != null ? String(initialValue.potassium_pct) : '',
  )
  const [kgPerUnit, setKgPerUnit] = useState(initialValue?.kg_per_unit != null ? String(initialValue.kg_per_unit) : '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      type,
      name: name.trim(),
      current_quantity: Number(currentQuantity),
      unit: unit.trim(),
      low_stock_threshold: Number(lowStockThreshold),
      cost_per_unit: costPerUnit ? Number(costPerUnit) : null,
      nitrogen_pct: type === 'fertilizer' && nitrogenPct ? Number(nitrogenPct) : null,
      phosphorus_pct: type === 'fertilizer' && phosphorusPct ? Number(phosphorusPct) : null,
      potassium_pct: type === 'fertilizer' && potassiumPct ? Number(potassiumPct) : null,
      kg_per_unit: type === 'fertilizer' && kgPerUnit ? Number(kgPerUnit) : null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>{initialValue ? 'Edit Input' : 'Add Input'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="input-name">Name</label>
            <input
              id="input-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Urea 46-0-0"
              required
            />
          </div>

          <div className="modal-field">
            <label htmlFor="input-type">Type</label>
            <select id="input-type" value={type} onChange={(e) => setType(e.target.value as InputType)}>
              {INPUT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field-row">
            <div className="modal-field">
              <label htmlFor="input-quantity">Current quantity</label>
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
              <label htmlFor="input-unit">Unit</label>
              <input
                id="input-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. kg, sacks, L"
                required
              />
            </div>
          </div>

          {type === 'fertilizer' && (
            <>
              <p className="modal-hint">
                Nutrient content (e.g. "14-14-14" printed on the bag) and kg per unit — used to convert usage logs
                into actual kg of N/P/K applied per hectare for the sugarcane fertilizer forecast. Optional, but the
                forecast can't include this product without it.
              </p>
              <div className="modal-field-row">
                <div className="modal-field">
                  <label htmlFor="input-n-pct">Nitrogen (%)</label>
                  <input
                    id="input-n-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={nitrogenPct}
                    onChange={(e) => setNitrogenPct(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="input-p-pct">Phosphorus (%)</label>
                  <input
                    id="input-p-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={phosphorusPct}
                    onChange={(e) => setPhosphorusPct(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-field-row">
                <div className="modal-field">
                  <label htmlFor="input-k-pct">Potassium (%)</label>
                  <input
                    id="input-k-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={potassiumPct}
                    onChange={(e) => setPotassiumPct(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="input-kg-per-unit">Kg per unit {unit ? `(1 ${unit} = ? kg)` : ''}</label>
                  <input
                    id="input-kg-per-unit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={kgPerUnit}
                    onChange={(e) => setKgPerUnit(e.target.value)}
                    placeholder="e.g. 50 for a 50kg bag"
                  />
                </div>
              </div>
            </>
          )}

          <div className="modal-field-row">
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
            <div className="modal-field">
              <label htmlFor="input-cost">Cost per unit (optional)</label>
              <input
                id="input-cost"
                type="number"
                min="0"
                step="0.01"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
            </div>
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
