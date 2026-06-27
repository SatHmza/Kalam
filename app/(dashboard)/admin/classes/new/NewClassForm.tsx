'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

const schema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  labelAr: z.string().optional(),
  level: z.string().optional(),
  academicYearId: z.string().min(1),
})
type FormData = z.infer<typeof schema>

export default function NewClassForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [level, setLevel] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { toast({ title: 'Classe créée' }); router.push('/admin/classes') }
    else toast({ title: 'Erreur', variant: 'destructive' })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/admin/classes"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Nouvelle classe</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Code court</Label>
              <Input {...register('name')} placeholder="Ex : Tle Bac Sc A" />
              {errors.name && <p className="text-xs text-destructive">Requis</p>}
            </div>
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input {...register('label')} placeholder="Terminale Bac Sciences — Groupe A" />
              {errors.label && <p className="text-xs text-destructive">Requis</p>}
            </div>
            <div className="space-y-2">
              <Label>الاسم بالعربية</Label>
              <Input {...register('labelAr')} dir="rtl" className="font-arabic" placeholder="الثانية باكالوريا علوم" />
            </div>
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select value={level} onValueChange={(v) => { setLevel(v); setValue('level', v) }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primaire">Primaire</SelectItem>
                  <SelectItem value="college">Collège</SelectItem>
                  <SelectItem value="lycee">Lycée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Année scolaire</Label>
              <Input {...register('academicYearId')} placeholder="ay-2025-2026" />
              {errors.academicYearId && <p className="text-xs text-destructive">Requis</p>}
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer la classe
              </Button>
              <Link href="/admin/classes"><Button variant="outline" type="button">Annuler</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
