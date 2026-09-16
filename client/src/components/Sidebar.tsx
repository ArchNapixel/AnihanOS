import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import LeafIcon from './LeafIcon'
import './Sidebar.css'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/land-plots', label: 'Land & Plot' },
  { to: '/crops', label: 'Crops' },
  { to: '/inputs', label: 'Inputs' },
  { to: '/livestock', label: 'Livestock' },
]

function Sidebar() {
  const handleLogout = () => {
    supabase.auth.signOut()
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">
          <LeafIcon size={18} />
        </span>
        <span className="sidebar-brand-name">AnihanOS</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        Log out
      </button>
    </aside>
  )
}

export default Sidebar
