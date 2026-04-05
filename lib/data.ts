export type Run = {
  dateStr: string        // 'YYYY-MM-DD' — serializable, no Date object
  distance: number       // km
  durationSec: number
  avgHR: number
  maxHR: number
  paceSec: number        // sec/km
  bestPaceSec: number
  calories: number
  cadence: number        // spm
  stride: number         // m
  elevation: number | null
  steps: number
  location: string
}

export type WeeklyVolume = {
  weekLabel: string      // e.g. "W04" or "'25 W43" for multi-year
  km: number
  runs: number
  sortKey: string        // "2026-04" for chronological sort
}

export function formatPace(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${String(s).padStart(2, '0')}s`
}

// Returns { isoYear, week } — properly handles year-boundary weeks
function isoYearWeek(dateStr: string): { isoYear: number; week: number } {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { isoYear: d.getFullYear(), week }
}

// Dec 28 is always in the last ISO week of any year
function maxIsoWeek(year: number): number {
  const d = new Date(year, 11, 28)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function computeWeeklyVolume(runs: Run[], options?: { fillYear?: number }): WeeklyVolume[] {
  // Group by ISO year+week
  const map = new Map<string, { km: number; runs: number; isoYear: number; week: number }>()
  for (const run of runs) {
    const { isoYear, week } = isoYearWeek(run.dateStr)
    const key = `${isoYear}-${String(week).padStart(2, '0')}`
    const existing = map.get(key) ?? { km: 0, runs: 0, isoYear, week }
    map.set(key, { km: existing.km + run.distance, runs: existing.runs + 1, isoYear, week })
  }

  const fy = options?.fillYear
  if (map.size === 0 && !fy) return []

  // Determine fill range
  let firstYear: number, firstWeek: number, lastYear: number, lastWeek: number
  if (fy) {
    firstYear = fy; firstWeek = 1
    lastYear  = fy; lastWeek  = maxIsoWeek(fy)
  } else {
    const sortedKeys = Array.from(map.keys()).sort()
    ;[firstYear, firstWeek] = sortedKeys[0].split('-').map(Number)
    ;[lastYear,  lastWeek]  = sortedKeys[sortedKeys.length - 1].split('-').map(Number)
  }

  const years = new Set(Array.from(map.values()).map((v) => v.isoYear))
  if (fy) years.add(fy)
  const multiYear = years.size > 1

  const result: WeeklyVolume[] = []
  let y = firstYear, w = firstWeek
  while (y < lastYear || (y === lastYear && w <= lastWeek)) {
    const key = `${y}-${String(w).padStart(2, '0')}`
    const data = map.get(key) ?? { km: 0, runs: 0, isoYear: y, week: w }
    const weekLabel = multiYear
      ? `'${String(y).slice(2)} W${String(w).padStart(2, '0')}`
      : `W${String(w).padStart(2, '0')}`
    result.push({ weekLabel, km: Math.round(data.km * 10) / 10, runs: data.runs, sortKey: key })
    w++
    if (w > maxIsoWeek(y)) { w = 1; y++ }
  }

  return result
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function computeMonthlyVolume(runs: Run[]): WeeklyVolume[] {
  const map = new Map<string, { km: number; runs: number }>()
  for (const run of runs) {
    const key = run.dateStr.slice(0, 7) // "2024-07"
    const existing = map.get(key) ?? { km: 0, runs: 0 }
    map.set(key, { km: existing.km + run.distance, runs: existing.runs + 1 })
  }

  if (map.size === 0) return []

  const sortedKeys = Array.from(map.keys()).sort()
  const multiYear = new Set(sortedKeys.map((k) => k.slice(0, 4))).size > 1

  const [firstYear, firstMonth] = sortedKeys[0].split('-').map(Number)
  const [lastYear, lastMonth] = sortedKeys[sortedKeys.length - 1].split('-').map(Number)

  const result: WeeklyVolume[] = []
  let y = firstYear, m = firstMonth
  while (y < lastYear || (y === lastYear && m <= lastMonth)) {
    const key = `${y}-${String(m).padStart(2, '0')}`
    const data = map.get(key) ?? { km: 0, runs: 0 }
    const label = multiYear ? `${MONTH_NAMES[m - 1]} '${String(y).slice(2)}` : MONTH_NAMES[m - 1]
    result.push({ weekLabel: label, km: Math.round(data.km * 10) / 10, runs: data.runs, sortKey: key })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return result
}

export function computeCustomRangeVolume(runs: Run[], start: string, end: string): WeeklyVolume[] {
  // Use monthly buckets (same as all-time view)
  return computeMonthlyVolume(runs.filter((r) => r.dateStr >= start && r.dateStr <= end))
}

export function computeRunsByDate(runs: Run[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const run of runs) {
    map[run.dateStr] = (map[run.dateStr] ?? 0) + run.distance
  }
  return map
}
