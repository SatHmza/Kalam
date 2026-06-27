export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  body: z.string().min(1),
  bodyAr: z.string().optional(),
  published: z.boolean().default(false),
  pinned: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res
  const { schoolId, role } = session!.user

  const news = await db.news.findMany({
    where: { schoolId, ...(role !== 'admin' ? { published: true } : {}) },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  })
  return ok(news)
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth(['admin'])
  if (res) return res
  const { schoolId, id: createdById } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  const news = await db.news.create({ data: { ...parsed.data, schoolId, createdById } })
  return ok(news, 201)
}
