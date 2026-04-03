import Dashboard from '@/components/Dashboard'
import SyncButton from '@/components/SyncButton'
import { getRuns } from '@/lib/parse.server'

export const dynamic = 'force-dynamic'

export default function Page() {
  const allRuns = getRuns()

  const dateRange = (() => {
    if (allRuns.length === 0) return ''
    const fmt = (s: string) =>
      new Date(s + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    return `${fmt(allRuns[0].dateStr)} – ${fmt(allRuns[allRuns.length - 1].dateStr)}`
  })()

  return (
    <main className="min-h-[100dvh] bg-zinc-100">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
            Garmin · Running
          </p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none text-zinc-900 mb-3">
                Your Running
                <br />
                <span className="text-emerald-600">Data.</span>
              </h1>
              {dateRange && (
                <p className="text-zinc-500 text-sm font-medium">{dateRange}</p>
              )}
            </div>
            <div className="pt-1">
              <SyncButton />
            </div>
          </div>
        </div>

        {allRuns.length === 0 ? (
          <div className="rounded-2xl bg-white border border-zinc-200 p-12 text-center">
            <p className="text-zinc-500 text-sm">
              No running activities found. Make sure{' '}
              <span className="font-mono text-zinc-700">Activities.csv</span> is in the project
              root.
            </p>
          </div>
        ) : (
          <Dashboard allRuns={allRuns} />
        )}
      </div>
    </main>
  )
}
