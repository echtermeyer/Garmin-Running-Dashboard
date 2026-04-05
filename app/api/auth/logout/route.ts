import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/sessions'

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('session')?.value
  if (sessionId) deleteSession(sessionId)

  const res = NextResponse.json({ ok: true })
  res.cookies.delete('session')
  return res
}
