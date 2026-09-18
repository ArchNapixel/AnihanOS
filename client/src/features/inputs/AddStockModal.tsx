import { useState, type FormEvent } from 'react'
import type { InputStock } from './inputStockApi'
import '../../styles/modal.css'

function AddStockModal({
  stockItems,
  saving,
  error,
  onCancel,
  onSave,
}: {
  stockItems: InputStock[]
  saving: boolean
  error: string | null
  onCancel: () => void
  onSave: (stock: InputStock, quantityToAdd: number) => void
}) {
  const [stockId, setStockId] = useState(stockItems[0]?.id ?? '')
  const [quantity, setQuantity] = useState('')

  const stock = stockItems.find((s) => s.id === stockId) ?? null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!stock || !quantity) return
    onSave(stock, Number(quantity))
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Add Stock</h2>

        {stockItems.length === 0 ? (
          <>
            <p className="modal-hint">No inputs yet. Add an input first, then use this to restock it.</p>
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={onCancel}>
                Close
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label htmlFor="add-stock-item">Input</label>
              <select id="add-stock-item" value={stockId} onChange={(e) => setStockId(e.target.value)} required>
                {stockItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {stock && (
                <p className="modal-hint">
                  {stock.current_quantity} {stock.unit} currently in stock.
                </p>
              )}
            </div>

            <div className="modal-field">
              <label htmlFor="add-stock-quantity">Quantity to add {stock ? `(${stock.unit})` : ''}</label>
              <input
                id="add-stock-quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              {stock && quantity && Number(quantity) > 0 && (
                <p className="modal-hint">
                  New total: {stock.current_quantity + Number(quantity)} {stock.unit}
                </p>
              )}
            </div>

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving || !stock}>
                {saving ? 'Saving...' : 'Add Stock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AddStockModal
