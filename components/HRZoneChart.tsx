'use client'

import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Run } from '@/lib/data'

const ZONES = [
  { key: 'z1', label: 'Z1 Recovery',   maxHR: 125, color: '#bfdbfe' },
  { key: 'z2', label: 'Z2 Base',       maxHR: 145, color: '#6ee7b7' },
  { key: 'z3', label: 'Z3 Aerobic',    maxHR: 160, color: '#fde68a' },
  { key: 'z4', label: 'Z4 Threshold',  maxHR: 175, color: '#fdba74' },
  { key: 'z5', label: 'Z5 Max',        maxHR: Infinity, color: '#fca5a5' },
]

function zoneOf(avgHR: number): number {
  for (let i = 0; i < ZONES.length; i++) {
    if (avgHR < ZONES[i].maxHR) return i
  }
  return ZONES.length - 1
}

type Entry = {
  month: string
  z1: number | null; z2: number | null; z3: number | null
  z4: number | null; z5: number | null
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildData(runs: Run[]): Entry[] {
  if (!runs.length) return []

  const map = new Map<string, Run[]>()
  for (const run of runs) {
    const k = run.dateStr.slice(0, 7)
    const arr = map.get(k) ?? []; arr.push(run); map.set(k, arr)
  }

  const keys = Array.from(map.keys()).sort()
  const [fy, fm] = keys[0].split('-').map(Number)
  const [ly, lm] = keys[keys.length - 1].split('-').map(Number)
  const multiYear = new Set(keys.map(k => k.slice(0, 4))).size > 1

  const result: Entry[] = []
  let y = fy, m = fm
  while (y < ly || (y === ly && m <= lm)) {
    const k = `${y}-${String(m).padStart(2, '0')}`
    const label = multiYear
      ? `${MONTH_NAMES[m - 1]} '${String(y).slice(2)}`
      : MONTH_NAMES[m - 1]
    const monthRuns = map.get(k)

    if (!monthRuns?.length) {
      result.push({ month: label, z1: null, z2: null, z3: null, z4: null, z5: null })
    } else {
      const zonekm = [0, 0, 0, 0, 0]
      let total = 0
      for (const r of monthRuns) {
        zonekm[zoneOf(r.avgHR)] += r.distance
        total += r.distance
      }
      const pcts = zonekm.map(km => Math.round((km / total) * 100))
      const diff = 100 - pcts.reduce((a, b) => a + b, 0)
      pcts[pcts.indexOf(Math.max(...pcts))] += diff
      result.push({ month: label, z1: pcts[0], z2: pcts[1], z3: pcts[2], z4: pcts[3], z5: pcts[4] })
    }
    m++; if (m > 12) { m = 1; y++ }
  }
  return result
}

function ZoneTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: Entry }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.z1 === null) return null
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-md min-w-[160px]">
      <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">{label}</p>
      {[...ZONES].reverse().map((zone) => {
        const v = d[zone.key as keyof Entry] as number | null
        if (!v) return null
        return (
          <div key={zone.key} className="flex items-center gap-2 text-xs mb-0.5">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: zone.color }} />
            <span className="text-zinc-600 flex-1">{zone.label}</span>
            <span className="font-mono font-semibold text-zinc-900">{v}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default function HRZoneChart({ runs }: { runs: Run[] }) {
  const data = buildData(runs)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-sm h-full"
    >
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-1">
        HR Zone Mix
      </p>
      <p className="text-base font-semibold text-zinc-800 mb-1">Monthly Zone Distribution</p>
      <p className="text-xs text-zinc-500 mb-5">
        % of km per zone &middot; Z1 &lt;120 &middot; Z2 120–145 &middot; Z3 145–160 &middot; Z4 160–175 &middot; Z5 &gt;175 bpm
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 40, left: -4 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={48}
            dy={4}
            dx={-2}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ZoneTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }} />
          {ZONES.map((zone) => (
            <Area
              key={zone.key}
              type="monotone"
              dataKey={zone.key}
              stackId="z"
              stroke="none"
              fill={zone.color}
              fillOpacity={1}
              connectNulls={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {ZONES.map((zone) => (
          <div key={zone.key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: zone.color }} />
            <span className="text-[10px] text-zinc-500">{zone.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
