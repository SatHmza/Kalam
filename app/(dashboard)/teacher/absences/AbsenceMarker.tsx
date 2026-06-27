'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save } from 'lucide-react'
import { absenceBadgeColor } from '@/lib/utils'

const STATUSES = [
  { value: 'present', label: 'Présent' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Retard' },
  { value: 'excused', label: 'Excusé' },
]

type Props = {
  classes: { id: string; label: string }[]
  selectedClassId: string
  selectedDate: string
  students: { id: string; fullName: string }[]
  existingAbsences: Record<string, string>
}

export default function AbsenceMarker({ classes, selectedClassId, selectedDate, students, existingAbsences }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [statuses, setStatuses] = useState<Record<string, string>>(existingAbsences)
  const [classId, setClassId] = useState(selectedClassId)
  const [date, setDate] = useState(selectedDate)
  const [period, setPeriod] = useState('')
  const [saving, setSaving] = useState(false)

  function navigate(params: Record<string, string>) {
    const p = new URLSearchParams({ class: classId, date, ...params })
    router.push(`${pathname}?${p}`)
  }

  function setAll(status: string) {
    const all: Record<string, string> = {}
    students.forEach((s) => { all[s.id] = status })
    setStatuses(all)
  }

  async function save() {
    setSaving(true)
    const entries = students
      .filter((s) => statuses[s.id] && statuses[s.id] !== 'present')
      .map((s) => ({ studentId: s.id, status: statuses[s.id] }))

    const res = await fetch('/api/absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, date, period, entries }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: 'Absences enregistrées' })
      router.refresh()
    } else {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const absentCount = students.filter((s) => statuses[s.id] && statuses[s.id] !== 'present').length

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Classe</p>
              <Select value={classId} onValueChange={(v) => { setClassId(v); navigate({ class: v }) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Date</p>
              <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); navigate({ date: e.target.value }) }} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Séance (optionnel)</p>
              <Input placeholder="ex: 8h-10h" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sélectionnez une classe pour afficher les élèves.</p>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                {students.length} élève(s) · {absentCount} absence(s)
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAll('present')}>Tous présents</Button>
                <Button variant="outline" size="sm" onClick={() => setAll('absent')}>Tous absents</Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {students.map((s, i) => {
                const status = statuses[s.id] ?? 'present'
                return (
                  <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{s.fullName}</span>
                    <div className="flex gap-2">
                      {STATUSES.map((st) => (
                        <button
                          key={st.value}
                          onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: st.value }))}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            status === st.value
                              ? st.value === 'present'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : absenceBadgeColor(st.value) + ' border-transparent'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
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
