import type { FarmModule } from './farmApi'

export const MODULE_DEFINITIONS: { value: FarmModule; label: string; description: string }[] = [
  {
    value: 'crops',
    label: 'Crop Farming',
    description: 'Crop cycles, plus fertilizer & input tracking',
  },
  {
    value: 'livestock',
    label: 'Livestock & Poultry',
    description: 'Animal groups, feeding, health and production records',
  },
  {
    value: 'aquaculture',
    label: 'Aquaculture',
    description: 'Ponds, cages and pens for fish, shrimp and other aquatic stock',
  },
  {
    value: 'perennials',
    label: 'Perennial & Tree Crops',
    description: 'Long-term plantings like mango, coconut or coffee with periodic harvests',
  },
]

export const MODULE_ROUTES: Record<FarmModule, string[]> = {
  crops: ['/crops', '/inputs'],
  livestock: ['/livestock'],
  aquaculture: ['/aquaculture'],
  perennials: ['/perennials'],
}
