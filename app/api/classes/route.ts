import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  labelAr: z.string().optional(),
  level: z.string().optional(),
  academicYearId: z.string(),
})

export async function GET(_req: NextRequest) {
  const { session, res } = await requireAuth(['admin', 'teacher'])
  if (res) return res
  const { schoolId } = session!.user

  const classes = await db.class.findMany({
    where: { schoolId },
    include: { academicYear: { select: { label: true } }, _count: { select: { enrollments: true } } },
    orderBy: { name: 'asc' },
  })
  return ok(classes)
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const cls = await db.class.create({ data: { ...parsed.data, schoolId } })
  return ok(cls, 201)
}
