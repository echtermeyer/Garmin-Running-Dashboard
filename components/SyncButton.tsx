'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type State = 'idle' | 'loading' | 'done' | 'error'

export default function SyncButton() {
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSync() {
    setState('loading')
    setMessage('')
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setState('done')
        // Extract "Found X running activities" line if present
        const match = data.output?.match(/Found \d+ running activities\./)
        setMessage(match ? match[0] : 'Synced.')
        router.refresh()
      } else {
        setState('error')
        const detail = data.detail ? `\n${data.detail}` : ''
        setMessage((data.error ?? 'Sync failed.') + detail)
      }
    } catch {
      setState('error')
      setMessage('Network error.')
    } finally {
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={state === 'loading'}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-all
          border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className={`w-3.5 h-3.5 ${state === 'loading' ? 'animate-spin' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13.5 2.5A7 7 0 1 1 2.5 8" />
          <polyline points="13.5 2.5 13.5 6.5 9.5 6.5" />
        </svg>
        {state === 'loading' ? 'Syncing…' : 'Sync Garmin'}
      </button>
      {message && (
        <span className={`text-xs font-medium ${state === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
          {message}
        </span>
      )}
    </div>
  )
}
