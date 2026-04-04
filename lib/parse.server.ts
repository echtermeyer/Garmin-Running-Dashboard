import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import type { Run } from './data'

function parsePace(s: string): number {
  if (!s || s === '--') return 0
  const [m, sec] = s.split(':').map(Number)
  return m * 60 + (sec || 0)
}

function parseDuration(s: string): number {
  if (!s || s === '--') return 0
  const parts = s.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

function parseFloat2(s: string): number {
  if (!s || s === '--') return 0
  return parseFloat(s.replace(/,/g, ''))
}

function parseInt2(s: string): number {
  if (!s || s === '--') return 0
  return parseInt(s.replace(/[,\.]/g, ''), 10) || 0
}

function parseNullableInt(s: string): number | null {
  if (!s || s === '--') return null
  const v = parseInt(s.replace(/,/g, ''), 10)
  return isNaN(v) ? null : v
}

function parseLocation(title: string): string {
  // Extract location from "München Laufen", "Paris Laufen", etc.
  return title.replace(/\s*(Laufen|Radfahren|Schwimmen|Wandern|Gehen).*$/i, '').trim() || title
}

function parseDateStr(datum: string): string {
  // "2026-04-02 17:19:01" → "2026-04-02"
  return datum.split(' ')[0]
}

// Running activity type names in German Garmin exports
const RUNNING_TYPES = new Set(['Laufen', 'Trailrunning', 'Laufband', 'Hindernislauf', 'Ultramarathon'])

export function getRuns(csvFile: string): Run[] {
  try {
    const csvPath = path.join(process.cwd(), csvFile)
    const raw = fs.readFileSync(csvPath, 'utf-8')
    // Strip BOM if present
    const content = raw.replace(/^\uFEFF/, '')

    const result = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    })

    if (result.errors.length > 0) {
      console.warn('CSV parse warnings:', result.errors.slice(0, 3))
    }

    return result.data
      .filter((row) => RUNNING_TYPES.has(row['Aktivitätstyp']?.trim()))
      .map((row): Run => ({
        dateStr: parseDateStr(row['Datum'] ?? ''),
        distance: parseFloat2(row['Distanz'] ?? '0'),
        durationSec: parseDuration(row['Zeit'] ?? '0'),
        avgHR: parseInt2(row['Ø Herzfrequenz'] ?? '0'),
        maxHR: parseInt2(row['Maximale Herzfrequenz'] ?? '0'),
        paceSec: parsePace(row['Ø Pace'] ?? '0:00'),
        bestPaceSec: parsePace(row['Beste Pace'] ?? '0:00'),
        calories: parseInt2(row['Kalorien'] ?? '0'),
        cadence: parseInt2(row['Ø Schrittfrequenz (Laufen)'] ?? '0'),
        stride: parseFloat2(row['Ø Schrittlänge'] ?? '0'),
        elevation: parseNullableInt(row['Anstieg gesamt'] ?? '--'),
        steps: parseInt2(row['Schritte'] ?? '0'),
        location: parseLocation(row['Titel'] ?? ''),
      }))
      .filter((r) => r.dateStr !== '' && r.distance > 0)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
  } catch (err) {
    console.error('Failed to read Activities.csv:', err)
    return []
  }
}
