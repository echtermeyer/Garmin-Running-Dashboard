'use client'

import { motion } from 'framer-motion'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TODAY = new Date()
const TODAY_STR = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`

function getDayStyle(km: number | undefined, isToday: boolean, isFuture: boolean): string {
  if (isFuture) return 'bg-zinc-100'
  if (isToday) return km ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-zinc-200 ring-2 ring-zinc-300'
  if (!km) return 'bg-zinc-100 hover:bg-zinc-200'
  if (km < 5)  return 'bg-emerald-100 hover:bg-emerald-200'
  if (km < 10) return 'bg-emerald-300 hover:bg-emerald-400'
  if (km < 15) return 'bg-emerald-400 hover:bg-emerald-500'
  return 'bg-emerald-600 hover:bg-emerald-700'
}

interface Props {
  runsByDate: Record<string, number>
  year: number
  onYearChange: (year: number) => void
}

export default function YearHeatmap({ runsByDate, year, onYearChange }: Props) {
  const currentYear = TODAY.getFullYear()

  const jan1 = new Date(year, 0, 1)
  const startOffset = (jan1.getDay() + 6) % 7
  const startDate = new Date(year, 0, 1 - startOffset)

  const weeks: Array<Array<{ dateStr: string; inYear: boolean; month: number; day: number }>> = []
  const cursor = new Date(startDate)
  for (let w = 0; w < 53; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor)
      const y = date.getFullYear()
      const m = date.getMonth()
      const day = date.getDate()
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      week.push({ dateStr: ds, inYear: y === year, month: m, day })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const monthPositions: { month: string; weekIndex: number }[] = []
  for (let m = 0; m < 12; m++) {
    for (let w = 0; w < weeks.length; w++) {
      if (weeks[w].some((d) => d.inYear && d.month === m && d.day === 1)) {
        monthPositions.push({ month: MONTHS[m], weekIndex: w })
        break
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.04 }}
      className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-base font-semibold text-zinc-800 font-mono">{year}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onYearChange(year - 1)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Previous year"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            onClick={() => onYearChange(year + 1)}
            disabled={year >= currentYear}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next year"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0">
          {/* Day row labels */}
          <div className="flex flex-col gap-[3px] pr-2 pt-[20px]">
            {['Mon', '', 'Wed', '', 'Fri', '', ''].map((label, i) => (
              <div key={i} className="h-[11px] flex items-center">
                <span className="text-[9px] text-zinc-500 w-6 text-right leading-none">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col">
            {/* Month labels */}
            <div className="flex mb-1" style={{ gap: '3px' }}>
              {weeks.map((_, wi) => {
                const mp = monthPositions.find((m) => m.weekIndex === wi)
                return (
                  <div key={wi} className="w-[11px] flex-shrink-0">
                    {mp && (
                      <span className="text-[9px] text-zinc-500 whitespace-nowrap leading-none">{mp.month}</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex" style={{ gap: '3px' }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: '3px' }}>
                  {week.map((day, di) => {
                    if (!day.inYear) {
                      return <div key={di} className="w-[11px] h-[11px] flex-shrink-0" />
                    }
                    const km = runsByDate[day.dateStr]
                    const isToday = day.dateStr === TODAY_STR
                    const isFuture = day.dateStr > TODAY_STR
                    return (
                      <div
                        key={di}
                        className={`w-[11px] h-[11px] rounded-[2px] flex-shrink-0 transition-colors cursor-default ${getDayStyle(km, isToday, isFuture)}`}
                        title={isFuture ? undefined : km ? `${day.dateStr} · ${km.toFixed(1)} km` : day.dateStr}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
