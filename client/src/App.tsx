import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { FarmProvider, useFarm } from './lib/FarmContext'
import LoginPage from './features/auth/LoginPage'
import LoadingScreen from './components/LoadingScreen'
import AppLayout from './app/AppLayout'
import ComingSoonPage from './app/ComingSoonPage'
import RequireModule from './app/RequireModule'
import ModuleSelectionPage from './features/onboarding/ModuleSelectionPage'
import DashboardPage from './features/dashboard/DashboardPage'
import LandPlotsPage from './features/landPlots/LandPlotsPage'
import CropsPage from './features/crops/CropsPage'
import InputsPage from './features/inputs/InputsPage'
import LivestockPage from './features/livestock/LivestockPage'
import AquaculturePage from './features/aquaculture/AquaculturePage'
import PerennialsPage from './features/perennials/PerennialsPage'
import FinancialsPage from './features/financials/FinancialsPage'
import SettingsPage from './features/settings/SettingsPage'

function AppShell() {
  const { farm, loading, error } = useFarm()

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return <p style={{ padding: 24 }}>{error}</p>
  }

  if (farm && farm.enabled_modules === null) {
    return <ModuleSelectionPage />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/land-plots" element={<LandPlotsPage />} />
          <Route path="/plots/schematic" element={<ComingSoonPage title="Schematic View" />} />
          <Route
            path="/crops"
            element={
              <RequireModule module="crops">
                <CropsPage />
              </RequireModule>
            }
          />
          <Route
            path="/inputs"
            element={
              <RequireModule module="crops">
                <InputsPage />
              </RequireModule>
            }
          />
          <Route
            path="/livestock"
            element={
              <RequireModule module="livestock">
                <LivestockPage />
              </RequireModule>
            }
          />
          <Route
            path="/aquaculture"
            element={
              <RequireModule module="aquaculture">
                <AquaculturePage />
              </RequireModule>
            }
          />
          <Route
            path="/perennials"
            element={
              <RequireModule module="perennials">
                <PerennialsPage />
              </RequireModule>
            }
          />
          <Route path="/financials" element={<FinancialsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

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
    return <LoadingScreen />
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <FarmProvider>
      <AppShell />
    </FarmProvider>
  )
}

export default App
