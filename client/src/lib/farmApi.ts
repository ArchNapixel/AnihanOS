import { supabase } from './supabaseClient'

export type FarmModule = 'crops' | 'livestock' | 'aquaculture' | 'perennials'

export type Farm = {
  id: string
  name: string
  enabled_modules: FarmModule[] | null
}

export async function getOrCreateDefaultFarm(): Promise<Farm> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data: existingFarms, error: farmsError } = await supabase
    .from('farms')
    .select('id, name, enabled_modules')
    .eq('owner_id', userData.user.id)
    .limit(1)

  if (farmsError) throw farmsError

  if (existingFarms && existingFarms.length > 0) {
    return existingFarms[0]
  }

  const { data: newFarm, error: createError } = await supabase
    .from('farms')
    .insert({ owner_id: userData.user.id, name: 'My Farm' })
    .select('id, name, enabled_modules')
    .single()

  if (createError) throw createError

  return newFarm
}

export async function updateFarmModules(farmId: string, modules: FarmModule[]): Promise<Farm> {
  const { data, error } = await supabase
    .from('farms')
    .update({ enabled_modules: modules })
    .eq('id', farmId)
    .select('id, name, enabled_modules')
    .single()

  if (error) throw error
  return data
}
