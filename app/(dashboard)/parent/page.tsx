import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatScore, gradeColor, absenceBadgeColor, absenceLabel } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions)
  const { id: parentId, schoolId } = session!.user

  const children = await db.parentChild.findMany({
    where: { parentId },
    include: { student: { select: { id: true, fullName: true } } },
  })

  const studentIds = children.map((c) => c.studentId)

  const [recentGrades, recentAbsences, unreadCount, news] = await Promise.all([
    db.gradeEntry.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { gradedAt: 'desc' },
      take: 6,
      include: {
        student: { select: { fullName: true } },
        classSubject: { include: { subject: { select: { name: true } } } },
      },
    }),
    db.absence.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { date: 'desc' },
      take: 4,
      include: {
        student: { select: { fullName: true } },
        subject: { select: { name: true } },
      },
    }),
    db.message.count({
      where: { recipientId: parentId, reads: { none: { userId: parentId } } },
    }),
    db.news.findMany({
      where: { schoolId, published: true },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour, {session!.user.fullName.split(' ')[1] ?? ''}</h1>
        <p className="text-sm text-muted-foreground">
          Suivi de {children.map((c) => c.student.fullName).join(', ')}
        </p>
      </div>

      {/* Child quick cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {children.map((c) => {
          const grades = recentGrades.filter((g) => g.studentId === c.studentId)
          const absCount = recentAbsences.filter((a) => a.studentId === c.studentId).length
          const avg = grades.length > 0
            ? grades.filter((g) => g.score !== null).reduce((s, g) => s + g.score!, 0) / grades.filter((g) => g.score !== null).length
            : null
          return (
            <Card key={c.studentId}>
              <CardContent className="pt-5">
                <p className="font-semibold">{c.student.fullName}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="text-center">
                    <p className={`text-xl font-bold ${avg !== null ? gradeColor(avg) : 'text-muted-foreground'}`}>
                      {avg !== null ? avg.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Moy. récente</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xl font-bold ${absCount > 0 ? 'text-amber-600' : ''}`}>{absCount}</p>
                    <p className="text-xs text-muted-foreground">Absences</p>
                  </div>
                </div>
                <Link href={`/parent/progress?student=${c.studentId}`} className="mt-3 block">
                  <Button variant="outline" size="sm" className="w-full">
                    Voir le détail <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent grades */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dernières notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentGrades.length === 0 && <p className="text-sm text-muted-foreground">Aucune note disponible.</p>}
            {recentGrades.slice(0, 5).map((g) => (
              <div key={g.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {children.length > 1 && <span className="text-muted-foreground mr-1">[{g.student.fullName.split(' ')[0]}]</span>}
                    {g.classSubject.subject.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(g.gradedAt)}</p>
                </div>
                <span className={`font-bold tabular-nums ${g.score !== null ? gradeColor(g.score, g.maxScore) : 'text-muted-foreground'}`}>
                  {formatScore(g.score, g.maxScore)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent absences */}
        <Card>
          <CardHeader><CardTitle className="text-base">Absences récentes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentAbsences.length === 0 && <p className="text-sm text-muted-foreground">Aucune absence récente.</p>}
            {recentAbsences.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {children.length > 1 && <span className="text-muted-foreground mr-1">[{a.student.fullName.split(' ')[0]}]</span>}
                    {a.subject?.name ?? 'Journée complète'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${absenceBadgeColor(a.status)}`}>
                  {absenceLabel(a.status)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
