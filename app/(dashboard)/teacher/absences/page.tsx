import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import AbsenceMarker from './AbsenceMarker'

export default async function TeacherAbsencesPage({
  searchParams,
}: {
  searchParams: { class?: string; date?: string }
}) {
  const session = await getServerSession(authOptions)
  const { id: teacherId } = session!.user

  const myClassSubjects = await db.classSubject.findMany({
    where: { teacherId },
    include: { class: { select: { id: true, label: true } }, subject: { select: { id: true, name: true } } },
    distinct: ['classId'],
  })

  const uniqueClasses = Array.from(
    new Map(myClassSubjects.map((cs) => [cs.classId, { id: cs.classId, label: cs.class.label }])).values()
  )

  const selectedClassId = searchParams.class ?? uniqueClasses[0]?.id ?? null
  const selectedDate = searchParams.date ?? new Date().toISOString().split('T')[0]

  let students: { id: string; fullName: string }[] = []
  let existingAbsences: Record<string, string> = {}

  if (selectedClassId) {
    const [enrollments, absences] = await Promise.all([
      db.enrollment.findMany({
        where: { classId: selectedClassId },
        include: { student: { select: { id: true, fullName: true } } },
        orderBy: { student: { fullName: 'asc' } },
      }),
      db.absence.findMany({
        where: { classId: selectedClassId, date: new Date(selectedDate) },
      }),
    ])
    students = enrollments.map((e) => e.student)
    existingAbsences = Object.fromEntries(absences.map((a) => [a.studentId, a.status]))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saisie des absences</h1>
      <AbsenceMarker
        classes={uniqueClasses}
        selectedClassId={selectedClassId ?? ''}
        selectedDate={selectedDate}
        students={students}
        existingAbsences={existingAbsences}
      />
    </div>
  )
}
