import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const patchSchema = z.object({
  published: z.boolean().optional(),
  pinned: z.boolean().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId } = session!.user

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const news = await db.news.findFirst({ where: { id: params.id, schoolId } })
  if (!news) return err('Introuvable', 404)

  const updated = await db.news.update({ where: { id: params.id }, data: parsed.data })
  return ok(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId } = session!.user

  const news = await db.news.findFirst({ where: { id: params.id, schoolId } })
  if (!news) return err('Introuvable', 404)

  await db.news.delete({ where: { id: params.id } })
  return ok({ deleted: true })
}
