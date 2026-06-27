export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import UploadMaterialModal from './UploadMaterialModal'

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: { cs?: string }
}) {
  const session = await getServerSession(authOptions)
  const { id: teacherId } = session!.user

  const classSubjects = await db.classSubject.findMany({
    where: { teacherId },
    include: {
      class: { select: { id: true, label: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { name: 'asc' } }],
  })

  const selectedCsId = searchParams.cs ?? classSubjects[0]?.id ?? null

  const materials = selectedCsId
    ? await db.material.findMany({
        where: { classSubjectId: selectedCsId },
        orderBy: { publishedAt: 'desc' },
        include: { _count: { select: { submissions: true } } },
      })
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cours & Exercices</h1>
        {selectedCsId && (
          <UploadMaterialModal classSubjectId={selectedCsId} />
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {classSubjects.map((cs) => (
          <Link
            key={cs.id}
            href={`/teacher/materials?cs=${cs.id}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              (selectedCsId ?? '') === cs.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-muted-foreground hover:bg-muted'
            }`}
          >
            {cs.class.label} — {cs.subject.name}
          </Link>
        ))}
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Aucun document pour cette classe.
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 items-start">
                    <div className={`p-2 rounded-lg shrink-0 ${m.type === 'exercise' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                      {m.type === 'exercise' ? (
                        <FileText className="h-4 w-4 text-amber-600" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant={m.type === 'exercise' ? 'warning' : 'secondary'}>
                          {m.type === 'course' ? 'Cours' : m.type === 'exercise' ? 'Exercice' : 'Ressource'}
                        </Badge>
                        {m.deadline && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="h-3 w-3" />
                            {formatDate(m.deadline)}
                          </span>
                        )}
                        {m.allowsSubmission && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {m._count.submissions} remise(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {m.fileUrl && (
                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="shrink-0">Voir</Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
