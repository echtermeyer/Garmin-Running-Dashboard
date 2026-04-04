'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [stage, setStage] = useState<'idle' | 'signing-in' | 'syncing'>('idle')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStage('signing-in')
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await loginRes.json()
      if (!loginData.ok) {
        setError(loginData.error ?? 'Login failed.')
        setStage('idle')
        return
      }

      // Auto-sync immediately after login so the dashboard is ready on first load
      setStage('syncing')
      const syncRes = await fetch('/api/sync', { method: 'POST' })
      const syncData = await syncRes.json()
      if (!syncData.ok) {
        setError(syncData.error ?? 'Sync failed. You can retry from the dashboard.')
      }
      router.refresh()
    } catch {
      setError('Network error.')
      setStage('idle')
    }
  }

  const loading = stage !== 'idle'

  return (
    <main className="min-h-[100dvh] bg-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
            Garmin · Running
          </p>
          <h1 className="text-4xl font-bold tracking-tighter text-zinc-900">
            Your Running
            <br />
            <span className="text-emerald-600">Data.</span>
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-700 mb-6">
            Sign in with your Garmin Connect account
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50
                  text-sm text-zinc-900 placeholder-zinc-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                  transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50
                  text-sm text-zinc-900 placeholder-zinc-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                  transition-all"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold
                hover:bg-emerald-700 active:scale-[0.98] transition-all
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stage === 'signing-in' ? 'Signing in…' : stage === 'syncing' ? 'Syncing activities…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Your credentials are only used to sync from Garmin Connect<br />
          and are never stored permanently.
        </p>
      </div>
    </main>
  )
}
