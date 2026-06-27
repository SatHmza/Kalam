'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Supprimer cet événement ?')) return
    setLoading(true)
    await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
