import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const patchSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
  langPref: z.enum(['fr', 'ar']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId } = session!.user

  const user = await db.user.findFirst({ where: { id: params.id, schoolId } })
  if (!user) return err('Introuvable', 404)

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const { password, ...rest } = parsed.data
  const updated = await db.user.update({
    where: { id: params.id },
    data: { ...rest, ...(password ? { password: await bcrypt.hash(password, 10) } : {}) },
    select: { id: true, fullName: true, email: true, role: true, isActive: true },
  })
  return ok(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId } = session!.user

  const user = await db.user.findFirst({ where: { id: params.id, schoolId } })
  if (!user) return err('Introuvable', 404)

  // Soft delete
  await db.user.update({ where: { id: params.id }, data: { isActive: false } })
  return ok({ deactivated: true })
}
