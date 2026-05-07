export interface CategoryMeta {
  id: string
  label: string
  color: string
  bg: string
  icon: string
  image?: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'CLIMATE',      label: 'Klima',                color: '#dc2626', bg: '#fef2f2', icon: '🌡️', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
  { id: 'AIR',          label: 'Luft',                 color: '#7c3aed', bg: '#f5f3ff', icon: '💨', image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80' },
  { id: 'ENERGY',       label: 'Energie',              color: '#d97706', bg: '#fffbeb', icon: '⚡', image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80' },
  { id: 'TRANSPORT',    label: 'Verkehr',              color: '#0284c7', bg: '#f0f9ff', icon: '🚗', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80' },
  { id: 'WATER',        label: 'Wasser',               color: '#0369a1', bg: '#e0f2fe', icon: '💧', image: 'https://images.unsplash.com/photo-1552461501-ce0961ae9f66?w=600&q=80' },
  { id: 'DAS',          label: 'Wassermonitoring',     color: '#0891b2', bg: '#ecfeff', icon: '🌊', image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80' },
  { id: 'WASTE',        label: 'Abfall',               color: '#65a30d', bg: '#f7fee7', icon: '♻️', image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80' },
  { id: 'AGRICULTURE',  label: 'Landwirtschaft',       color: '#16a34a', bg: '#f0fdf4', icon: '🌿', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80' },
  { id: 'AREA',         label: 'Fläche & Boden',       color: '#92400e', bg: '#fef3c7', icon: '🗺️', image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&q=80' },
  { id: 'ENV',          label: 'Umwelt & Wirtschaft',  color: '#475569', bg: '#f1f5f9', icon: '📊', image: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=600&q=80' },
  { id: 'CONSUMPTION',  label: 'Konsum',               color: '#be185d', bg: '#fdf2f8', icon: '🛒', image: 'https://images.unsplash.com/photo-1604719312566-8fa20f13b199?w=600&q=80' },
  { id: 'CROSS',        label: 'GHG-Projektionen',     color: '#b45309', bg: '#fef3c7', icon: '📈', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80' },
  { id: 'PRTR',         label: 'Schadstoffregister',   color: '#6b21a8', bg: '#faf5ff', icon: '🏭', image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&q=80' },
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
