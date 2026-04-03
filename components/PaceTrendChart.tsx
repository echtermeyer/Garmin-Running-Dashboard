'use client'

import { motion } from 'framer-motion'
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { formatPace, type Run } from '@/lib/data'

function linReg(pts: { x: number; y: number }[]): (x: number) => number {
  const n = pts.length
  if (n < 2) return () => pts[0]?.y ?? 0
  const sx = pts.reduce((a, p) => a + p.x, 0)
  const sy = pts.reduce((a, p) => a + p.y, 0)
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0)
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0)
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  return (x: number) => slope * x + (sy - slope * sx) / n
}

type DataPoint = {
  index: number
  dateLabel: string
  dateStr: string
  paceSec: number
  distance: number
  trend: number
}

function PaceTooltip({ active, payload }: { active?: boolean; payload?: { payload: DataPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-md">
      <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-1">{d.dateStr}</p>
      <p className="font-mono text-xl font-bold text-zinc-900">
        {formatPace(d.paceSec)}
        <span className="text-sm font-normal text-zinc-400 ml-1">/km</span>
      </p>
      <p className="text-xs text-zinc-400 mt-0.5">{d.distance.toFixed(1)} km</p>
    </div>
  )
}

export default function PaceTrendChart({ runs }: { runs: Run[] }) {
  if (runs.length === 0) return null

  const sorted = [...runs].sort((a, b) => a.dateStr.localeCompare(b.dateStr))
  const reg = linReg(sorted.map((r, i) => ({ x: i, y: r.paceSec })))

  const data: DataPoint[] = sorted.map((run, i) => {
    const d = new Date(run.dateStr + 'T12:00:00')
    return {
      index: i,
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateStr: run.dateStr,
      paceSec: run.paceSec,
      distance: run.distance,
      trend: Math.round(reg(i)),
    }
  })

  const paceValues = data.map(d => d.paceSec)
  const pad = 20
  const yDomain = [Math.min(...paceValues) - pad, Math.max(...paceValues) + pad]

  const trendDelta = reg(0) - reg(data.length - 1) // positive = faster over time
  const labelInterval = data.length > 15 ? 3 : data.length > 8 ? 2 : 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.1 }}
      className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-sm h-full"
    >
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-1">
        Pace Trend
      </p>
      <p className="text-base font-semibold text-zinc-800 mb-1">Run Pace Over Time</p>
      <p className="text-xs text-zinc-500 mb-5">avg pace per run &middot; faster &uarr;</p>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 40, left: 4 }}>
          <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            axisLine={false}
            tickLine={false}
            interval={labelInterval - 1}
            angle={-45}
            textAnchor="end"
            height={48}
            dy={4}
            dx={-2}
          />
          <YAxis
            domain={yDomain}
            reversed
            tickFormatter={(v) => formatPace(v)}
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<PaceTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1 }} />

          {/* Actual pace */}
          <Line
            type="monotone"
            dataKey="paceSec"
            stroke="rgba(5,150,105,0.5)"
            strokeWidth={1.5}
            dot={{ fill: '#059669', r: 3.5, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#059669', strokeWidth: 0 }}
            isAnimationActive
          />

          {/* Trend line */}
          <Line
            type="monotone"
            dataKey="trend"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {data.length >= 2 && (
        <p className="text-xs text-zinc-500 mt-3">
          {Math.abs(trendDelta) < 3
            ? 'Trend: pace is stable'
            : trendDelta > 0
            ? `Trend: getting faster · ${Math.round(trendDelta)}s/km improvement`
            : `Trend: slower over period · ${Math.round(Math.abs(trendDelta))}s/km`}
        </p>
      )}
    </motion.div>
  )
}
