export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.discriminatedUnion('scope', [
  z.object({
    scope: z.literal('broadcast'),
    targetClassId: z.string(),
    subject: z.string().optional(),
    body: z.string().min(1),
  }),
  z.object({
    scope: z.literal('direct'),
    recipientId: z.string(),
    subject: z.string().optional(),
    body: z.string().min(1),
  }),
])

export async function GET(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res
  const { id: userId, role } = session!.user
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'received'

  const messages = await db.message.findMany({
    where: type === 'sent'
      ? { senderId: userId }
      : { OR: [{ recipientId: userId }, { scope: 'broadcast', targetClass: { enrollments: { some: { studentId: userId } } } }] },
    orderBy: { sentAt: 'desc' },
    take: 50,
    include: {
      sender: { select: { fullName: true, role: true } },
      recipient: { select: { fullName: true } },
      targetClass: { select: { label: true } },
      reads: { where: { userId }, select: { readAt: true } },
    },
  })
  return ok(messages)
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res
  const { schoolId, id: senderId, role } = session!.user

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return err('Données invalides')

  // Enforce messaging rules
  if (parsed.data.scope === 'broadcast' && !['teacher', 'admin'].includes(role)) {
    return err('Non autorisé', 403)
  }

  const message = await db.message.create({
    data: { schoolId, senderId, ...parsed.data },
  })

  return ok(message, 201)
}
