import { Link } from 'react-router-dom'
import { Map, Package, Sprout } from 'lucide-react'
import './QuickActionBar.css'

// The three things a farmer actually opens the app to do. Each links straight
// into the existing page with its form already open (?add=1) rather than
// re-implementing the form here — adding a plot needs the boundary map, so it
// can't live in a dashboard modal, and keeping all three consistent means one
// flow per action instead of two that can drift.
const ACTIONS = [
  { to: '/crops?add=1', label: 'Add Crop Cycle', Icon: Sprout },
  { to: '/inputs?add=1', label: 'Add Fertilizer', Icon: Package },
  { to: '/land-plots?add=1', label: 'Add Plot', Icon: Map },
]

function QuickActionBar() {
  return (
    <nav className="quick-action-bar" aria-label="Main actions">
      {ACTIONS.map(({ to, label, Icon }) => (
        <Link key={to} to={to} className="quick-action">
          <Icon size={32} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default QuickActionBar
