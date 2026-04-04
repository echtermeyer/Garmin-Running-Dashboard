import { NextRequest, NextResponse } from 'next/server'
import { syncGarmin } from '@/lib/garmin-sync'
import { getSession } from '@/lib/sessions'

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('session')?.value
  const session = sessionId ? getSession(sessionId) : undefined

  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not logged in.' }, { status: 401 })
  }

  try {
    const { count } = await syncGarmin(session.email, session.password, session.csvFile)
    return NextResponse.json({ ok: true, output: `Found ${count} running activities.` })
  } catch (err: unknown) {
    // Log full error server-side only — never forward raw library errors to the client
    // as garmin-connect exceptions can echo back credentials in their messages.
    console.error('[sync] Error:', err instanceof Error ? err.message : String(err))
    const isAuthError =
      err instanceof Error &&
      /login|auth|credential|password|401|unauthorized/i.test(err.message)
    const clientMsg = isAuthError
      ? 'Authentication failed. Please sign out and sign back in.'
      : 'Sync failed. Check server logs for details.'
    return NextResponse.json({ ok: false, error: clientMsg }, { status: 500 })
  }
}
