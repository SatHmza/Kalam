export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  materialId: z.string(),
  fileUrl: z.string(),
  fileSizeKb: z.number().optional(),
})

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['student'])
  if (res) return res
  const { schoolId, id: studentId } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const material = await db.material.findUnique({ where: { id: parsed.data.materialId } })
  if (!material) return err('Document introuvable', 404)

  const isLate = material.deadline ? new Date() > material.deadline : false

  const submission = await db.submission.upsert({
    where: { materialId_studentId: { materialId: parsed.data.materialId, studentId } },
    update: { fileUrl: parsed.data.fileUrl, fileSizeKb: parsed.data.fileSizeKb, submittedAt: new Date(), isLate },
    create: { schoolId, materialId: parsed.data.materialId, studentId, fileUrl: parsed.data.fileUrl, fileSizeKb: parsed.data.fileSizeKb, isLate },
  })

  return ok(submission, 201)
}
