import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function getSession() {
  return getServerSession(authOptions)
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession()
  if (!session) return { session: null, res: err('Non authentifié', 401) }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { session: null, res: err('Non autorisé', 403) }
  }
  return { session, res: null }
}
