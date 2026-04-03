'use client'

import { motion } from 'framer-motion'
import type { Run } from '@/lib/data'

const spring = { type: 'spring' as const, stiffness: 80, damping: 20 }

function isoWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function LineSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const w = 100
  const h = 28
  const max = Math.max(...data)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h * 0.9
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="#059669"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.6}
      />
    </svg>
  )
}

function BarSparkline({ data }: { data: number[] }) {
  if (data.length === 0) return null
  const w = 100
  const h = 28
  const max = Math.max(...data)
  const bw = w / data.length - 1.5
  return (
    <svg width={w} height={h}>
      {data.map((v, i) => {
        const bh = (v / max) * h * 0.9
        return (
          <rect
            key={i}
            x={i * (bw + 1.5)}
            y={h - bh}
            width={bw}
            height={bh}
            fill="#059669"
            rx={1.5}
            opacity={0.5}
          />
        )
      })}
    </svg>
  )
}

interface Props {
  runs: Run[]
  totalDistance: number
}

export default function KpiCards({ runs, totalDistance }: Props) {
  // Sorted oldest → newest (server already sorts, but guard anyway)
  const sorted = [...runs].sort((a, b) => a.dateStr.localeCompare(b.dateStr))

  const cumulativeData = sorted.reduce<number[]>((acc, run) => {
    const prev = acc[acc.length - 1] ?? 0
    return [...acc, prev + run.distance]
  }, [])

  const weekRunCounts = (() => {
    const map = new Map<string, number>()
    for (const run of sorted) {
      const w = isoWeek(run.dateStr)
      const y = new Date(run.dateStr + 'T12:00:00').getFullYear()
      const key = `${y}-${w}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  })()

  const first = sorted[0]?.dateStr ?? ''
  const last = sorted[sorted.length - 1]?.dateStr ?? ''
  const fmtShort = (s: string) => {
    if (!s) return ''
    const d = new Date(s + 'T12:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ ...spring, delay: 0 }}
        className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-sm"
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Total Distance
        </p>
        <p className="font-mono text-5xl font-bold tracking-tight text-zinc-900 tabular-nums leading-none">
          {totalDistance.toFixed(1)}
          <span className="text-xl text-zinc-500 ml-1.5 font-sans font-normal">km</span>
        </p>
        <div className="mt-4">
          <LineSparkline data={cumulativeData} />
        </div>
        <p className="text-xs text-zinc-500 mt-1">cumulative over all runs</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ ...spring, delay: 0.08 }}
        className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-sm"
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Total Runs
        </p>
        <p className="font-mono text-5xl font-bold tracking-tight text-zinc-900 tabular-nums leading-none">
          {sorted.length}
          <span className="text-xl text-zinc-500 ml-1.5 font-sans font-normal">runs</span>
        </p>
        <div className="mt-4">
          <BarSparkline data={weekRunCounts} />
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          {fmtShort(first)} – {fmtShort(last)}
        </p>
      </motion.div>
    </>
  )
}
