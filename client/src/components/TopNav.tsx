import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useFarm } from '../lib/FarmContext'
import type { FarmModule } from '../lib/farmApi'
import LeafIcon from './LeafIcon'
import './TopNav.css'

const navItems: { to: string; label: string; module?: FarmModule }[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/land-plots', label: 'Plots' },
  { to: '/crops', label: 'Crops', module: 'crops' },
  { to: '/inputs', label: 'Inputs', module: 'crops' },
  { to: '/livestock', label: 'Livestock', module: 'livestock' },
  { to: '/aquaculture', label: 'Aquaculture', module: 'aquaculture' },
  { to: '/perennials', label: 'Perennials', module: 'perennials' },
  { to: '/financials', label: 'Financials' },
  { to: '/settings', label: 'Settings' },
]

function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { enabledModules } = useFarm()

  const visibleNavItems = navItems.filter((item) => !item.module || enabledModules.includes(item.module))

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
        {visibleNavItems.map((item) => (
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
