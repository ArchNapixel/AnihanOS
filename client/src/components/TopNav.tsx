import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import LeafIcon from './LeafIcon'
import './TopNav.css'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/land-plots', label: 'Plots' },
  { to: '/crops', label: 'Crops' },
  { to: '/inputs', label: 'Inputs' },
  { to: '/livestock', label: 'Livestock' },
]

function TopNav() {
  const handleLogout = () => {
    supabase.auth.signOut()
  }

  return (
    <header className="top-nav">
      <div className="top-nav-brand">
        <span className="top-nav-brand-icon">
          <LeafIcon size={18} />
        </span>
        <span className="top-nav-brand-name">AnihanOS</span>
      </div>

      <nav className="top-nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="top-nav-logout" onClick={handleLogout}>
        Log out
      </button>
    </header>
  )
}

export default TopNav
