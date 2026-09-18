import { supabase } from './supabaseClient'

export type WeatherDaily = {
  date: string
  temp_min_c: number | null
  temp_max_c: number | null
  precipitation_mm: number | null
  source: 'observed' | 'forecast'
}

export async function listWeatherForFarm(farmId: string): Promise<WeatherDaily[]> {
  const { data, error } = await supabase
    .from('weather_daily')
    .select('date, temp_min_c, temp_max_c, precipitation_mm, source')
    .eq('farm_id', farmId)
    .order('date', { ascending: true })

  if (error) throw error
  return data as WeatherDaily[]
}
