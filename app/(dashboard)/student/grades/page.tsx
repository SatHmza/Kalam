import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatScore, gradeColor, examTypeLabel } from '@/lib/utils'

export default async function StudentGradesPage() {
  const session = await getServerSession(authOptions)
  const { id: studentId } = session!.user

  const grades = await db.gradeEntry.findMany({
    where: { studentId },
    orderBy: [{ classSubject: { subject: { name: 'asc' } } }, { gradedAt: 'desc' }],
    include: {
      classSubject: {
        include: {
          subject: { select: { name: true } },
          class: { select: { label: true } },
          teacher: { select: { fullName: true } },
        },
      },
    },
  })

  const bySubject = grades.reduce<Record<string, typeof grades>>((acc, g) => {
    const key = g.classSubject.subject.name
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  const subjects = Object.keys(bySubject)

  function subjectAvg(gs: typeof grades) {
    const graded = gs.filter((g) => g.score !== null)
    if (graded.length === 0) return null
    const totalCoef = graded.reduce((s, g) => s + g.coefficient, 0)
    const weighted = graded.reduce((s, g) => s + (g.score! / g.maxScore) * 20 * g.coefficient, 0)
    return weighted / totalCoef
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes notes</h1>

      {subjects.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune note disponible pour le moment.</p>
      ) : (
        <Tabs defaultValue={subjects[0]}>
          <TabsList className="flex-wrap h-auto gap-1">
            {subjects.map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs">{s}</TabsTrigger>
            ))}
          </TabsList>

          {subjects.map((subjectName) => {
            const gs = bySubject[subjectName]
            const avg = subjectAvg(gs)
            return (
              <TabsContent key={subjectName} value={subjectName} className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{subjectName}</CardTitle>
                      {avg !== null && (
                        <div className="text-right">
                          <p className={`text-xl font-bold ${gradeColor(avg)}`}>{avg.toFixed(2)}/20</p>
                          <p className="text-xs text-muted-foreground">Moyenne</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{gs[0].classSubject.teacher.fullName}</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {gs.map((g) => (
                        <div key={g.id} className="flex items-center justify-between px-6 py-3">
                          <div>
                            <p className="text-sm font-medium">{examTypeLabel(g.examType)}</p>
                            {g.examLabel && <p className="text-xs text-muted-foreground">{g.examLabel}</p>}
                            <p className="text-xs text-muted-foreground">{formatDate(g.gradedAt)}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold tabular-nums ${g.score !== null ? gradeColor(g.score, g.maxScore) : 'text-muted-foreground'}`}>
                              {formatScore(g.score, g.maxScore)}
                            </span>
                            {g.coefficient !== 1 && (
                              <p className="text-xs text-muted-foreground">Coef. {g.coefficient}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}
