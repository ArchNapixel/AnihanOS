import { useState, type FormEvent } from 'react'
import type { Plot } from '../landPlots/plotsApi'
import type { AquacultureStock, AquacultureStockInput, ProductionSystem } from './aquacultureStockApi'
import { todayIso } from '../../lib/dateUtils'
import '../../styles/modal.css'

const PRODUCTION_SYSTEMS: ProductionSystem[] = ['pond', 'cage', 'pen', 'tank_ras']
const SPECIES_SUGGESTIONS = [
  'Tilapia',
  'Bangus (Milkfish)',
  'Shrimp (Sugpo)',
  'Shrimp (Vannamei)',
  'Catfish (Hito)',
  'Grouper (Lapu-lapu)',
  'Mudcrab (Alimango)',
  'Freshwater eel (Palos)',
  'Seaweed (Eucheuma/Kappaphycus)',
  'Oyster (Talaba)',
  'Mussel (Tahong)',
]

function AquacultureStockFormModal({
  initialValue,
  waterPlots,
  saving,
  onCancel,
  onSave,
}: {
  initialValue: AquacultureStock | null
  waterPlots: Plot[]
  saving: boolean
  onCancel: () => void
  onSave: (input: AquacultureStockInput) => void
}) {
  const [plotId, setPlotId] = useState(initialValue?.plot_id ?? waterPlots[0]?.id ?? '')
  const [species, setSpecies] = useState(initialValue?.species ?? '')
  const [productionSystem, setProductionSystem] = useState<ProductionSystem>(
    initialValue?.production_system ?? 'pond',
  )
  const [stockingDate, setStockingDate] = useState(initialValue?.stocking_date ?? todayIso())
  const [quantity, setQuantity] = useState(initialValue ? String(initialValue.quantity_stocked) : '')
  const [unit, setUnit] = useState(initialValue?.stocking_unit ?? 'pieces')
  const [notes, setNotes] = useState(initialValue?.notes ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      plot_id: plotId,
      species: species.trim(),
      production_system: productionSystem,
      stocking_date: stockingDate,
      quantity_stocked: Number(quantity),
      stocking_unit: unit.trim(),
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>{initialValue ? 'Edit Aquaculture Stock' : 'Add Aquaculture Stock'}</h2>

        {waterPlots.length === 0 ? (
          <p className="modal-hint">
            No water plots yet. Add one in Plots first — set its type to "Water" when creating it.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label htmlFor="stock-plot">Pond/Cage/Pen</label>
              <select id="stock-plot" value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
                {waterPlots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label htmlFor="stock-species">Species</label>
              <input
                id="stock-species"
                list="species-suggestions"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="e.g. Tilapia"
                required
              />
              <datalist id="species-suggestions">
                {SPECIES_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="modal-field">
              <label htmlFor="stock-system">Production system</label>
              <select
                id="stock-system"
                value={productionSystem}
                onChange={(e) => setProductionSystem(e.target.value as ProductionSystem)}
              >
                {PRODUCTION_SYSTEMS.map((system) => (
                  <option key={system} value={system}>
                    {system === 'tank_ras' ? 'Tank (RAS)' : system}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field-row">
              <div className="modal-field">
                <label htmlFor="stock-date">Stocking date</label>
                <input
                  id="stock-date"
                  type="date"
                  value={stockingDate}
                  onChange={(e) => setStockingDate(e.target.value)}
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="stock-quantity">Quantity</label>
                <input
                  id="stock-quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="stock-unit">Unit</label>
                <input
                  id="stock-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. pieces, kg"
                  required
                />
              </div>
            </div>

            <div className="modal-field">
              <label htmlFor="stock-notes">Notes (optional)</label>
              <input id="stock-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        )}

        {waterPlots.length === 0 && (
          <div className="modal-actions">
            <button type="button" className="btn-primary" onClick={onCancel}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AquacultureStockFormModal
