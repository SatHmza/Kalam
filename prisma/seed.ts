import { PrismaClient, UserRole, ExamType, AbsenceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── School ──────────────────────────────────────────────────────────────────
  const school = await db.school.upsert({
    where: { slug: 'amal-casa' },
    update: {},
    create: {
      name: 'Lycée Al Amal',
      nameAr: 'ثانوية الأمل',
      slug: 'amal-casa',
      city: 'Casablanca',
      primaryColor: '#1d4ed8',
    },
  })

  // ── Academic year ────────────────────────────────────────────────────────────
  const year = await db.academicYear.upsert({
    where: { id: 'ay-2025-2026' },
    update: {},
    create: {
      id: 'ay-2025-2026',
      schoolId: school.id,
      label: '2025-2026',
      isCurrent: true,
      startsOn: new Date('2025-09-01'),
      endsOn: new Date('2026-06-30'),
    },
  })

  // ── Subjects ─────────────────────────────────────────────────────────────────
  const subjectData = [
    { name: 'Mathématiques', nameAr: 'الرياضيات', code: 'MATH' },
    { name: 'Physique-Chimie', nameAr: 'الفيزياء والكيمياء', code: 'PHY' },
    { name: 'SVT', nameAr: 'علوم الحياة والأرض', code: 'SVT' },
    { name: 'Français', nameAr: 'اللغة الفرنسية', code: 'FR' },
    { name: 'Anglais', nameAr: 'اللغة الإنجليزية', code: 'EN' },
    { name: 'Informatique', nameAr: 'الإعلاميات', code: 'INFO' },
  ]
  const subjects = await Promise.all(
    subjectData.map((s) =>
      db.subject.upsert({
        where: { id: `sub-${s.code.toLowerCase()}-${school.id}` },
        update: {},
        create: { id: `sub-${s.code.toLowerCase()}-${school.id}`, schoolId: school.id, ...s },
      })
    )
  )
  const [sMath, sPhy, sSvt, sFr, sEn, sInfo] = subjects

  // ── Admin ────────────────────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('admin123', 10)
  const admin = await db.user.upsert({
    where: { id: 'user-admin-1' },
    update: {},
    create: {
      id: 'user-admin-1',
      schoolId: school.id,
      role: UserRole.admin,
      fullName: 'Directeur Karim',
      fullNameAr: 'المدير كريم',
      email: 'admin@amal.school',
      password: adminPwd,
    },
  })

  // ── Teachers ─────────────────────────────────────────────────────────────────
  const teacherPwd = await bcrypt.hash('teacher123', 10)
  const teacherData = [
    { id: 'user-t1', fullName: 'M. Benali (Maths)', email: 'maths@amal.school' },
    { id: 'user-t2', fullName: 'Mme. Tahiri (Physique)', email: 'phy@amal.school' },
    { id: 'user-t3', fullName: 'M. Alaoui (Français)', email: 'fr@amal.school' },
  ]
  const [t1, t2, t3] = await Promise.all(
    teacherData.map((t) =>
      db.user.upsert({
        where: { id: t.id },
        update: {},
        create: { ...t, schoolId: school.id, role: UserRole.teacher, password: teacherPwd },
      })
    )
  )

  // ── Students ─────────────────────────────────────────────────────────────────
  const studentPwd = await bcrypt.hash('student123', 10)
  const studentNames = [
    'Imane Bensaid', 'Youssef Lahlou', 'Sara Moussaoui', 'Anas Tazi',
    'Nadia Bennani', 'Omar Filali', 'Rania Chraibi', 'Mehdi Berrada',
    'Yasmine Kettani', 'Karim Sekkat',
  ]
  const students = await Promise.all(
    studentNames.map((name, i) =>
      db.user.upsert({
        where: { id: `user-s${i + 1}` },
        update: {},
        create: {
          id: `user-s${i + 1}`,
          schoolId: school.id,
          role: UserRole.student,
          fullName: name,
          email: `s${i + 1}@amal.school`,
          password: studentPwd,
        },
      })
    )
  )

  // ── Parents ───────────────────────────────────────────────────────────────────
  const parentPwd = await bcrypt.hash('parent123', 10)
  const parentData = [
    { id: 'user-p1', fullName: 'M. Bensaid (père)', email: 'p1@amal.school' },
    { id: 'user-p2', fullName: 'Mme. Lahlou (mère)', email: 'p2@amal.school' },
    { id: 'user-p3', fullName: 'M. Moussaoui (père)', email: 'p3@amal.school' },
    { id: 'user-p4', fullName: 'Mme. Tazi (mère)', email: 'p4@amal.school' },
    { id: 'user-p5', fullName: 'M. Bennani (père)', email: 'p5@amal.school' },
  ]
  const parents = await Promise.all(
    parentData.map((p) =>
      db.user.upsert({
        where: { id: p.id },
        update: {},
        create: { ...p, schoolId: school.id, role: UserRole.parent, password: parentPwd },
      })
    )
  )

  // Link parents to students
  for (let i = 0; i < parents.length; i++) {
    await db.parentChild.upsert({
      where: { parentId_studentId: { parentId: parents[i].id, studentId: students[i].id } },
      update: {},
      create: { parentId: parents[i].id, studentId: students[i].id, relation: 'parent' },
    })
  }

  // ── Classes ───────────────────────────────────────────────────────────────────
  const classA = await db.class.upsert({
    where: { id: 'cls-ta-a' },
    update: {},
    create: {
      id: 'cls-ta-a',
      schoolId: school.id,
      academicYearId: year.id,
      name: 'Tle Bac Sc A',
      label: 'Terminale Bac Sciences — Groupe A',
      labelAr: 'الثانية باكالوريا علوم - المجموعة أ',
      level: 'lycee',
    },
  })

  const classB = await db.class.upsert({
    where: { id: 'cls-1a-b' },
    update: {},
    create: {
      id: 'cls-1a-b',
      schoolId: school.id,
      academicYearId: year.id,
      name: '1ère Bac Sc B',
      label: '1ère Bac Sciences — Groupe B',
      labelAr: 'الأولى باكالوريا علوم - المجموعة ب',
      level: 'lycee',
    },
  })

  // ── Class-Subject assignments ─────────────────────────────────────────────────
  const csData = [
    { id: 'cs-math-a', classId: classA.id, subjectId: sMath.id, teacherId: t1.id },
    { id: 'cs-phy-a',  classId: classA.id, subjectId: sPhy.id,  teacherId: t2.id },
    { id: 'cs-svt-a',  classId: classA.id, subjectId: sSvt.id,  teacherId: t2.id },
    { id: 'cs-fr-a',   classId: classA.id, subjectId: sFr.id,   teacherId: t3.id },
    { id: 'cs-en-a',   classId: classA.id, subjectId: sEn.id,   teacherId: t3.id },
    { id: 'cs-math-b', classId: classB.id, subjectId: sMath.id, teacherId: t1.id },
    { id: 'cs-info-b', classId: classB.id, subjectId: sInfo.id, teacherId: t1.id },
    { id: 'cs-fr-b',   classId: classB.id, subjectId: sFr.id,   teacherId: t3.id },
  ]
  const classSubjects = await Promise.all(
    csData.map((cs) =>
      db.classSubject.upsert({
        where: { id: cs.id },
        update: {},
        create: cs,
      })
    )
  )
  const [csMathA, csPhyA, , csFrA, , csMathB] = classSubjects

  // ── Enrollments ───────────────────────────────────────────────────────────────
  await Promise.all([
    ...students.slice(0, 6).map((s) =>
      db.enrollment.upsert({
        where: { studentId_classId: { studentId: s.id, classId: classA.id } },
        update: {},
        create: { studentId: s.id, classId: classA.id },
      })
    ),
    ...students.slice(4).map((s) =>
      db.enrollment.upsert({
        where: { studentId_classId: { studentId: s.id, classId: classB.id } },
        update: {},
        create: { studentId: s.id, classId: classB.id },
      })
    ),
  ])

  // ── Grades ────────────────────────────────────────────────────────────────────
  const gradeData = [14, 16, 12, 18, 15, 11].map((score, i) => ({
    schoolId: school.id,
    studentId: students[i].id,
    classSubjectId: csMathA.id,
    examType: ExamType.devoir1,
    score,
    maxScore: 20,
    coefficient: 2,
    semester: 1,
    gradedById: t1.id,
  }))

  const gradeDataPhy = [13, 17, 10, 15, 16, 9].map((score, i) => ({
    schoolId: school.id,
    studentId: students[i].id,
    classSubjectId: csPhyA.id,
    examType: ExamType.devoir1,
    score,
    maxScore: 20,
    coefficient: 2,
    semester: 1,
    gradedById: t2.id,
  }))

  await db.gradeEntry.createMany({
    data: [...gradeData, ...gradeDataPhy],
    skipDuplicates: true,
  })

  // ── Absences ──────────────────────────────────────────────────────────────────
  await db.absence.createMany({
    data: [
      {
        schoolId: school.id,
        studentId: students[1].id,
        classId: classA.id,
        subjectId: sMath.id,
        date: new Date('2026-06-10'),
        period: '8h-10h',
        status: AbsenceStatus.absent,
        markedById: t1.id,
      },
      {
        schoolId: school.id,
        studentId: students[3].id,
        classId: classA.id,
        date: new Date('2026-06-12'),
        period: 'Journée complète',
        status: AbsenceStatus.excused,
        note: 'Certificat médical',
        markedById: admin.id,
      },
    ],
    skipDuplicates: true,
  })

  // ── Materials ─────────────────────────────────────────────────────────────────
  await db.material.createMany({
    data: [
      {
        schoolId: school.id,
        classSubjectId: csMathA.id,
        type: 'course',
        title: 'Chapitre 3 — Suites numériques',
        description: 'Cours complet sur les suites arithmétiques et géométriques.',
        createdById: t1.id,
      },
      {
        schoolId: school.id,
        classSubjectId: csMathA.id,
        type: 'exercise',
        title: 'TD Suites — Série 1',
        description: 'Série d\'exercices sur les suites. À rendre avant la deadline.',
        deadline: new Date('2026-07-05T23:59:00'),
        allowsSubmission: true,
        createdById: t1.id,
      },
      {
        schoolId: school.id,
        classSubjectId: csFrA.id,
        type: 'course',
        title: 'Dissertation littéraire — Méthodologie',
        description: 'Guide de rédaction d\'une dissertation.',
        createdById: t3.id,
      },
      {
        schoolId: school.id,
        classSubjectId: csMathB.id,
        type: 'exercise',
        title: 'Devoir maison — Fonctions',
        deadline: new Date('2026-07-10T23:59:00'),
        allowsSubmission: true,
        createdById: t1.id,
      },
    ],
    skipDuplicates: true,
  })

  // ── Messages ──────────────────────────────────────────────────────────────────
  await db.message.createMany({
    data: [
      {
        schoolId: school.id,
        senderId: t1.id,
        scope: 'broadcast',
        targetClassId: classA.id,
        subject: 'Devoir 1 — Résultats disponibles',
        body: 'Bonjour à tous. Les résultats du Devoir 1 de Mathématiques sont maintenant disponibles dans votre espace notes. Bon courage pour la suite.',
      },
      {
        schoolId: school.id,
        senderId: t3.id,
        scope: 'direct',
        recipientId: parents[0].id,
        subject: 'Concernant Imane',
        body: 'Bonjour M. Bensaid, je souhaitais vous informer qu\'Imane progresse très bien en Français. Continuez à l\'encourager.',
      },
    ],
    skipDuplicates: true,
  })

  // ── News ──────────────────────────────────────────────────────────────────────
  await db.news.createMany({
    data: [
      {
        schoolId: school.id,
        title: 'Calendrier des examens de fin d\'année',
        titleAr: 'جدول امتحانات نهاية السنة',
        body: 'Le calendrier des examens de fin d\'année 2025-2026 est maintenant disponible. Les examens se dérouleront du 15 au 25 juin 2026.',
        bodyAr: 'جدول امتحانات نهاية السنة الدراسية 2025-2026 متاح الآن. ستجري الامتحانات من 15 إلى 25 يونيو 2026.',
        published: true,
        pinned: true,
        createdById: admin.id,
      },
      {
        schoolId: school.id,
        title: 'Journée portes ouvertes — 10 Juillet',
        titleAr: 'يوم الأبواب المفتوحة - 10 يوليوز',
        body: 'Nous organisons une journée portes ouvertes le 10 juillet. Tous les parents sont invités à découvrir nos nouveaux équipements.',
        published: true,
        createdById: admin.id,
      },
    ],
    skipDuplicates: true,
  })

  // ── Events ────────────────────────────────────────────────────────────────────
  await db.event.createMany({
    data: [
      {
        schoolId: school.id,
        title: 'Réunion parents-professeurs',
        titleAr: 'اجتماع الآباء والأساتذة',
        description: 'Rencontre semestrielle entre les parents et les professeurs.',
        startsAt: new Date('2026-07-03T16:00:00'),
        endsAt: new Date('2026-07-03T19:00:00'),
        location: 'Salle polyvalente',
        targetRoles: ['parent', 'teacher'],
        createdById: admin.id,
      },
      {
        schoolId: school.id,
        title: 'Remise des bulletins S1',
        titleAr: 'توزيع نتائج الفصل الأول',
        startsAt: new Date('2026-07-08T09:00:00'),
        location: 'Salles de classe',
        targetRoles: ['parent', 'student', 'teacher'],
        createdById: admin.id,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✓ Seed complete.')
  console.log('\nDemo accounts:')
  console.log('  admin@amal.school    / admin123')
  console.log('  maths@amal.school    / teacher123')
  console.log('  phy@amal.school      / teacher123')
  console.log('  fr@amal.school       / teacher123')
  console.log('  s1@amal.school       / student123  (Imane Bensaid)')
  console.log('  p1@amal.school       / parent123   (parent of Imane)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
