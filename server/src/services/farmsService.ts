import type { createUserScopedClient } from '../lib/supabaseUserClient.js'

export async function getFarmPlotsGeoJson(
  supabase: ReturnType<typeof createUserScopedClient>,
  farmId: string,
) {
  const { data, error } = await supabase.rpc('get_farm_plots_geojson', {
    p_farm_id: farmId,
  })
  if (error) throw error
  return data
}
