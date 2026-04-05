export type Zone = {
  key: string
  label: string
  maxHR: number   // upper bound (bpm); last zone should use Infinity
  color: string
}

export const DEFAULT_ZONES: Zone[] = [
  { key: 'z1', label: 'Z1 Recovery',  maxHR: 125,      color: '#bfdbfe' },
  { key: 'z2', label: 'Z2 Base',      maxHR: 145,      color: '#6ee7b7' },
  { key: 'z3', label: 'Z3 Aerobic',   maxHR: 160,      color: '#fde68a' },
  { key: 'z4', label: 'Z4 Threshold', maxHR: 175,      color: '#fdba74' },
  { key: 'z5', label: 'Z5 Max',       maxHR: Infinity, color: '#fca5a5' },
]

const STORAGE_KEY = 'garmin_hr_zones'

export function loadZones(): Zone[] {
  if (typeof window === 'undefined') return DEFAULT_ZONES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ZONES
    const parsed: Zone[] = JSON.parse(raw)
    // Basic validation
    if (!Array.isArray(parsed) || parsed.length < 2) return DEFAULT_ZONES
    return parsed
  } catch {
    return DEFAULT_ZONES
  }
}

export function saveZones(zones: Zone[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones))
}

export function zoneOf(avgHR: number, zones: Zone[]): number {
  for (let i = 0; i < zones.length; i++) {
    if (avgHR < zones[i].maxHR) return i
  }
  return zones.length - 1
}

/** Human-readable threshold string, e.g. "<125", "125–145", ">175" */
export function zoneThresholdLabel(zones: Zone[], index: number): string {
  const zone = zones[index]
  const prev = zones[index - 1]
  const lo = prev ? prev.maxHR : 0
  const hi = zone.maxHR

  if (index === 0) return `<${hi}`
  if (hi === Infinity) return `>${lo}`
  return `${lo}–${hi}`
}
