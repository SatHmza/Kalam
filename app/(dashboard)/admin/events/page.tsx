export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Plus, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function EventsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') redirect('/login')

  const events = await db.event.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { startsAt: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Événements</h1>
        <Link href="/admin/events/new">
          <Button><Plus className="h-4 w-4 mr-2" />Nouvel événement</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun événement. Créez-en un avec le bouton ci-dessus.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="py-4 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{event.title}</p>
                  {event.titleAr && <p className="text-sm text-muted-foreground font-arabic" dir="rtl">{event.titleAr}</p>}
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(event.startsAt.toISOString())}</p>
                  {event.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />{event.location}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
