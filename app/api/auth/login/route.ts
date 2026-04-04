import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/sessions'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email: string = body?.email ?? ''
  const password: string = body?.password ?? ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const sessionId = createSession(email, password)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('session', sessionId, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  return res
}
