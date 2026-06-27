export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'teacher', 'student', 'parent']),
  langPref: z.enum(['fr', 'ar']).default('fr'),
})

export async function GET(req: NextRequest) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId } = session!.user
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')

  const users = await db.user.findMany({
    where: { schoolId, ...(role ? { role: role as any } : {}) },
    select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  })
  return ok(users)
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const existing = await db.user.findFirst({ where: { schoolId, email: parsed.data.email } })
  if (existing) return err('Email déjà utilisé', 409)

  const hashed = await bcrypt.hash(parsed.data.password, 10)
  const user = await db.user.create({
    data: { ...parsed.data, password: hashed, schoolId },
    select: { id: true, fullName: true, email: true, role: true },
  })
  return ok(user, 201)
}
