import { NextResponse } from 'next/server'
import { syncGarmin } from '@/lib/garmin-sync'

export async function POST() {
  try {
    const { count } = await syncGarmin()
    return NextResponse.json({ ok: true, output: `Found ${count} running activities.` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
