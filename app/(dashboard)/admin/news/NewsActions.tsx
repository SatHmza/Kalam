'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function NewsActions({ newsId, published, pinned }: { newsId: string; published: boolean; pinned: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle(field: 'published' | 'pinned') {
    setLoading(true)
    await fetch(`/api/news/${newsId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: field === 'published' ? !published : !pinned }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1 shrink-0">
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggle('published')} disabled={loading}>
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : published ? 'Dépublier' : 'Publier'}
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggle('pinned')} disabled={loading}>
        {pinned ? 'Désépingler' : 'Épingler'}
      </Button>
    </div>
  )
}
