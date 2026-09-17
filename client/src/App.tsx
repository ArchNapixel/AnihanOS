import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import LoginPage from './features/auth/LoginPage'
import AppLayout from './components/AppLayout'
import ComingSoonPage from './components/ComingSoonPage'
import DashboardPage from './features/dashboard/DashboardPage'
import LandPlotsPage from './features/landPlots/LandPlotsPage'
import CropsPage from './features/crops/CropsPage'
import InputsPage from './features/inputs/InputsPage'
import LivestockPage from './features/livestock/LivestockPage'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) {
    return null
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/land-plots" element={<LandPlotsPage />} />
          <Route path="/plots/schematic" element={<ComingSoonPage title="Schematic View" />} />
          <Route path="/crops" element={<CropsPage />} />
          <Route path="/inputs" element={<InputsPage />} />
          <Route path="/livestock" element={<LivestockPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
