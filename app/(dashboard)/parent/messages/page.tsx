export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import ParentComposeMessage from './ParentComposeMessage'

export default async function ParentMessagesPage() {
  const session = await getServerSession(authOptions)
  const { id: parentId, schoolId } = session!.user

  const children = await db.parentChild.findMany({
    where: { parentId },
    include: {
      student: {
        include: {
          enrollments: {
            include: {
              class: {
                include: {
                  classSubjects: {
                    include: { teacher: { select: { id: true, fullName: true } }, subject: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const [receivedMessages, sentMessages] = await Promise.all([
    db.message.findMany({
      where: { recipientId: parentId },
      orderBy: { sentAt: 'desc' },
      take: 20,
      include: { sender: { select: { fullName: true } } },
    }),
    db.message.findMany({
      where: { senderId: parentId },
      orderBy: { sentAt: 'desc' },
      take: 20,
      include: { recipient: { select: { fullName: true } } },
    }),
  ])

  // All teachers of children
  const teachers = Array.from(
    new Map(
      children.flatMap((c) =>
        c.student.enrollments.flatMap((e) =>
          e.class.classSubjects.map((cs) => [
            cs.teacher.id,
            { id: cs.teacher.id, fullName: `${cs.teacher.fullName} (${cs.subject.name})` },
          ])
        )
      )
    ).values()
  )

  // Mark received as read
  const unreadIds = receivedMessages.filter(() => true).map((m) => m.id)
  if (unreadIds.length > 0) {
    await db.messageRead.createMany({
      data: unreadIds.map((messageId) => ({ messageId, userId: parentId })),
      skipDuplicates: true,
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>

      <ParentComposeMessage teachers={teachers} />

      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground">Conversations</h2>
        {[...receivedMessages, ...sentMessages]
          .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
          .slice(0, 20)
          .map((m) => {
            const isSent = 'recipient' in m && m.recipient
            return (
              <Card key={m.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{m.subject ?? '(sans objet)'}</p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {isSent ? 'Envoyé' : 'Reçu'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {isSent
                          ? `À : ${(m as any).recipient?.fullName ?? '—'}`
                          : `De : ${(m as any).sender?.fullName ?? '—'}`}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{m.body}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(m.sentAt)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        {receivedMessages.length === 0 && sentMessages.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun message.</p>
        )}
      </div>
    </div>
  )
}
