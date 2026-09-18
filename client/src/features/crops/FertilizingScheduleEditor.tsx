import { emptyFertilizingRow, type FertilizingStageRow } from '../../domain/fertilizingSchedule'
import './FertilizingScheduleEditor.css'

function FertilizingScheduleEditor({
  rows,
  onChange,
}: {
  rows: FertilizingStageRow[]
  onChange: (rows: FertilizingStageRow[]) => void
}) {
  const updateRow = (index: number, field: keyof FertilizingStageRow, value: string) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const setRangeMode = (index: number, isRange: boolean) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, isRange, endDays: isRange ? row.endDays : '' } : row)))
  }

  const addRow = () => onChange([...rows, emptyFertilizingRow()])

  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index))

  return (
    <div className="modal-field">
      <label>Fertilizing schedule (optional)</label>
      <p className="modal-hint">
        Add each application stage in order, counted in days from planting. Use "Exact day" for a one-time
        application, or "Range" for a stage that spans several days.
      </p>
      {rows.map((row, index) => (
        <div className="fertilizing-stage-row" key={index}>
          <div className="fertilizing-stage-row-top">
            <input
              value={row.name}
              onChange={(e) => updateRow(index, 'name', e.target.value)}
              placeholder="Stage name, e.g. Basal Application"
            />
            <button
              type="button"
              className="stage-row-remove"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1}
            >
              &times;
            </button>
          </div>

          <div className="fertilizing-stage-timing">
            <div className="fertilizing-range-toggle">
              <button
                type="button"
                className={!row.isRange ? 'active' : ''}
                onClick={() => setRangeMode(index, false)}
              >
                Exact day
              </button>
              <button type="button" className={row.isRange ? 'active' : ''} onClick={() => setRangeMode(index, true)}>
                Range
              </button>
            </div>
            <div className="fertilizing-stage-days">
              <input
                type="number"
                min="0"
                value={row.startDays}
                onChange={(e) => updateRow(index, 'startDays', e.target.value)}
                placeholder="Day"
              />
              {row.isRange && (
                <>
                  <span>to</span>
                  <input
                    type="number"
                    min="0"
                    value={row.endDays}
                    onChange={(e) => updateRow(index, 'endDays', e.target.value)}
                    placeholder="Day"
                  />
                </>
              )}
            </div>
          </div>

          <input
            className="fertilizing-stage-nutrients"
            value={row.nutrients}
            onChange={(e) => updateRow(index, 'nutrients', e.target.value)}
            placeholder="Nutrients / fertilizer, e.g. Urea, potassium split"
          />
        </div>
      ))}
      <button type="button" className="modal-cancel" onClick={addRow}>
        + Add stage
      </button>
    </div>
  )
}

export default FertilizingScheduleEditor
