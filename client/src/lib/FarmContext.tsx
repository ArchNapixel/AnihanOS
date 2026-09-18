import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getOrCreateDefaultFarm, type Farm, type FarmModule } from '../api/farmApi'

type FarmContextValue = {
  farm: Farm | null
  enabledModules: FarmModule[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const FarmContext = createContext<FarmContextValue | null>(null)

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrCreateDefaultFarm()
      setFarm(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load farm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <FarmContext.Provider value={{ farm, enabledModules: farm?.enabled_modules ?? [], loading, error, refresh: load }}>
      {children}
    </FarmContext.Provider>
  )
}

export function useFarm(): FarmContextValue {
  const context = useContext(FarmContext)
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider')
  }
  return context
}
