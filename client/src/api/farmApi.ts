import { supabase } from '../lib/supabaseClient'

export type Farm = {
  id: string
  name: string
  province: string | null
  latitude: number | null
  longitude: number | null
}

const FARM_COLUMNS = 'id, name, province, latitude, longitude'

// Every farm gets Sugarcane pre-loaded, since it's currently the only crop
// type selectable when adding a cycle (see CropCycleFormModal — "add new
// crop" is hidden for now). Stage timing follows the reference agronomic
// guide's stage sequence, landing on a ~12-month total cycle (the guide
// states 12-18 months; 365 days is used as a representative default and can
// be edited per-farm from the crop cycle form).
const DEFAULT_SUGARCANE_CROP_TYPE = {
  name: 'Sugarcane',
  growth_stages: [
    { name: 'Germination/Sprouting', offset_days: 0 },
    { name: 'Tillering', offset_days: 15 },
    { name: 'Grand Growth', offset_days: 60 },
    { name: 'Ripening', offset_days: 180 },
    { name: 'Ready for Harvest', offset_days: 365 },
  ],
  canopy_closure_days: null as number | null,
  description: null as string | null,
  harvest_estimate_note: null as string | null,
  fertilizing_schedule: [
    { name: 'Basal Application', purpose: '', nutrients: '', offset_days_start: 0, offset_days_end: 1 },
    { name: 'First Dressing', purpose: '', nutrients: '', offset_days_start: 30, offset_days_end: 40 },
    { name: 'Second Dressing', purpose: '', nutrients: '', offset_days_start: 50, offset_days_end: 60 },
    { name: 'Top Dressing', purpose: '', nutrients: '', offset_days_start: 70, offset_days_end: null as number | null },
  ],
}

async function seedDefaultCropTypes(farmId: string): Promise<void> {
  const { error } = await supabase.from('crop_types').insert({ farm_id: farmId, ...DEFAULT_SUGARCANE_CROP_TYPE })
  if (error) {
    console.error('Failed to seed default crop types for new farm', error)
  }
}

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
    await seedDefaultCropTypes(newFarm.id)
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
