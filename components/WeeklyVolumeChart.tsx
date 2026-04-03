'use client'

import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { WeeklyVolume } from '@/lib/data'

interface TooltipPayload {
  weekLabel: string
  km: number
  runs: number
}


function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: TooltipPayload }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-md">
      <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-1">{d.weekLabel}</p>
      <p className="font-mono text-xl font-bold text-zinc-900">{d.km.toFixed(1)} km</p>
      {d.runs > 0 && (
        <p className="text-xs text-zinc-400 mt-0.5">{d.runs} {d.runs === 1 ? 'run' : 'runs'}</p>
      )}
    </div>
  )
}

interface Props {
  data: WeeklyVolume[]
  title?: string
}

export default function WeeklyVolumeChart({ data, title = 'Weekly Volume' }: Props) {
  const maxKm = Math.max(...data.map((d) => d.km), 0)
  const peakWeek = data.find((d) => d.km === maxKm && maxKm > 0)

  // Show every Nth label to avoid crowding when there are many weeks
  const labelInterval = data.length > 30 ? 3 : data.length > 20 ? 2 : 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-sm h-full"
    >
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-1">
        Weekly Volume
      </p>
      <p className="text-base font-semibold text-zinc-800 mb-6">{title}</p>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barCategoryGap={0} barGap={0} margin={{ top: 4, right: 4, bottom: 40, left: -8 }}>
          <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'var(--font-geist-mono)' }}
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
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="km" radius={[2, 2, 0, 0]} isAnimationActive>
            {data.map((entry) => (
              <Cell
                key={entry.sortKey}
                fill={entry.km === 0 ? 'rgba(0,0,0,0.04)' : '#059669'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {peakWeek && (
        <p className="text-xs text-zinc-500 mt-3">
          Peak: {peakWeek.weekLabel} · {peakWeek.km.toFixed(1)} km
        </p>
      )}
    </motion.div>
  )
}
