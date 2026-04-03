'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatPace, type Run } from '@/lib/data'

function hrColor(hr: number, hrMin: number, hrMax: number): string {
  const t = hrMax === hrMin ? 0.5 : Math.max(0, Math.min(1, (hr - hrMin) / (hrMax - hrMin)))
  const r = Math.round(16  + t * (244 - 16))
  const g = Math.round(185 + t * (63  - 185))
  const b = Math.round(129 + t * (94  - 129))
  return `rgb(${r},${g},${b})`
}

// Gaussian kernel smoother (Nadaraya-Watson estimator)
// bandwidth controls smoothness — larger = smoother
function kernelSmooth(pts: { x: number; y: number }[], bandwidth: number) {
  return (xq: number) => {
    let wSum = 0, wySum = 0
    for (const { x, y } of pts) {
      const w = Math.exp(-0.5 * ((x - xq) / bandwidth) ** 2)
      wSum += w; wySum += w * y
    }
    return wSum > 0 ? wySum / wSum : 0
  }
}

type ScatterPoint = {
  dateTs: number
  dateStr: string
  paceSec: number
  distance: number
  avgHR: number
  color: string
}

function CustomDot(props: { cx?: number; cy?: number; payload?: ScatterPoint }) {
  const { cx = 0, cy = 0, payload } = props
  if (!payload) return null
  const radius = Math.max(4, Math.min(12, (payload.distance / 25) * 12 + 3.5))
  return (
    <circle cx={cx} cy={cy} r={radius}
      fill={payload.color} fillOpacity={0.85}
      stroke={payload.color} strokeWidth={1} strokeOpacity={0.3}
    />
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ScatterPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d?.paceSec) return null
  const ef = 60000 / (d.paceSec * d.avgHR)
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-md">
      <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-1">{d.dateStr}</p>
      <p className="font-mono text-lg font-bold text-zinc-900">{formatPace(d.paceSec)} /km</p>
      <p className="text-xs text-zinc-500 mt-0.5">{d.avgHR} bpm · {d.distance.toFixed(1)} km</p>
      <p className="text-xs text-zinc-400 mt-0.5">EF {ef.toFixed(3)} m/beat</p>
    </div>
  )
}

function HRLegend({ hrMin, hrMax }: { hrMin: number; hrMax: number }) {
  const steps = 24; const w = 80; const h = 8; const sw = w / steps
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <span className="font-mono">{hrMin} bpm</span>
      <svg width={w} height={h} className="rounded-sm overflow-hidden flex-shrink-0">
        {Array.from({ length: steps }).map((_, i) => (
          <rect key={i} x={i * sw} y={0} width={sw + 0.5} height={h}
            fill={hrColor(hrMin + (i / (steps - 1)) * (hrMax - hrMin), hrMin, hrMax)} />
        ))}
      </svg>
      <span className="font-mono">{hrMax} bpm</span>
    </div>
  )
}

export default function AerobicScatter({ runs }: { runs: Run[] }) {
  const sorted = useMemo(
    () => [...runs].sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
    [runs]
  )

  const hrMin = useMemo(() => Math.min(...sorted.map(r => r.avgHR)), [sorted])
  const hrMax = useMemo(() => Math.max(...sorted.map(r => r.avgHR)), [sorted])

  const scatterData = useMemo<ScatterPoint[]>(() => sorted.map((r) => {
    const d = new Date(r.dateStr + 'T12:00:00')
    return {
      dateTs: d.getTime(),
      dateStr: r.dateStr,
      paceSec: r.paceSec,
      distance: r.distance,
      avgHR: r.avgHR,
      color: hrColor(r.avgHR, hrMin, hrMax),
    }
  }), [sorted, hrMin, hrMax])

  const tsMin = scatterData[0]?.dateTs ?? 0
  const tsMax = scatterData[scatterData.length - 1]?.dateTs ?? 0
  const tsPad = Math.max((tsMax - tsMin) * 0.04, 86400000)

  const paceValues = scatterData.map(d => d.paceSec)
  const paceMin = Math.min(...paceValues) - 20
  const paceMax = Math.max(...paceValues) + 20

  const { efSmoothed, efMin, efMax, trendImproving } = useMemo(() => {
    const n = scatterData.length
    if (n < 2) return { efSmoothed: [] as { ts: number; ef: number }[], efMin: 0.9, efMax: 1.2, trendImproving: null }

    const efValues = scatterData.map(d => 60000 / (d.paceSec * d.avgHR))
    const pts = scatterData.map((d, i) => ({ x: d.dateTs, y: efValues[i] }))

    // Bandwidth = 8% of the time range
    const bandwidth = (tsMax - tsMin) * 0.08
    const smooth = kernelSmooth(pts, bandwidth)

    const STEPS = 40
    const smoothed = Array.from({ length: STEPS + 1 }, (_, i) => {
      const ts = tsMin + (tsMax - tsMin) * (i / STEPS)
      return { ts, ef: smooth(ts) }
    })

    const allEF = [...efValues, ...smoothed.map(p => p.ef)]
    const pad = (Math.max(...allEF) - Math.min(...allEF)) * 0.35 || 0.02

    return {
      efSmoothed: smoothed,
      efMin: Math.min(...allEF) - pad,
      efMax: Math.max(...allEF) + pad,
      trendImproving: smoothed[STEPS].ef > smoothed[0].ef,
    }
  }, [scatterData, tsMin, tsMax])

  const xFmt = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.1 }}
      className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-sm h-full"
    >
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-1">
        Progress
      </p>
      <p className="text-base font-semibold text-zinc-800 mb-1">Pace Over Time</p>
      <p className="text-xs text-zinc-500 mb-5">
        Pace (left) &middot; EF trend (right,{' '}
        <span className="text-zinc-600 font-medium">↑ better</span>
        ) &middot; Color = HR &middot; Size = distance
      </p>

      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 4, right: 8, bottom: 40, left: -4 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.05)" />
          <XAxis
            type="number"
            dataKey="dateTs"
            scale="time"
            domain={[tsMin - tsPad, tsMax + tsPad]}
            tickFormatter={xFmt}
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
            angle={-45}
            textAnchor="end"
            height={48}
            dy={4}
            dx={-2}
          />
          <YAxis
            yAxisId="pace"
            orientation="left"
            type="number"
            dataKey="paceSec"
            domain={[paceMin, paceMax]}
            reversed
            tickFormatter={(v) => formatPace(Math.round(v))}
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <YAxis
            yAxisId="ef"
            orientation="right"
            type="number"
            domain={[efMin, efMax]}
            tickFormatter={(v: number) => v.toFixed(3)}
            tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'var(--font-geist-mono)' }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <ZAxis type="number" dataKey="distance" range={[40, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(0,0,0,0.12)' }} />

          <Scatter
            yAxisId="pace"
            data={scatterData}
            shape={<CustomDot />}
            isAnimationActive
          />

          {/* Smooth EF trend — kernel-smoothed, rendered as consecutive segments */}
          {efSmoothed.slice(1).map((pt, i) => (
            <ReferenceLine
              key={i}
              yAxisId="ef"
              segment={[
                { x: efSmoothed[i].ts, y: efSmoothed[i].ef },
                { x: pt.ts,            y: pt.ef            },
              ]}
              stroke="#94a3b8"
              strokeWidth={2}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-4">
        <HRLegend hrMin={hrMin} hrMax={hrMax} />
        {trendImproving !== null && (
          <p className="text-[10px] text-zinc-500 font-mono">
            EF {trendImproving ? '↑ improving' : '↓ declining'}
          </p>
        )}
      </div>
    </motion.div>
  )
}
