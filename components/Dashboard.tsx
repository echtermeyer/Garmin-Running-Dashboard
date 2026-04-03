'use client'

import { useState, useMemo } from 'react'
import KpiCards from './KpiCards'
import YearHeatmap from './YearHeatmap'
import WeeklyVolumeChart from './WeeklyVolumeChart'
import AerobicScatter from './AerobicScatter'
import HRZoneChart from './HRZoneChart'
import PaceTrendChart from './PaceTrendChart'
import { computeWeeklyVolume, computeMonthlyVolume, computeRunsByDate, type Run } from '@/lib/data'

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

  const handleRangeChange = (year: string) => {
    setFilterYear(year)
    if (year !== 'all') setHeatmapYear(parseInt(year))
  }

  const filteredRuns = useMemo(
    () => (filterYear === 'all' ? allRuns : allRuns.filter((r) => r.dateStr.startsWith(filterYear))),
    [allRuns, filterYear]
  )

  const totalDistance = useMemo(
    () => filteredRuns.reduce((s, r) => s + r.distance, 0),
    [filteredRuns]
  )
  const volumeData = useMemo(
    () => filterYear === 'all'
      ? computeMonthlyVolume(filteredRuns)
      : computeWeeklyVolume(filteredRuns, { fillYear: parseInt(filterYear) }),
    [filteredRuns, filterYear]
  )
  const volumeTitle = filterYear === 'all' ? 'Monthly Volume' : 'Weekly Volume'
  // Heatmap always shows all-time data regardless of filter
  const runsByDate = useMemo(() => computeRunsByDate(allRuns), [allRuns])

  const rangeOptions = [
    ...years.map((y) => ({ value: y, label: y })),
    { value: 'all', label: 'All time' },
  ]

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
