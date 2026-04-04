'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-all
        border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
