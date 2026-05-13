export interface CategoryMeta {
  id: string
  label: string
  color: string
  bg: string
  icon: string
  image?: string
}

// Nordic brand palette:
// Nacht   #1B2B3A  Fjord  #3D5A6E  Arktis #7A9BAD
// Moos    #4A6741  Nebel  #A8B8C0  Stein  #8C8880

export const CATEGORIES: CategoryMeta[] = [
  { id: 'CLIMATE',      label: 'Klima',                color: '#3D5A6E', bg: '#EDF2F5', icon: '🌡️', image: 'https://picsum.photos/seed/190/600/400' },  // aerial clouds at sunset
  { id: 'AIR',          label: 'Luft',                 color: '#7A9BAD', bg: '#EEF4F7', icon: '💨', image: 'https://picsum.photos/seed/45/600/400'  },  // cloud inversion over forest
  { id: 'ENERGY',       label: 'Energie',              color: '#1B2B3A', bg: '#E8ECF0', icon: '⚡', image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80' },  // wind turbines
  { id: 'TRANSPORT',    label: 'Verkehr',              color: '#8C8880', bg: '#F0EEEB', icon: '🚗', image: 'https://picsum.photos/seed/95/600/400'  },  // aerial highway interchange over coast
  { id: 'WATER',        label: 'Wasser',               color: '#3D5A6E', bg: '#E8F0F5', icon: '💧', image: 'https://picsum.photos/seed/1060/600/400' }, // river winding through valley
  { id: 'DAS',          label: 'Wassermonitoring',     color: '#7A9BAD', bg: '#EDF3F6', icon: '🌊', image: 'https://picsum.photos/seed/700/600/400' },  // pier with ocean waves
  { id: 'WASTE',        label: 'Abfall',               color: '#4A6741', bg: '#EBF0EA', icon: '♻️', image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&q=80' }, // aerial ocean plastic debris — dark/moody
  { id: 'AGRICULTURE',  label: 'Landwirtschaft',       color: '#4A6741', bg: '#EDF2EB', icon: '🌿', image: 'https://picsum.photos/seed/35/600/400'  },  // plowed fields vs. green crops
  { id: 'AREA',         label: 'Fläche & Boden',       color: '#8C8880', bg: '#F0EEEB', icon: '🗺️', image: 'https://picsum.photos/seed/1000/600/400' }, // frost-covered agricultural field
  { id: 'ENV',          label: 'Umwelt & Wirtschaft',  color: '#1B2B3A', bg: '#E8ECF0', icon: '📊', image: 'https://picsum.photos/seed/280/600/400' },  // city skyline at sunset
  { id: 'CONSUMPTION',  label: 'Konsum',               color: '#8C8880', bg: '#EEECEA', icon: '🛒', image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80' }, // dark warehouse corridor — cool gray tones
  { id: 'CROSS',        label: 'GHG-Projektionen',     color: '#3D5A6E', bg: '#EDF2F5', icon: '📈', image: 'https://picsum.photos/seed/340/600/400' },  // highway at sunset with traffic
  { id: 'PRTR',         label: 'Schadstoffregister',   color: '#1B2B3A', bg: '#E8ECF0', icon: '🏭', image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&q=80' }, // factory chimneys with smoke
]

export function getCategoryMeta(categoryId: string): CategoryMeta {
  return (
    CATEGORIES.find((c) => c.id === categoryId) ?? {
      id: categoryId,
      label: categoryId,
      color: '#64748b',
      bg: '#f8fafc',
      icon: '📋',
    }
  )
}
