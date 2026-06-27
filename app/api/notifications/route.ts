import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res
  const { id: userId } = session!.user

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  const unreadCount = notifications.filter((n) => !n.read).length
  return ok({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res
  const { id: userId } = session!.user

  await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
  return ok({ markedRead: true })
}
