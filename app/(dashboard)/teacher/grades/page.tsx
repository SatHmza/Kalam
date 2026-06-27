import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import GradeGrid from './GradeGrid'

export default async function TeacherGradesPage({
  searchParams,
}: {
  searchParams: { class?: string; cs?: string; exam?: string; semester?: string }
}) {
  const session = await getServerSession(authOptions)
  const { id: teacherId } = session!.user

  const classSubjects = await db.classSubject.findMany({
    where: { teacherId },
    include: {
      class: { select: { id: true, label: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
  })

  const selectedCs = searchParams.cs
    ? classSubjects.find((cs) => cs.id === searchParams.cs)
    : classSubjects[0]

  let students: { id: string; fullName: string }[] = []
  let existingGrades: Record<string, number | null> = {}

  if (selectedCs) {
    const enrollments = await db.enrollment.findMany({
      where: { classId: selectedCs.classId },
      include: { student: { select: { id: true, fullName: true } } },
      orderBy: { student: { fullName: 'asc' } },
    })
    students = enrollments.map((e) => e.student)

    if (searchParams.exam) {
      const grades = await db.gradeEntry.findMany({
        where: {
          classSubjectId: selectedCs.id,
          examType: searchParams.exam as any,
          semester: searchParams.semester ? Number(searchParams.semester) : undefined,
        },
      })
      existingGrades = Object.fromEntries(grades.map((g) => [g.studentId, g.score]))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saisie des notes</h1>
      <GradeGrid
        classSubjects={classSubjects.map((cs) => ({
          id: cs.id,
          label: `${cs.class.label} — ${cs.subject.name}`,
        }))}
        selectedCsId={selectedCs?.id ?? ''}
        students={students}
        existingGrades={existingGrades}
        examType={searchParams.exam ?? 'devoir1'}
        semester={Number(searchParams.semester ?? 1)}
      />
    </div>
  )
}
