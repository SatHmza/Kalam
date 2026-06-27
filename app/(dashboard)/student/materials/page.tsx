import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Clock, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import SubmitWorkButton from './SubmitWorkButton'

export default async function StudentMaterialsPage() {
  const session = await getServerSession(authOptions)
  const { id: studentId } = session!.user

  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    include: {
      class: {
        include: {
          classSubjects: {
            include: {
              subject: { select: { name: true } },
              materials: {
                orderBy: { publishedAt: 'desc' },
                include: {
                  submissions: { where: { studentId }, select: { id: true, submittedAt: true, isLate: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  const subjects = enrollments.flatMap((e) =>
    e.class.classSubjects.map((cs) => ({
      name: cs.subject.name,
      materials: cs.materials,
    }))
  )

  const bySubject = subjects.reduce<Record<string, typeof subjects[0]['materials']>>((acc, s) => {
    if (!acc[s.name]) acc[s.name] = []
    acc[s.name].push(...s.materials)
    return acc
  }, {})

  const subjectNames = Object.keys(bySubject)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cours & Exercices</h1>

      {subjectNames.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun document disponible.</p>
      ) : (
        <Tabs defaultValue={subjectNames[0]}>
          <TabsList className="flex-wrap h-auto gap-1">
            {subjectNames.map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs">{s}</TabsTrigger>
            ))}
          </TabsList>

          {subjectNames.map((name) => (
            <TabsContent key={name} value={name} className="mt-4 space-y-3">
              {bySubject[name].map((m) => {
                const submission = m.submissions[0] ?? null
                const isOverdue = m.deadline && new Date() > new Date(m.deadline)
                return (
                  <Card key={m.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 items-start">
                          <div className={`p-2 rounded-lg shrink-0 ${m.type === 'exercise' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                            {m.type === 'exercise'
                              ? <FileText className="h-4 w-4 text-amber-600" />
                              : <BookOpen className="h-4 w-4 text-blue-600" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium">{m.title}</p>
                            {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <Badge variant={m.type === 'exercise' ? 'warning' : 'secondary'}>
                                {m.type === 'course' ? 'Cours' : m.type === 'exercise' ? 'Exercice' : 'Ressource'}
                              </Badge>
                              {m.deadline && (
                                <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive' : 'text-amber-600'}`}>
                                  <Clock className="h-3 w-3" />
                                  {isOverdue ? 'Expiré' : formatDate(m.deadline)}
                                </span>
                              )}
                              {submission && (
                                <span className={`flex items-center gap-1 text-xs ${submission.isLate ? 'text-amber-600' : 'text-green-600'}`}>
                                  <CheckCircle2 className="h-3 w-3" />
                                  {submission.isLate ? 'Remis (retard)' : 'Remis'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.fileUrl && (
                            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                              <button className="text-xs text-primary hover:underline">Télécharger</button>
                            </a>
                          )}
                          {m.allowsSubmission && !submission && (
                            <SubmitWorkButton materialId={m.id} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
