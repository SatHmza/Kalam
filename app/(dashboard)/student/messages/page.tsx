export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default async function StudentMessagesPage() {
  const session = await getServerSession(authOptions)
  const { id: studentId, schoolId } = session!.user

  const messages = await db.message.findMany({
    where: {
      OR: [
        { recipientId: studentId },
        { scope: 'broadcast', targetClass: { enrollments: { some: { studentId } } } },
      ],
    },
    orderBy: { sentAt: 'desc' },
    include: {
      sender: { select: { fullName: true, role: true } },
      targetClass: { select: { label: true } },
      reads: { where: { userId: studentId }, select: { readAt: true } },
    },
  })

  // Mark all as read
  const unreadIds = messages.filter((m) => m.reads.length === 0).map((m) => m.id)
  if (unreadIds.length > 0) {
    await db.messageRead.createMany({
      data: unreadIds.map((messageId) => ({ messageId, userId: studentId })),
      skipDuplicates: true,
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun message reçu.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const isUnread = m.reads.length === 0
            return (
              <Card key={m.id} className={isUnread ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        <p className="text-sm font-medium">{m.subject ?? '(sans objet)'}</p>
                        {m.scope === 'broadcast' && (
                          <Badge variant="secondary" className="text-xs">Classe</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        De : {m.sender.fullName}
                        {m.targetClass && ` · ${m.targetClass.label}`}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{m.body}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(m.sentAt)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
