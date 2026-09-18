import { supabase } from './supabaseClient'

export type FarmModule = 'crops' | 'livestock' | 'aquaculture' | 'perennials'

export type Farm = {
  id: string
  name: string
  enabled_modules: FarmModule[] | null
  province: string | null
  latitude: number | null
  longitude: number | null
}

const FARM_COLUMNS = 'id, name, enabled_modules, province, latitude, longitude'

export async function getOrCreateDefaultFarm(): Promise<Farm> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data: existingFarms, error: farmsError } = await supabase
    .from('farms')
    .select(FARM_COLUMNS)
    .eq('owner_id', userData.user.id)
    .limit(1)

  if (farmsError) throw farmsError

  if (existingFarms && existingFarms.length > 0) {
    return existingFarms[0]
  }

  const { data: newFarm, error: createError } = await supabase
    .from('farms')
    .insert({ owner_id: userData.user.id, name: 'My Farm' })
    .select(FARM_COLUMNS)
    .single()

  if (!createError) {
    return newFarm
  }

  // Unique violation on owner_id: a concurrent call (e.g. two pages loading
  // at once) already created this user's farm between our SELECT and this
  // INSERT. Fetch the row it created instead of surfacing an error.
  if (createError.code === '23505') {
    const { data: raceWinnerFarm, error: refetchError } = await supabase
      .from('farms')
      .select(FARM_COLUMNS)
      .eq('owner_id', userData.user.id)
      .limit(1)
      .single()

    if (refetchError) throw refetchError
    return raceWinnerFarm
  }

  throw createError
}

export async function updateFarmModules(farmId: string, modules: FarmModule[]): Promise<Farm> {
  const { data, error } = await supabase
    .from('farms')
    .update({ enabled_modules: modules })
    .eq('id', farmId)
    .select(FARM_COLUMNS)
    .single()

  if (error) throw error
  return data
}

export async function updateFarmLocation(
  farmId: string,
  location: { province: string; latitude: number; longitude: number } | null,
): Promise<Farm> {
  const { data, error } = await supabase
    .from('farms')
    .update(
      location
        ? { province: location.province, latitude: location.latitude, longitude: location.longitude }
        : { province: null, latitude: null, longitude: null },
    )
    .eq('id', farmId)
    .select(FARM_COLUMNS)
    .single()

  if (error) throw error
  return data
}
