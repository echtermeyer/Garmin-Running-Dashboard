import { randomUUID } from 'crypto'
import { unlinkSync, existsSync } from 'fs'
import { join } from 'path'

interface Session {
  email: string
  password: string
  csvFile: string
  createdAt: number
}

// Attach to globalThis so the Map survives Next.js hot-module reloads in dev.
// In production a single process instance is used, but this is harmless there too.
declare global {
  // eslint-disable-next-line no-var
  var __sessionStore: Map<string, Session> | undefined
}
const sessions: Map<string, Session> =
  globalThis.__sessionStore ?? (globalThis.__sessionStore = new Map())

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function createSession(email: string, password: string): string {
  const guid = randomUUID()
  const csvFile = `Activities-${guid}.csv`
  sessions.set(guid, { email, password, csvFile, createdAt: Date.now() })
  return guid
}

export function getSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId)
  if (!session) return undefined
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    deleteSession(sessionId)
    return undefined
  }
  return session
}

/** Returns only the CSV filename — never exposes credentials outside this module. */
export function getSessionCsvFile(sessionId: string): string | undefined {
  return getSession(sessionId)?.csvFile
}

export function deleteSession(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (!session) return
  try {
    const csvPath = join(process.cwd(), session.csvFile)
    if (existsSync(csvPath)) unlinkSync(csvPath)
  } catch {
    // ignore cleanup errors
  }
  sessions.delete(sessionId)
}
