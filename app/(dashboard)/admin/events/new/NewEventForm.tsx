'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

const schema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
  location: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function NewEventForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, targetRoles: [] }),
    })
    if (res.ok) { toast({ title: 'Événement créé' }); router.push('/admin/news') }
    else toast({ title: 'Erreur', variant: 'destructive' })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/admin/news"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Nouvel événement</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre (français)</Label>
                <Input {...register('title')} placeholder="Ex : Réunion parents-professeurs" />
                {errors.title && <p className="text-xs text-destructive">Requis</p>}
              </div>
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input {...register('titleAr')} dir="rtl" className="font-arabic" placeholder="اجتماع الآباء والأساتذة" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Début</Label>
                <Input type="datetime-local" {...register('startsAt')} />
                {errors.startsAt && <p className="text-xs text-destructive">Requis</p>}
              </div>
              <div className="space-y-2">
                <Label>Fin (optionnel)</Label>
                <Input type="datetime-local" {...register('endsAt')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input {...register('location')} placeholder="Salle polyvalente" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l'événement
              </Button>
              <Link href="/admin/news"><Button variant="outline" type="button">Annuler</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
