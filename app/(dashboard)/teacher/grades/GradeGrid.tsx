'use client'
import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save } from 'lucide-react'
import { gradeColor } from '@/lib/utils'

const EXAM_TYPES = [
  { value: 'devoir1', label: 'Devoir 1' },
  { value: 'devoir2', label: 'Devoir 2' },
  { value: 'examen_blanc', label: 'Examen Blanc' },
  { value: 'examen', label: 'Examen' },
  { value: 'controle', label: 'Contrôle' },
  { value: 'participation', label: 'Participation' },
]

type Props = {
  classSubjects: { id: string; label: string }[]
  selectedCsId: string
  students: { id: string; fullName: string }[]
  existingGrades: Record<string, number | null>
  examType: string
  semester: number
}

export default function GradeGrid({ classSubjects, selectedCsId, students, existingGrades, examType, semester }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(existingGrades).map(([k, v]) => [k, v !== null ? String(v) : '']))
  )
  const [saving, setSaving] = useState(false)
  const [csId, setCsId] = useState(selectedCsId)
  const [exam, setExam] = useState(examType)
  const [sem, setSem] = useState(String(semester))

  function navigate(params: Record<string, string>) {
    const p = new URLSearchParams({ cs: csId, exam, semester: sem, ...params })
    router.push(`${pathname}?${p}`)
  }

  async function saveGrades() {
    setSaving(true)
    const entries = students.map((s) => ({
      studentId: s.id,
      score: scores[s.id] !== '' ? Number(scores[s.id]) : null,
    }))
    const res = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classSubjectId: csId, examType: exam, semester: Number(sem), entries }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: 'Notes enregistrées', variant: 'default' })
      router.refresh()
    } else {
      toast({ title: 'Erreur lors de la sauvegarde', variant: 'destructive' })
    }
  }

  const avg = students.length > 0
    ? students.reduce((sum, s) => sum + (parseFloat(scores[s.id] ?? '') || 0), 0) / students.filter((s) => scores[s.id] !== '').length || 0
    : 0

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Classe / Matière</p>
              <Select value={csId} onValueChange={(v) => { setCsId(v); navigate({ cs: v }) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classSubjects.map((cs) => (
                    <SelectItem key={cs.id} value={cs.id}>{cs.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Type d'évaluation</p>
              <Select value={exam} onValueChange={(v) => { setExam(v); navigate({ exam: v }) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Semestre</p>
              <Select value={sem} onValueChange={(v) => { setSem(v); navigate({ semester: v }) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semestre 1</SelectItem>
                  <SelectItem value="2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={saveGrades} disabled={saving || students.length === 0} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade grid */}
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sélectionnez une classe pour afficher les élèves.</p>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {students.length} élève(s)
              </CardTitle>
              {!isNaN(avg) && avg > 0 && (
                <span className={`text-sm font-semibold ${gradeColor(avg)}`}>
                  Moy. classe : {avg.toFixed(2)}/20
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {students.map((s, i) => {
                const val = scores[s.id] ?? ''
                const num = parseFloat(val)
                return (
                  <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{s.fullName}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.25}
                        placeholder="—"
                        value={val}
                        onChange={(e) => setScores((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        className={`w-20 text-center tabular-nums ${!isNaN(num) && val ? gradeColor(num) : ''}`}
                      />
                      <span className="text-xs text-muted-foreground">/20</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
