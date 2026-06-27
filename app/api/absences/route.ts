export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  classId: z.string(),
  date: z.string(),
  period: z.string().optional(),
  entries: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['absent', 'late', 'excused']),
    note: z.string().optional(),
  })),
})

export async function GET(req: NextRequest) {
  const { session, res } = await requireAuth(['teacher', 'admin'])
  if (res) return res
  const { schoolId } = session!.user
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('class')
  const date = searchParams.get('date')

  const absences = await db.absence.findMany({
    where: {
      schoolId,
      ...(classId ? { classId } : {}),
      ...(date ? { date: new Date(date) } : {}),
    },
    include: { student: { select: { fullName: true } }, subject: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })
  return ok(absences)
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['teacher', 'admin'])
  if (res) return res
  const { schoolId, id: markedById } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const { classId, date, period, entries } = parsed.data
  const dateObj = new Date(date)

  // Delete existing absences for this class+date then re-insert
  await db.absence.deleteMany({ where: { schoolId, classId, date: dateObj } })

  if (entries.length > 0) {
    await db.absence.createMany({
      data: entries.map((e) => ({
        schoolId,
        studentId: e.studentId,
        classId,
        date: dateObj,
        period,
        status: e.status,
        note: e.note,
        markedById,
      })),
    })
  }

  return ok({ saved: entries.length })
}
