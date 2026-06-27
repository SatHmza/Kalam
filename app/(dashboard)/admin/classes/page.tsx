export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GraduationCap, Users } from 'lucide-react'
import Link from 'next/link'

export default async function ClassesPage() {
  const session = await getServerSession(authOptions)
  const { schoolId } = session!.user

  const [classes, year] = await Promise.all([
    db.class.findMany({
      where: { schoolId, academicYear: { isCurrent: true } },
      include: {
        academicYear: { select: { label: true } },
        _count: { select: { enrollments: true } },
        classSubjects: {
          include: { subject: { select: { name: true } }, teacher: { select: { fullName: true } } },
        },
      },
      orderBy: { name: 'asc' },
    }),
    db.academicYear.findFirst({ where: { schoolId, isCurrent: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Année {year?.label ?? '—'} · {classes.length} classe(s)
          </p>
        </div>
        <Link href="/admin/classes/new">
          <Button size="sm">
            <GraduationCap className="h-4 w-4 mr-2" />
            Ajouter une classe
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {classes.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2">Aucune classe configurée pour cette année.</p>
        )}
        {classes.map((cls) => (
          <Card key={cls.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{cls.label}</CardTitle>
                  {cls.labelAr && <p className="text-xs text-muted-foreground mt-0.5 font-arabic">{cls.labelAr}</p>}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{cls._count.enrollments} élèves</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {cls.classSubjects.map((cs) => (
                <div key={cs.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cs.subject.name}</span>
                  <span className="text-muted-foreground text-xs">{cs.teacher.fullName}</span>
                </div>
              ))}
              {cls.classSubjects.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune matière assignée.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
