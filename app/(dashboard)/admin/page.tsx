import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CalendarX2, TrendingUp, HardDrive } from 'lucide-react'
import { formatDate } from '@/lib/utils'

async function getStats(schoolId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalUsers, weekAbsences, recentNews, upcomingEvents, school, avgGrade] = await Promise.all([
    db.user.count({ where: { schoolId, isActive: true } }),
    db.absence.count({ where: { schoolId, date: { gte: sevenDaysAgo } } }),
    db.news.findMany({
      where: { schoolId, published: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, title: true, pinned: true, createdAt: true },
    }),
    db.event.findMany({
      where: { schoolId, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 3,
      select: { id: true, title: true, startsAt: true, location: true },
    }),
    db.school.findUnique({ where: { id: schoolId }, select: { storageUsedMb: true, storageQuotaMb: true } }),
    db.gradeEntry.aggregate({
      where: { schoolId },
      _avg: { score: true },
    }),
  ])

  return { totalUsers, weekAbsences, recentNews, upcomingEvents, school, avgGrade: avgGrade._avg.score }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const { schoolId } = session!.user
  const { totalUsers, weekAbsences, recentNews, upcomingEvents, school, avgGrade } = await getStats(schoolId)

  const storagePct = school ? Math.round((school.storageUsedMb / school.storageQuotaMb) * 100) : 0

  const stats = [
    { label: 'Utilisateurs actifs', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Absences (7 jours)', value: weekAbsences, icon: CalendarX2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Moyenne générale', value: avgGrade ? `${avgGrade.toFixed(1)}/20` : '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Stockage utilisé', value: `${storagePct}%`, icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre établissement</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent News */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernières actualités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNews.length === 0 && <p className="text-sm text-muted-foreground">Aucune actualité publiée.</p>}
            {recentNews.map((n) => (
              <div key={n.id} className="flex items-start gap-3">
                {n.pinned && <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />}
                <div>
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prochains événements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement à venir.</p>}
            {upcomingEvents.map((e) => (
              <div key={e.id} className="flex gap-4 items-start">
                <div className="text-center bg-primary/10 rounded-lg px-3 py-1.5 shrink-0">
                  <p className="text-xs text-primary font-medium">
                    {new Date(e.startsAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
