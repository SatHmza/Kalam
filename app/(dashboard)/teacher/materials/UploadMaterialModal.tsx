'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['course', 'exercise', 'resource']),
  deadline: z.string().optional(),
  allowsSubmission: z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

export default function UploadMaterialModal({ classSubjectId }: { classSubjectId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState('course')
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'course' },
  })

  async function onSubmit(data: FormData) {
    setUploading(true)
    let fileUrl: string | undefined
    let fileSizeKb: number | undefined

    if (file) {
      const MAX_MB = 25
      if (file.size > MAX_MB * 1024 * 1024) {
        toast({ title: `Fichier trop volumineux (max ${MAX_MB} Mo)`, variant: 'destructive' })
        setUploading(false)
        return
      }
      const formData = new FormData()
      formData.append('file', file)
      formData.append('classSubjectId', classSubjectId)
      const uploadRes = await fetch('/api/materials/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        toast({ title: 'Erreur upload', variant: 'destructive' })
        setUploading(false)
        return
      }
      const { url, sizeKb } = await uploadRes.json()
      fileUrl = url
      fileSizeKb = sizeKb
    }

    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, classSubjectId, fileUrl, fileSizeKb }),
    })
    setUploading(false)
    if (res.ok) {
      toast({ title: 'Document ajouté' })
      reset()
      setFile(null)
      setOpen(false)
      router.refresh()
    } else {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input {...register('title')} placeholder="Ex : Chapitre 3 — Suites" />
            {errors.title && <p className="text-xs text-destructive">Requis</p>}
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => { setType(v); setValue('type', v as any) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Cours</SelectItem>
                <SelectItem value="exercise">Exercice</SelectItem>
                <SelectItem value="resource">Ressource</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea {...register('description')} rows={2} placeholder="Consigne ou description..." />
          </div>
          {type === 'exercise' && (
            <>
              <div className="space-y-2">
                <Label>Date limite</Label>
                <Input type="datetime-local" {...register('deadline')} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="allows" {...register('allowsSubmission')} className="h-4 w-4 rounded" />
                <Label htmlFor="allows" className="font-normal">Permettre la remise de travaux</Label>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Fichier (optionnel, max 25 Mo)</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
                <Upload className="h-4 w-4" />
                {file ? file.name : 'Choisir un fichier PDF ou image'}
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
              {file && <button type="button" onClick={() => setFile(null)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || uploading} className="flex-1">
              {(isSubmitting || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Annuler</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
