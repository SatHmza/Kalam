export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  location: z.string().optional(),
  targetRoles: z.array(z.enum(['admin', 'teacher', 'student', 'parent'])).default([]),
})

export async function GET(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res
  const { schoolId, role } = session!.user

  const events = await db.event.findMany({
    where: {
      schoolId,
      startsAt: { gte: new Date() },
      OR: [{ targetRoles: { isEmpty: true } }, { targetRoles: { has: role as any } }],
    },
    orderBy: { startsAt: 'asc' },
  })
  return ok(events)
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId, id: createdById } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const event = await db.event.create({
    data: {
      ...parsed.data,
      schoolId,
      createdById,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
    },
  })
  return ok(event, 201)
}
