export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, gradeColor, formatScore } from '@/lib/utils'
import { Clock, MessageSquare, CalendarDays } from 'lucide-react'

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)
  const { id: studentId, schoolId } = session!.user

  const [recentGrades, absences, upcomingExercises, unreadCount, news, events] = await Promise.all([
    db.gradeEntry.findMany({
      where: { studentId },
      orderBy: { gradedAt: 'desc' },
      take: 5,
      include: { classSubject: { include: { subject: { select: { name: true } } } } },
    }),
    db.absence.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 3,
    }),
    db.material.findMany({
      where: {
        allowsSubmission: true,
        deadline: { gte: new Date() },
        classSubject: { class: { enrollments: { some: { studentId } } } },
      },
      orderBy: { deadline: 'asc' },
      take: 4,
      include: { classSubject: { include: { subject: { select: { name: true } } } } },
    }),
    db.message.count({
      where: { recipientId: studentId, reads: { none: { userId: studentId } } },
    }),
    db.news.findMany({
      where: { schoolId, published: true },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 3,
      select: { id: true, title: true, pinned: true, createdAt: true },
    }),
    db.event.findMany({
      where: {
        schoolId,
        startsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        OR: [{ targetRoles: { isEmpty: true } }, { targetRoles: { has: 'student' } }],
      },
      orderBy: { startsAt: 'asc' },
      take: 5,
    }),
  ])

  const avg = recentGrades.length > 0
    ? recentGrades.filter((g) => g.score !== null).reduce((s, g) => s + g.score!, 0) / recentGrades.filter((g) => g.score !== null).length
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour, {session!.user.fullName.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground">Voici votre espace scolaire</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className={`text-2xl font-bold ${avg ? gradeColor(avg) : ''}`}>{avg ? avg.toFixed(1) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Moyenne récente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-amber-600">{absences.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Absences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className={`text-2xl font-bold ${unreadCount > 0 ? 'text-primary' : ''}`}>{unreadCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Messages</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent grades */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dernières notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentGrades.length === 0 && <p className="text-sm text-muted-foreground">Aucune note disponible.</p>}
            {recentGrades.map((g) => (
              <div key={g.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{g.classSubject.subject.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(g.gradedAt)}</p>
                </div>
                <span className={`font-bold tabular-nums ${g.score !== null ? gradeColor(g.score, g.maxScore) : 'text-muted-foreground'}`}>
                  {formatScore(g.score, g.maxScore)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming exercises */}
        <Card>
          <CardHeader><CardTitle className="text-base">Exercices à rendre</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingExercises.length === 0 && <p className="text-sm text-muted-foreground">Aucun exercice à rendre.</p>}
            {upcomingExercises.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.classSubject.subject.name}</p>
                </div>
                {m.deadline && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDate(m.deadline)}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Événements à venir</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(e.startsAt.toISOString())}{e.location ? ` · ${e.location}` : ''}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* News */}
      {news.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Actualités</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {news.map((n) => (
              <div key={n.id} className="flex items-center gap-3">
                {n.pinned && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                <p className="text-sm">{n.title}</p>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">{formatDate(n.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
