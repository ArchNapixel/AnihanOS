import { supabase } from './supabaseClient'

export type Farm = {
  id: string
  name: string
}

export async function getOrCreateDefaultFarm(): Promise<Farm> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data: existingFarms, error: farmsError } = await supabase
    .from('farms')
    .select('id, name')
    .eq('owner_id', userData.user.id)
    .limit(1)

  if (farmsError) throw farmsError

  if (existingFarms && existingFarms.length > 0) {
    return existingFarms[0]
  }

  const { data: newFarm, error: createError } = await supabase
    .from('farms')
    .insert({ owner_id: userData.user.id, name: 'My Farm' })
    .select('id, name')
    .single()

  if (createError) throw createError

  return newFarm
}
