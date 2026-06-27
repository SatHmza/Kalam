export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import ComposeMessage from './ComposeMessage'

export default async function TeacherMessagesPage() {
  const session = await getServerSession(authOptions)
  const { id: teacherId, schoolId } = session!.user

  const [myClasses, sentMessages, receivedMessages] = await Promise.all([
    db.classSubject.findMany({
      where: { teacherId },
      include: { class: { select: { id: true, label: true } } },
      distinct: ['classId'],
    }),
    db.message.findMany({
      where: { senderId: teacherId },
      orderBy: { sentAt: 'desc' },
      take: 20,
      include: {
        targetClass: { select: { label: true } },
        recipient: { select: { fullName: true } },
      },
    }),
    db.message.findMany({
      where: { recipientId: teacherId },
      orderBy: { sentAt: 'desc' },
      take: 20,
      include: { sender: { select: { fullName: true } } },
    }),
  ])

  const classes = Array.from(new Map(myClasses.map((cs) => [cs.classId, { id: cs.classId, label: cs.class.label }])).values())

  const parents = await db.user.findMany({
    where: { schoolId, role: 'parent' },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  })

  const students = await db.user.findMany({
    where: { schoolId, role: 'student' },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>

      <ComposeMessage classes={classes} recipients={[...parents, ...students]} />

      <Tabs defaultValue="sent">
        <TabsList>
          <TabsTrigger value="sent">Envoyés ({sentMessages.length})</TabsTrigger>
          <TabsTrigger value="received">Reçus ({receivedMessages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-2 mt-4">
          {sentMessages.length === 0 && <p className="text-sm text-muted-foreground">Aucun message envoyé.</p>}
          {sentMessages.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{m.subject ?? '(sans objet)'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      À : {m.targetClass ? `Classe ${m.targetClass.label}` : m.recipient?.fullName ?? '—'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.body}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(m.sentAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="received" className="space-y-2 mt-4">
          {receivedMessages.length === 0 && <p className="text-sm text-muted-foreground">Aucun message reçu.</p>}
          {receivedMessages.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{m.subject ?? '(sans objet)'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">De : {m.sender.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.body}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(m.sentAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
