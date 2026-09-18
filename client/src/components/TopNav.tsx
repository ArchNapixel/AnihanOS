import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)

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

      <button
        type="button"
        className="top-nav-menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <nav className={menuOpen ? 'top-nav-links open' : 'top-nav-links'}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMenuOpen(false)}
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
