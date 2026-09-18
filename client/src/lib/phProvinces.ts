export type PhProvince = {
  name: string
  region: string
  latitude: number
  longitude: number
}

// Representative coordinates (provincial capital or centroid) — good enough
// for weather-forecast resolution, which doesn't meaningfully vary within a
// province. Sorted by region, then name, for a scannable dropdown.
export const PH_PROVINCES: PhProvince[] = [
  { name: 'Metro Manila', region: 'NCR', latitude: 14.5995, longitude: 120.9842 },

  { name: 'Ilocos Norte', region: 'Region I — Ilocos', latitude: 18.1647, longitude: 120.7116 },
  { name: 'Ilocos Sur', region: 'Region I — Ilocos', latitude: 17.5747, longitude: 120.3869 },
  { name: 'La Union', region: 'Region I — Ilocos', latitude: 16.6159, longitude: 120.3209 },
  { name: 'Pangasinan', region: 'Region I — Ilocos', latitude: 15.8949, longitude: 120.2863 },

  { name: 'Batanes', region: 'Region II — Cagayan Valley', latitude: 20.4487, longitude: 121.9702 },
  { name: 'Cagayan', region: 'Region II — Cagayan Valley', latitude: 17.6132, longitude: 121.727 },
  { name: 'Isabela', region: 'Region II — Cagayan Valley', latitude: 16.9754, longitude: 121.8107 },
  { name: 'Nueva Vizcaya', region: 'Region II — Cagayan Valley', latitude: 16.493, longitude: 121.1444 },
  { name: 'Quirino', region: 'Region II — Cagayan Valley', latitude: 16.2333, longitude: 121.5667 },

  { name: 'Aurora', region: 'Region III — Central Luzon', latitude: 15.75, longitude: 121.5667 },
  { name: 'Bataan', region: 'Region III — Central Luzon', latitude: 14.6417, longitude: 120.4818 },
  { name: 'Bulacan', region: 'Region III — Central Luzon', latitude: 14.7943, longitude: 120.8794 },
  { name: 'Nueva Ecija', region: 'Region III — Central Luzon', latitude: 15.5784, longitude: 120.9647 },
  { name: 'Pampanga', region: 'Region III — Central Luzon', latitude: 15.0794, longitude: 120.6197 },
  { name: 'Tarlac', region: 'Region III — Central Luzon', latitude: 15.4755, longitude: 120.596 },
  { name: 'Zambales', region: 'Region III — Central Luzon', latitude: 15.5082, longitude: 120.0691 },

  { name: 'Batangas', region: 'Region IV-A — CALABARZON', latitude: 13.7565, longitude: 121.0583 },
  { name: 'Cavite', region: 'Region IV-A — CALABARZON', latitude: 14.2456, longitude: 120.8785 },
  { name: 'Laguna', region: 'Region IV-A — CALABARZON', latitude: 14.2691, longitude: 121.4113 },
  { name: 'Quezon', region: 'Region IV-A — CALABARZON', latitude: 13.9347, longitude: 121.6169 },
  { name: 'Rizal', region: 'Region IV-A — CALABARZON', latitude: 14.6042, longitude: 121.3035 },

  { name: 'Marinduque', region: 'Region IV-B — MIMAROPA', latitude: 13.4771, longitude: 121.9032 },
  { name: 'Occidental Mindoro', region: 'Region IV-B — MIMAROPA', latitude: 13.1024, longitude: 120.7651 },
  { name: 'Oriental Mindoro', region: 'Region IV-B — MIMAROPA', latitude: 13.1245, longitude: 121.0794 },
  { name: 'Palawan', region: 'Region IV-B — MIMAROPA', latitude: 9.7392, longitude: 118.7353 },
  { name: 'Romblon', region: 'Region IV-B — MIMAROPA', latitude: 12.5778, longitude: 122.2695 },

  { name: 'Albay', region: 'Region V — Bicol', latitude: 13.1391, longitude: 123.7438 },
  { name: 'Camarines Norte', region: 'Region V — Bicol', latitude: 14.1389, longitude: 122.7632 },
  { name: 'Camarines Sur', region: 'Region V — Bicol', latitude: 13.6252, longitude: 123.183 },
  { name: 'Catanduanes', region: 'Region V — Bicol', latitude: 13.7089, longitude: 124.2422 },
  { name: 'Masbate', region: 'Region V — Bicol', latitude: 12.3689, longitude: 123.6152 },
  { name: 'Sorsogon', region: 'Region V — Bicol', latitude: 12.9742, longitude: 124.0058 },

  { name: 'Aklan', region: 'Region VI — Western Visayas', latitude: 11.8166, longitude: 122.0942 },
  { name: 'Antique', region: 'Region VI — Western Visayas', latitude: 10.75, longitude: 122.0 },
  { name: 'Capiz', region: 'Region VI — Western Visayas', latitude: 11.5583, longitude: 122.75 },
  { name: 'Guimaras', region: 'Region VI — Western Visayas', latitude: 10.5931, longitude: 122.6325 },
  { name: 'Iloilo', region: 'Region VI — Western Visayas', latitude: 10.7202, longitude: 122.5621 },
  { name: 'Negros Occidental', region: 'Region VI — Western Visayas', latitude: 10.6407, longitude: 122.9689 },

  { name: 'Bohol', region: 'Region VII — Central Visayas', latitude: 9.85, longitude: 124.1435 },
  { name: 'Cebu', region: 'Region VII — Central Visayas', latitude: 10.3157, longitude: 123.8854 },
  { name: 'Negros Oriental', region: 'Region VII — Central Visayas', latitude: 9.3103, longitude: 123.3041 },
  { name: 'Siquijor', region: 'Region VII — Central Visayas', latitude: 9.2145, longitude: 123.515 },

  { name: 'Biliran', region: 'Region VIII — Eastern Visayas', latitude: 11.5836, longitude: 124.4644 },
  { name: 'Eastern Samar', region: 'Region VIII — Eastern Visayas', latitude: 11.6478, longitude: 125.4972 },
  { name: 'Leyte', region: 'Region VIII — Eastern Visayas', latitude: 11.25, longitude: 124.9667 },
  { name: 'Northern Samar', region: 'Region VIII — Eastern Visayas', latitude: 12.47, longitude: 124.635 },
  { name: 'Samar', region: 'Region VIII — Eastern Visayas', latitude: 11.7833, longitude: 124.9 },
  { name: 'Southern Leyte', region: 'Region VIII — Eastern Visayas', latitude: 10.3833, longitude: 125.0 },

  { name: 'Zamboanga del Norte', region: 'Region IX — Zamboanga Peninsula', latitude: 8.1527, longitude: 123.2577 },
  { name: 'Zamboanga del Sur', region: 'Region IX — Zamboanga Peninsula', latitude: 7.8386, longitude: 123.2966 },
  { name: 'Zamboanga Sibugay', region: 'Region IX — Zamboanga Peninsula', latitude: 7.5222, longitude: 122.8433 },

  { name: 'Bukidnon', region: 'Region X — Northern Mindanao', latitude: 8.15, longitude: 125.1 },
  { name: 'Camiguin', region: 'Region X — Northern Mindanao', latitude: 9.173, longitude: 124.729 },
  { name: 'Lanao del Norte', region: 'Region X — Northern Mindanao', latitude: 8.1167, longitude: 124.2833 },
  { name: 'Misamis Occidental', region: 'Region X — Northern Mindanao', latitude: 8.5083, longitude: 123.85 },
  { name: 'Misamis Oriental', region: 'Region X — Northern Mindanao', latitude: 8.5046, longitude: 124.622 },

  { name: 'Davao de Oro', region: 'Region XI — Davao', latitude: 7.6667, longitude: 126.0833 },
  { name: 'Davao del Norte', region: 'Region XI — Davao', latitude: 7.5619, longitude: 125.655 },
  { name: 'Davao del Sur', region: 'Region XI — Davao', latitude: 6.7656, longitude: 125.3284 },
  { name: 'Davao Occidental', region: 'Region XI — Davao', latitude: 6.1055, longitude: 125.6083 },
  { name: 'Davao Oriental', region: 'Region XI — Davao', latitude: 7.3172, longitude: 126.5419 },

  { name: 'Cotabato', region: 'Region XII — SOCCSKSARGEN', latitude: 7.2167, longitude: 124.25 },
  { name: 'Sarangani', region: 'Region XII — SOCCSKSARGEN', latitude: 5.95, longitude: 125.2 },
  { name: 'South Cotabato', region: 'Region XII — SOCCSKSARGEN', latitude: 6.2969, longitude: 124.8511 },
  { name: 'Sultan Kudarat', region: 'Region XII — SOCCSKSARGEN', latitude: 6.5069, longitude: 124.4331 },

  { name: 'Agusan del Norte', region: 'Region XIII — Caraga', latitude: 8.9472, longitude: 125.5322 },
  { name: 'Agusan del Sur', region: 'Region XIII — Caraga', latitude: 8.65, longitude: 125.9333 },
  { name: 'Dinagat Islands', region: 'Region XIII — Caraga', latitude: 10.1281, longitude: 125.6083 },
  { name: 'Surigao del Norte', region: 'Region XIII — Caraga', latitude: 9.7833, longitude: 125.5 },
  { name: 'Surigao del Sur', region: 'Region XIII — Caraga', latitude: 8.75, longitude: 126.2333 },

  { name: 'Abra', region: 'CAR — Cordillera', latitude: 17.5951, longitude: 120.7983 },
  { name: 'Apayao', region: 'CAR — Cordillera', latitude: 18.0167, longitude: 121.1667 },
  { name: 'Benguet', region: 'CAR — Cordillera', latitude: 16.4023, longitude: 120.596 },
  { name: 'Ifugao', region: 'CAR — Cordillera', latitude: 16.83, longitude: 121.171 },
  { name: 'Kalinga', region: 'CAR — Cordillera', latitude: 17.4766, longitude: 121.3629 },
  { name: 'Mountain Province', region: 'CAR — Cordillera', latitude: 17.0333, longitude: 121.1 },

  { name: 'Basilan', region: 'BARMM', latitude: 6.4297, longitude: 121.97 },
  { name: 'Lanao del Sur', region: 'BARMM', latitude: 7.8232, longitude: 124.4357 },
  { name: 'Maguindanao', region: 'BARMM', latitude: 6.9423, longitude: 124.4198 },
  { name: 'Sulu', region: 'BARMM', latitude: 6.0474, longitude: 121.0024 },
  { name: 'Tawi-Tawi', region: 'BARMM', latitude: 5.1339, longitude: 119.9552 },
]
