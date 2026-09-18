import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import './AppLayout.css'

function AppLayout() {
  return (
    <div className="app-layout">
      <TopNav />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
