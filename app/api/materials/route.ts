import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  classSubjectId: z.string(),
  type: z.enum(['course', 'exercise', 'resource']),
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSizeKb: z.number().optional(),
  deadline: z.string().optional(),
  allowsSubmission: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res
  const { schoolId, id, role } = session!.user
  const { searchParams } = new URL(req.url)
  const classSubjectId = searchParams.get('cs')

  const materials = await db.material.findMany({
    where: { schoolId, ...(classSubjectId ? { classSubjectId } : {}) },
    orderBy: { publishedAt: 'desc' },
    include: { _count: { select: { submissions: true } } },
  })
  return ok(materials)
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['teacher', 'admin'])
  if (res) return res
  const { schoolId, id: createdById } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const { deadline, ...rest } = parsed.data
  const material = await db.material.create({
    data: {
      ...rest,
      schoolId,
      createdById,
      deadline: deadline ? new Date(deadline) : undefined,
    },
  })
  return ok(material, 201)
}
