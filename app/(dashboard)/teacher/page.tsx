import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Users, BookOpen, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions)
  const { id: teacherId, schoolId } = session!.user

  const [myClasses, recentAbsences, unreadMessages, upcomingDeadlines] = await Promise.all([
    db.classSubject.findMany({
      where: { teacherId },
      include: {
        class: { select: { label: true, _count: { select: { enrollments: true } } } },
        subject: { select: { name: true } },
      },
      distinct: ['classId'],
    }),
    db.absence.findMany({
      where: { markedById: teacherId },
      orderBy: { markedAt: 'desc' },
      take: 5,
      include: { student: { select: { fullName: true } }, subject: { select: { name: true } } },
    }),
    db.message.count({
      where: {
        schoolId,
        recipientId: teacherId,
        reads: { none: { userId: teacherId } },
      },
    }),
    db.material.findMany({
      where: { createdById: teacherId, deadline: { gte: new Date() } },
      orderBy: { deadline: 'asc' },
      take: 4,
      include: { classSubject: { include: { subject: { select: { name: true } } } } },
    }),
  ])

  const uniqueClasses = Array.from(new Map(myClasses.map((cs) => [cs.classId, cs])).values())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour, {session!.user.fullName.split(' ')[1] ?? session!.user.fullName}</h1>
        <p className="text-sm text-muted-foreground">Voici un résumé de votre activité</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Mes classes', value: uniqueClasses.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Matières enseignées', value: myClasses.length, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Absences marquées', value: recentAbsences.length, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Messages non lus', value: unreadMessages, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-0.5">{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My classes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Mes classes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {uniqueClasses.map((cs) => (
              <div key={cs.classId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{cs.class.label}</p>
                  <p className="text-xs text-muted-foreground">{cs.class._count.enrollments} élèves</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/teacher/grades?class=${cs.classId}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">Notes</Badge>
                  </Link>
                  <Link href={`/teacher/absences?class=${cs.classId}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">Absences</Badge>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming deadlines */}
        <Card>
          <CardHeader><CardTitle className="text-base">Prochaines échéances</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.length === 0 && <p className="text-sm text-muted-foreground">Aucune échéance à venir.</p>}
            {upcomingDeadlines.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.classSubject.subject.name}</p>
                </div>
                {m.deadline && (
                  <span className="text-xs text-amber-600 shrink-0">
                    {formatDate(m.deadline)}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
