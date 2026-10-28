import type { Project } from '@/types/api'

export interface LocatedProject {
  project: Project
  /** 1-based number shown on pins and in the list. */
  number: number
  lat: number
  lng: number
}

export interface RadarPin extends LocatedProject {
  /** 0..1 inside the radar square (x → east, y → south). */
  x: number
  y: number
}

/** Projects with coordinates, numbered in list order. */
export function locatedProjects(projects: Project[]): LocatedProject[] {
  return projects.flatMap((project, index) =>
    project.lat !== null && project.lng !== null ? [{ project, number: index + 1, lat: project.lat, lng: project.lng }] : [],
  )
}

/**
 * Normalises coordinates into the radar square, keeping the aspect ratio and a padding
 * so pins never touch the edge. A single pin sits in the centre.
 */
export function toRadarPins(items: LocatedProject[], padding = 0.14): RadarPin[] {
  if (items.length === 0) return []
  const lats = items.map((i) => i.lat)
  const lngs = items.map((i) => i.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const span = Math.max(maxLat - minLat, maxLng - minLng)
  const centreLat = (minLat + maxLat) / 2
  const centreLng = (minLng + maxLng) / 2
  const usable = 1 - padding * 2

  return items.map((item) => {
    if (span === 0) return { ...item, x: 0.5, y: 0.5 }
    return {
      ...item,
      x: 0.5 + ((item.lng - centreLng) / span) * usable,
      y: 0.5 - ((item.lat - centreLat) / span) * usable,
    }
  })
}

export function formatCoord(value: number): string {
  return value.toFixed(4)
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function googleEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
}
