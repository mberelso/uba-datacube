import { geoMercator, geoPath, type GeoProjection, type GeoPath } from 'd3-geo'

const geoCache = new Map<string, Promise<unknown>>()

/**
 * Lade GeoJSON-Daten mit In-Memory-Caching.
 */
export async function loadGeoJson<T = unknown>(url: string): Promise<T> {
  const cached = geoCache.get(url)
  if (cached) return cached as Promise<T>

  const p = fetch(url).then((r) => {
    if (!r.ok) throw new Error(`GeoJSON fetch failed: ${r.status}`)
    return r.json() as Promise<T>
  })

  p.catch(() => geoCache.delete(url))
  geoCache.set(url, p)
  return p
}

/**
 * Erstelle eine Mercator-Projektion eingepasst auf die Dimensionen [width, height].
 */
export function createGermanyProjection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geojson: any,
  width: number,
  height: number
): GeoProjection {
  return geoMercator().fitSize([width, height], geojson)
}

/**
 * Erstelle einen d3-geoPath Generator für eine Projektion.
 */
export function createGeoPath(projection: GeoProjection): GeoPath {
  return geoPath(projection)
}
