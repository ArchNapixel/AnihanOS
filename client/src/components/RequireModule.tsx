import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useFarm } from '../lib/FarmContext'
import type { FarmModule } from '../lib/farmApi'

function RequireModule({ module, children }: { module: FarmModule; children: ReactNode }) {
  const { enabledModules } = useFarm()

  if (!enabledModules.includes(module)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default RequireModule
