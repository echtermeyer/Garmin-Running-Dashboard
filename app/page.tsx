import { cookies } from 'next/headers'
import Dashboard from '@/components/Dashboard'
import SyncButton from '@/components/SyncButton'
import LogoutButton from '@/components/LogoutButton'
import LoginPage from '@/components/LoginPage'
import { getRuns } from '@/lib/parse.server'
import { getSessionCsvFile } from '@/lib/sessions'

export const dynamic = 'force-dynamic'

export default function Page() {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('session')?.value
  const csvFile = sessionId ? getSessionCsvFile(sessionId) : undefined

  if (!csvFile) {
    return <LoginPage />
  }

  const allRuns = getRuns(csvFile)

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
            <div className="pt-1 flex items-center gap-3">
              <SyncButton />
              <LogoutButton />
            </div>
          </div>
        </div>

        {allRuns.length === 0 ? (
          <div className="rounded-2xl bg-white border border-zinc-200 p-12 text-center">
            <p className="text-zinc-500 text-sm">
              No running activities found. Click{' '}
              <span className="font-semibold text-zinc-700">Sync Garmin</span> to fetch your data.
            </p>
          </div>
        ) : (
          <Dashboard allRuns={allRuns} />
        )}
      </div>
    </main>
  )
}
