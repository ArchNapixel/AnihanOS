import type { FarmModule } from '../lib/farmApi'
import { MODULE_DEFINITIONS } from '../lib/farmModules'
import './ModulePicker.css'

function ModulePicker({
  selected,
  onChange,
}: {
  selected: FarmModule[]
  onChange: (modules: FarmModule[]) => void
}) {
  const toggle = (module: FarmModule) => {
    if (selected.includes(module)) {
      onChange(selected.filter((m) => m !== module))
    } else {
      onChange([...selected, module])
    }
  }

  return (
    <div className="module-picker">
      {MODULE_DEFINITIONS.map((module) => (
        <label key={module.value} className="module-picker-option">
          <input
            type="checkbox"
            checked={selected.includes(module.value)}
            onChange={() => toggle(module.value)}
          />
          <span className="module-picker-text">
            <strong>{module.label}</strong>
            <span>{module.description}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

export default ModulePicker
