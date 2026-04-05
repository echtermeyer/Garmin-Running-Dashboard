'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import KpiCards from './KpiCards'
import YearHeatmap from './YearHeatmap'
import WeeklyVolumeChart from './WeeklyVolumeChart'
import AerobicScatter from './AerobicScatter'
import HRZoneChart from './HRZoneChart'
import PaceTrendChart from './PaceTrendChart'
import { computeWeeklyVolume, computeMonthlyVolume, computeCustomRangeVolume, computeRunsByDate, type Run } from '@/lib/data'

interface Props {
  allRuns: Run[]
}

export default function Dashboard({ allRuns }: Props) {
  // Detect all years present in the data, ascending
  const years = useMemo(() => {
    const ySet = new Set(allRuns.map((r) => r.dateStr.slice(0, 4)))
    return Array.from(ySet).sort()
  }, [allRuns])

  // Default to current year if present, else most recent year
  const currentYear = new Date().getFullYear().toString()
  const defaultRange = useMemo(
    () => (years.includes(currentYear) ? currentYear : years[years.length - 1] ?? 'all'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [filterYear, setFilterYear] = useState<string>(defaultRange)
  // Heatmap year tracks the filter year, but can also be navigated independently
  const [heatmapYear, setHeatmapYear] = useState<number>(
    parseInt(defaultRange) || new Date().getFullYear()
  )

  // Custom date range state
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [appliedCustomStart, setAppliedCustomStart] = useState('')
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    if (!showCustomPicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowCustomPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCustomPicker])

  const handleRangeChange = (year: string) => {
    setFilterYear(year)
    setShowCustomPicker(false)
    if (year !== 'all') setHeatmapYear(parseInt(year))
  }

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) return
    setAppliedCustomStart(customStart)
    setAppliedCustomEnd(customEnd)
    setFilterYear('custom')
    setShowCustomPicker(false)
  }

  const filteredRuns = useMemo(() => {
    if (filterYear === 'all') return allRuns
    if (filterYear === 'custom' && appliedCustomStart && appliedCustomEnd) {
      return allRuns.filter((r) => r.dateStr >= appliedCustomStart && r.dateStr <= appliedCustomEnd)
    }
    return allRuns.filter((r) => r.dateStr.startsWith(filterYear))
  }, [allRuns, filterYear, appliedCustomStart, appliedCustomEnd])

  const totalDistance = useMemo(
    () => filteredRuns.reduce((s, r) => s + r.distance, 0),
    [filteredRuns]
  )
  const volumeData = useMemo(() => {
    if (filterYear === 'all') return computeMonthlyVolume(filteredRuns)
    if (filterYear === 'custom') return computeCustomRangeVolume(filteredRuns, appliedCustomStart, appliedCustomEnd)
    return computeWeeklyVolume(filteredRuns, { fillYear: parseInt(filterYear) })
  }, [filteredRuns, filterYear, appliedCustomStart, appliedCustomEnd])
  const volumeTitle = filterYear === 'all' ? 'Monthly Volume' : filterYear === 'custom' ? 'Volume' : 'Weekly Volume'
  // Heatmap always shows all-time data regardless of filter
  const runsByDate = useMemo(() => computeRunsByDate(allRuns), [allRuns])

  const rangeOptions = [
    ...years.map((y) => ({ value: y, label: y })),
    { value: 'all', label: 'All time' },
  ]

  const customLabel = appliedCustomStart && appliedCustomEnd && filterYear === 'custom'
    ? `${appliedCustomStart} – ${appliedCustomEnd}`
    : 'Custom range'

  return (
    <>
      {/* Date range selector — above KPIs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {rangeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleRangeChange(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterYear === opt.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {/* Custom range button + picker */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowCustomPicker((v) => !v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterYear === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
            }`}
          >
            {customLabel}
          </button>

          {showCustomPicker && (
            <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-zinc-200 rounded-xl shadow-lg p-4 min-w-[280px]">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Custom date range</p>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-500">From</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-500">To</span>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <button
                  onClick={handleApplyCustomRange}
                  disabled={!customStart || !customEnd}
                  className="mt-1 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Single row: [KPI1] [KPI2] [Heatmap] */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {/* KpiCards renders a React fragment with 2 card divs — each becomes 1 grid cell */}
        <KpiCards runs={filteredRuns} totalDistance={totalDistance} />
        <div className="sm:col-span-2 lg:col-span-3">
          <YearHeatmap
            runsByDate={runsByDate}
            year={heatmapYear}
            onYearChange={setHeatmapYear}
          />
        </div>
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <WeeklyVolumeChart data={volumeData} title={volumeTitle} />
        </div>
        <div className="lg:col-span-2">
          <AerobicScatter runs={filteredRuns} />
        </div>
      </section>

      {/* Zone distribution + pace trend row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <HRZoneChart runs={filteredRuns} />
        <PaceTrendChart runs={filteredRuns} />
      </section>
    </>
  )
}
