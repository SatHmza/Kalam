export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  classSubjectId: z.string(),
  examType: z.string(),
  semester: z.number().optional(),
  examLabel: z.string().optional(),
  coefficient: z.number().default(1),
  maxScore: z.number().default(20),
  entries: z.array(z.object({ studentId: z.string(), score: z.number().nullable() })),
})

export async function GET(req: NextRequest) {
  const { session, res } = await requireAuth(['teacher', 'admin'])
  if (res) return res
  const { schoolId } = session!.user
  const { searchParams } = new URL(req.url)
  const classSubjectId = searchParams.get('cs')

  const grades = await db.gradeEntry.findMany({
    where: { schoolId, ...(classSubjectId ? { classSubjectId } : {}) },
    include: { student: { select: { fullName: true } } },
    orderBy: { gradedAt: 'desc' },
  })
  return ok(grades)
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['teacher', 'admin'])
  if (res) return res
  const { schoolId, id: gradedById } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const { classSubjectId, examType, semester, examLabel, coefficient, maxScore, entries } = parsed.data

  // Upsert each grade
  await Promise.all(
    entries.map((e) =>
      db.gradeEntry.upsert({
        where: {
          id: `grade-${classSubjectId}-${e.studentId}-${examType}-${semester ?? 0}`,
        },
        update: { score: e.score, gradedById, gradedAt: new Date() },
        create: {
          id: `grade-${classSubjectId}-${e.studentId}-${examType}-${semester ?? 0}`,
          schoolId,
          studentId: e.studentId,
          classSubjectId,
          examType: examType as any,
          examLabel,
          score: e.score,
          maxScore,
          coefficient,
          semester,
          gradedById,
        },
      })
    )
  )

  return ok({ saved: entries.length })
}
