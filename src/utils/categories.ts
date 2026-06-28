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

// Bilder selbst-gehostet unter /public/category/ (DSGVO-konform, keine externen
// CDN-Verbindungen / IP-Übertragung an Dritte). Quellen: Lorem Picsum & Unsplash
// (beide erlauben Download & Hosting; einmalig eingefroren am 2026-06-28).
export const CATEGORIES: CategoryMeta[] = [
  { id: 'CLIMATE',      label: 'Klima',                color: '#3D5A6E', bg: '#EDF2F5', icon: '🌡️', image: '/category/climate.jpg' },
  { id: 'AIR',          label: 'Luft',                 color: '#7A9BAD', bg: '#EEF4F7', icon: '💨', image: '/category/air.jpg' },
  { id: 'ENERGY',       label: 'Energie',              color: '#1B2B3A', bg: '#E8ECF0', icon: '⚡', image: '/category/energy.jpg' },
  { id: 'TRANSPORT',    label: 'Verkehr',              color: '#8C8880', bg: '#F0EEEB', icon: '🚗', image: '/category/transport.jpg' },
  { id: 'WATER',        label: 'Wasser',               color: '#3D5A6E', bg: '#E8F0F5', icon: '💧', image: '/category/water.jpg' },
  { id: 'DAS',          label: 'Wassermonitoring',     color: '#7A9BAD', bg: '#EDF3F6', icon: '🌊', image: '/category/das.jpg' },
  { id: 'WASTE',        label: 'Abfall',               color: '#4A6741', bg: '#EBF0EA', icon: '♻️', image: '/category/waste.jpg' },
  { id: 'AGRICULTURE',  label: 'Landwirtschaft',       color: '#4A6741', bg: '#EDF2EB', icon: '🌿', image: '/category/agriculture.jpg' },
  { id: 'AREA',         label: 'Fläche & Boden',       color: '#8C8880', bg: '#F0EEEB', icon: '🗺️', image: '/category/area.jpg' },
  { id: 'ENV',          label: 'Umwelt & Wirtschaft',  color: '#1B2B3A', bg: '#E8ECF0', icon: '📊', image: '/category/env.jpg' },
  { id: 'CONSUMPTION',  label: 'Konsum',               color: '#8C8880', bg: '#EEECEA', icon: '🛒', image: '/category/consumption.jpg' },
  { id: 'CROSS',        label: 'GHG-Projektionen',     color: '#3D5A6E', bg: '#EDF2F5', icon: '📈', image: '/category/cross.jpg' },
  { id: 'PRTR',         label: 'Schadstoffregister',   color: '#1B2B3A', bg: '#E8ECF0', icon: '🏭', image: '/category/prtr.jpg' },
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
