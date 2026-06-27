export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatScore, gradeColor, absenceBadgeColor, absenceLabel, examTypeLabel } from '@/lib/utils'

export default async function ParentProgressPage({
  searchParams,
}: {
  searchParams: { student?: string }
}) {
  const session = await getServerSession(authOptions)
  const { id: parentId } = session!.user

  const children = await db.parentChild.findMany({
    where: { parentId },
    include: { student: { select: { id: true, fullName: true } } },
  })

  const studentId = searchParams.student ?? children[0]?.studentId ?? null

  if (!studentId) return <p className="text-muted-foreground">Aucun enfant lié à votre compte.</p>

  const [grades, absences, enrollments] = await Promise.all([
    db.gradeEntry.findMany({
      where: { studentId },
      orderBy: [{ classSubject: { subject: { name: 'asc' } } }, { gradedAt: 'desc' }],
      include: { classSubject: { include: { subject: { select: { name: true } } } } },
    }),
    db.absence.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      include: { subject: { select: { name: true } } },
    }),
    db.enrollment.findMany({
      where: { studentId },
      include: { class: { select: { label: true } } },
    }),
  ])

  const bySubject = grades.reduce<Record<string, typeof grades>>((acc, g) => {
    const key = g.classSubject.subject.name
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  const student = children.find((c) => c.studentId === studentId)?.student

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Suivi scolaire</h1>
        {children.length > 1 && (
          <div className="flex gap-2">
            {children.map((c) => (
              <a
                key={c.studentId}
                href={`/parent/progress?student=${c.studentId}`}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  c.studentId === studentId ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground'
                }`}
              >
                {c.student.fullName}
              </a>
            ))}
          </div>
        )}
      </div>

      {student && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{student.fullName}</span>
          {enrollments.map((e) => ` · ${e.class.label}`)}
        </div>
      )}

      <Tabs defaultValue="grades">
        <TabsList>
          <TabsTrigger value="grades">Notes ({grades.length})</TabsTrigger>
          <TabsTrigger value="absences">Absences ({absences.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="mt-4 space-y-4">
          {Object.entries(bySubject).map(([name, gs]) => {
            const graded = gs.filter((g) => g.score !== null)
            const avg = graded.length
              ? graded.reduce((s, g) => s + (g.score! / g.maxScore) * 20 * g.coefficient, 0) /
                graded.reduce((s, g) => s + g.coefficient, 0)
              : null
            return (
              <Card key={name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{name}</CardTitle>
                    {avg !== null && (
                      <span className={`font-bold ${gradeColor(avg)}`}>{avg.toFixed(2)}/20</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {gs.map((g) => (
                      <div key={g.id} className="flex items-center justify-between px-6 py-2">
                        <div>
                          <p className="text-sm">{examTypeLabel(g.examType)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(g.gradedAt)}</p>
                        </div>
                        <span className={`font-semibold tabular-nums ${g.score !== null ? gradeColor(g.score, g.maxScore) : 'text-muted-foreground'}`}>
                          {formatScore(g.score, g.maxScore)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {grades.length === 0 && <p className="text-sm text-muted-foreground">Aucune note disponible.</p>}
        </TabsContent>

        <TabsContent value="absences" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {absences.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">Aucune absence enregistrée.</div>
              )}
              <div className="divide-y">
                {absences.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{a.subject?.name ?? 'Journée complète'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.date)}{a.period ? ` · ${a.period}` : ''}
                      </p>
                      {a.note && <p className="text-xs text-muted-foreground mt-0.5">{a.note}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${absenceBadgeColor(a.status)}`}>
                      {absenceLabel(a.status)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
