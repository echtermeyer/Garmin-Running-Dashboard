import { writeFileSync } from 'fs'
import { join } from 'path'

const RUNNING_TYPE_KEYS = new Set([
  'running', 'trail_running', 'treadmill_running',
  'obstacle_racing', 'ultra_run', 'virtual_run',
])

function formatPace(metersPerSecond: number): string {
  if (!metersPerSecond || metersPerSecond <= 0) return '--'
  const secPerKm = 1000 / metersPerSecond
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(startTime: number | string): string {
  if (!startTime) return ''
  const d = new Date(startTime)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-') + ' ' + [
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join(':')
}

function escapeCSV(val: unknown): string {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function activityToRow(a: any): string {
  const typeKey = a.activityType?.typeKey ?? ''
  const typeName = typeKey === 'trail_running' ? 'Trailrunning'
    : typeKey === 'treadmill_running' ? 'Laufband' : 'Laufen'
  return [
    typeName,
    formatDate(a.startTimeLocal ?? a.startTimeGMT),
    'false',
    escapeCSV(a.activityName ?? typeName),
    a.distance ? (a.distance / 1000).toFixed(2) : '0.00',
    Math.round(a.calories ?? 0),
    formatDuration(a.duration),
    Math.round(a.averageHR ?? 0) || '--',
    Math.round(a.maxHR ?? 0) || '--',
    a.averageRunningCadenceInStepsPerMinute ? Math.round(a.averageRunningCadenceInStepsPerMinute) : '--',
    a.maxRunningCadenceInStepsPerMinute ? Math.round(a.maxRunningCadenceInStepsPerMinute) : '--',
    formatPace(a.averageSpeed),
    formatPace(a.maxSpeed),
    a.elevationGain != null ? Math.round(a.elevationGain) : '--',
    a.elevationLoss != null ? Math.round(a.elevationLoss) : '--',
    a.avgStrideLength ? Number(a.avgStrideLength).toFixed(2) : '--',
    '--', '--', '--', 'Nein', '--', '--', '--', '--', '--', '--',
  ].join(',')
}

const HEADER = 'Aktivitätstyp,Datum,Favorit,Titel,Distanz,Kalorien,Zeit,Ø Herzfrequenz,Maximale Herzfrequenz,Ø Schrittfrequenz (Laufen),Max. Schrittfrequenz (Laufen),Ø Pace,Beste Pace,Anstieg gesamt,Abstieg gesamt,Ø Schrittlänge,Training Stress Score®,Schritte,Body Battery Abnahme,Dekompression,Beste Rundenzeit,Anzahl der Runden,Zeit in Bewegung,Verstrichene Zeit,Minimale Höhe,Maximale Höhe'

export async function syncGarmin(
  email: string,
  password: string,
  csvFile: string,
): Promise<{ count: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GarminConnect } = require('garmin-connect')
  const client = new GarminConnect({ username: email, password })
  await client.login()

  const allRuns = []
  let start = 0
  while (true) {
    const batch = await client.getActivities(start, 100)
    if (!batch?.length) break
    allRuns.push(...batch.filter((a: { activityType?: { typeKey?: string } }) =>
      RUNNING_TYPE_KEYS.has(a.activityType?.typeKey ?? '')
    ))
    if (batch.length < 100) break
    start += 100
  }

  const csv = [HEADER, ...allRuns.map(activityToRow)].join('\n') + '\n'
  writeFileSync(join(process.cwd(), csvFile), csv, 'utf-8')
  return { count: allRuns.length }
}
