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
  body: z.string().min(1),
  bodyAr: z.string().optional(),
  published: z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

export default function NewNewsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast({ title: 'Actualité créée' })
      router.push('/admin/news')
    } else {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/news"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Nouvelle actualité</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre (français)</Label>
                <Input {...register('title')} placeholder="Titre de l'actualité" />
                {errors.title && <p className="text-xs text-destructive">Requis</p>}
              </div>
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input {...register('titleAr')} placeholder="عنوان الخبر" dir="rtl" className="font-arabic" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contenu (français)</Label>
                <Textarea {...register('body')} placeholder="Contenu de l'actualité..." rows={6} />
                {errors.body && <p className="text-xs text-destructive">Requis</p>}
              </div>
              <div className="space-y-2">
                <Label>المحتوى (عربي)</Label>
                <Textarea {...register('bodyAr')} placeholder="محتوى الخبر..." rows={6} dir="rtl" className="font-arabic" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="published" {...register('published')} className="h-4 w-4 rounded border" />
              <Label htmlFor="published" className="font-normal">Publier immédiatement</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
              <Link href="/admin/news"><Button variant="outline" type="button">Annuler</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
