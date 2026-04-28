export interface CategoryMeta {
  id: string
  label: string
  color: string
  bg: string
  icon: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'CLIMATE',      label: 'Klima',                color: '#dc2626', bg: '#fef2f2', icon: '🌡️' },
  { id: 'AIR',          label: 'Luft',                 color: '#7c3aed', bg: '#f5f3ff', icon: '💨' },
  { id: 'ENERGY',       label: 'Energie',              color: '#d97706', bg: '#fffbeb', icon: '⚡' },
  { id: 'TRANSPORT',    label: 'Verkehr',              color: '#0284c7', bg: '#f0f9ff', icon: '🚗' },
  { id: 'WATER',        label: 'Wasser',               color: '#0369a1', bg: '#e0f2fe', icon: '💧' },
  { id: 'DAS',          label: 'Wassermonitoring',     color: '#0891b2', bg: '#ecfeff', icon: '🌊' },
  { id: 'WASTE',        label: 'Abfall',               color: '#65a30d', bg: '#f7fee7', icon: '♻️' },
  { id: 'AGRICULTURE',  label: 'Landwirtschaft',       color: '#16a34a', bg: '#f0fdf4', icon: '🌿' },
  { id: 'AREA',         label: 'Fläche & Boden',       color: '#92400e', bg: '#fef3c7', icon: '🗺️' },
  { id: 'ENV',          label: 'Umwelt & Wirtschaft',  color: '#475569', bg: '#f1f5f9', icon: '📊' },
  { id: 'CONSUMPTION',  label: 'Konsum',               color: '#be185d', bg: '#fdf2f8', icon: '🛒' },
  { id: 'CROSS',        label: 'GHG-Projektionen',     color: '#b45309', bg: '#fef3c7', icon: '📈' },
  { id: 'PRTR',         label: 'Schadstoffregister',   color: '#6b21a8', bg: '#faf5ff', icon: '🏭' },
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
