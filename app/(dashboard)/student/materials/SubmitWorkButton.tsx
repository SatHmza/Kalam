'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

export default function SubmitWorkButton({ materialId }: { materialId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux (max 10 Mo)', variant: 'destructive' })
      return
    }
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('materialId', materialId)
    const uploadRes = await fetch('/api/submissions/upload', { method: 'POST', body: form })
    if (!uploadRes.ok) {
      toast({ title: 'Erreur upload', variant: 'destructive' })
      setLoading(false)
      return
    }
    const { url, sizeKb } = await uploadRes.json()
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId, fileUrl: url, fileSizeKb: sizeKb }),
    })
    setLoading(false)
    if (res.ok) {
      toast({ title: 'Travail remis avec succès' })
      setOpen(false)
      router.refresh()
    } else {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs h-8">Remettre</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Remettre le travail</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <label className="flex flex-col items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-6 text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Upload className="h-6 w-6 opacity-50" />
            {file ? file.name : 'Cliquez pour sélectionner un fichier (max 10 Mo)'}
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="flex gap-3">
            <Button onClick={submit} disabled={!file || loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
