import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number | null, maxScore: number = 20): string {
  if (score === null || score === undefined) return '—'
  return `${score.toFixed(1)}/${maxScore}`
}

export function gradeColor(score: number, maxScore: number = 20): string {
  const pct = (score / maxScore) * 100
  if (pct >= 75) return 'text-green-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export function absenceBadgeColor(status: string): string {
  if (status === 'excused') return 'bg-amber-100 text-amber-700'
  if (status === 'late') return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export function absenceLabel(status: string, lang: string = 'fr'): string {
  const labels: Record<string, Record<string, string>> = {
    absent: { fr: 'Absent', ar: 'غائب' },
    late: { fr: 'Retard', ar: 'متأخر' },
    excused: { fr: 'Excusé', ar: 'مبرر' },
  }
  return labels[status]?.[lang] ?? status
}

export function examTypeLabel(type: string, lang: string = 'fr'): string {
  const labels: Record<string, Record<string, string>> = {
    devoir1: { fr: 'Devoir 1', ar: 'الفرض 1' },
    devoir2: { fr: 'Devoir 2', ar: 'الفرض 2' },
    examen_blanc: { fr: 'Examen Blanc', ar: 'الامتحان التجريبي' },
    examen: { fr: 'Examen', ar: 'الامتحان' },
    controle: { fr: 'Contrôle', ar: 'اختبار' },
    participation: { fr: 'Participation', ar: 'مشاركة' },
    custom: { fr: 'Autre', ar: 'آخر' },
  }
  return labels[type]?.[lang] ?? type
}

export function formatDate(date: Date | string, lang: string = 'fr'): string {
  const d = new Date(date)
  return d.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-MA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export const ROLE_LABELS: Record<string, { fr: string; ar: string }> = {
  admin: { fr: 'Administrateur', ar: 'مدير' },
  teacher: { fr: 'Professeur', ar: 'أستاذ' },
  student: { fr: 'Élève', ar: 'تلميذ' },
  parent: { fr: 'Parent', ar: 'ولي الأمر' },
}
