'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

const schema = z.object({ subject: z.string().optional(), body: z.string().min(1) })
type FormData = z.infer<typeof schema>

export default function ParentComposeMessage({ teachers }: { teachers: { id: string; fullName: string }[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [recipientId, setRecipientId] = useState('')
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!recipientId) { toast({ title: 'Sélectionnez un professeur', variant: 'destructive' }); return }
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'direct', recipientId, ...data }),
    })
    if (res.ok) { toast({ title: 'Message envoyé' }); reset(); router.refresh() }
    else toast({ title: 'Erreur', variant: 'destructive' })
  }

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Contacter un professeur</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Professeur</Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Objet (optionnel)</Label>
            <Input {...register('subject')} placeholder="Objet du message" />
          </div>
          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea {...register('body')} rows={3} placeholder="Votre message..." />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
