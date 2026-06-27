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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

const schema = z.object({ subject: z.string().optional(), body: z.string().min(1) })
type FormData = z.infer<typeof schema>

type Props = {
  classes: { id: string; label: string }[]
  recipients: { id: string; fullName: string }[]
}

export default function ComposeMessage({ classes, recipients }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<'broadcast' | 'direct'>('broadcast')
  const [targetClassId, setTargetClassId] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const body = {
      scope: mode,
      ...(mode === 'broadcast' ? { targetClassId } : { recipientId }),
      subject: data.subject,
      body: data.body,
    }
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast({ title: 'Message envoyé' })
      reset()
      router.refresh()
    } else {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Nouveau message</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList>
              <TabsTrigger value="broadcast">Message de classe</TabsTrigger>
              <TabsTrigger value="direct">Message direct</TabsTrigger>
            </TabsList>
            <TabsContent value="broadcast" className="mt-3 space-y-3">
              <div className="space-y-1">
                <Label>Classe</Label>
                <Select value={targetClassId} onValueChange={setTargetClassId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="direct" className="mt-3 space-y-3">
              <div className="space-y-1">
                <Label>Destinataire (élève ou parent)</Label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger><SelectValue placeholder="Rechercher..." /></SelectTrigger>
                  <SelectContent>
                    {recipients.map((r) => <SelectItem key={r.id} value={r.id}>{r.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-1">
            <Label>Objet (optionnel)</Label>
            <Input {...register('subject')} placeholder="Objet du message" />
          </div>
          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea {...register('body')} rows={4} placeholder="Rédigez votre message..." />
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
