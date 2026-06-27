export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pin, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import NewsActions from './NewsActions'

export default async function NewsPage() {
  const session = await getServerSession(authOptions)
  const { schoolId } = session!.user

  const [newsList, events] = await Promise.all([
    db.news.findMany({
      where: { schoolId },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      include: { createdBy: { select: { fullName: true } } },
    }),
    db.event.findMany({
      where: { schoolId, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 10,
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Actualités & Événements</h1>
        <div className="flex gap-2">
          <Link href="/admin/events/new">
            <Button variant="outline" size="sm">+ Événement</Button>
          </Link>
          <Link href="/admin/news/new">
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Publier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* News list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Actualités</h2>
          {newsList.length === 0 && <p className="text-sm text-muted-foreground">Aucune actualité.</p>}
          {newsList.map((n) => (
            <Card key={n.id} className="relative">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {n.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                      <p className="font-medium text-sm leading-tight">{n.title}</p>
                    </div>
                    {n.titleAr && <p className="text-xs text-muted-foreground font-arabic mb-2">{n.titleAr}</p>}
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                      <Badge variant={n.published ? 'success' : 'secondary'}>
                        {n.published ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </div>
                  </div>
                  <NewsActions newsId={n.id} published={n.published} pinned={n.pinned} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Events list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Événements à venir</h2>
          {events.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement.</p>}
          {events.map((e) => (
            <Card key={e.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3 items-start">
                  <div className="text-center bg-primary/10 rounded-lg px-2.5 py-1.5 shrink-0">
                    <p className="text-xs font-bold text-primary">
                      {new Date(e.startsAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.location && <p className="text-xs text-muted-foreground mt-0.5">{e.location}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
