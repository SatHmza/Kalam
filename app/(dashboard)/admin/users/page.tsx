import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { ROLE_LABELS, formatDate } from '@/lib/utils'

const roleVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  admin: 'destructive',
  teacher: 'default',
  student: 'success',
  parent: 'warning',
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { role?: string }
}) {
  const session = await getServerSession(authOptions)
  const { schoolId } = session!.user
  const roleFilter = searchParams.role as UserRole | undefined

  const users = await db.user.findMany({
    where: { schoolId, ...(roleFilter ? { role: roleFilter } : {}) },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    select: {
      id: true, fullName: true, email: true, role: true,
      isActive: true, createdAt: true, langPref: true,
    },
  })

  const counts = await db.user.groupBy({
    by: ['role'],
    where: { schoolId },
    _count: { _all: true },
  })
  const countMap = Object.fromEntries(counts.map((c) => [c.role, c._count._all]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{users.length} compte(s) affiché(s)</p>
        </div>
        <Link href="/admin/users/new">
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </Link>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'admin', 'teacher', 'student', 'parent'] as const).map((r) => (
          <Link
            key={r}
            href={r ? `/admin/users?role=${r}` : '/admin/users'}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              (roleFilter ?? '') === r
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-muted-foreground hover:bg-muted'
            }`}
          >
            {r ? `${ROLE_LABELS[r].fr} (${countMap[r] ?? 0})` : `Tous (${users.length})`}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">Aucun utilisateur trouvé.</div>
            )}
            {users.map((u) => {
              const initials = u.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              return (
                <div key={u.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{u.fullName}</p>
                      {!u.isActive && <span className="text-xs text-muted-foreground">(inactif)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={roleVariant[u.role]}>{ROLE_LABELS[u.role].fr}</Badge>
                    <Link href={`/admin/users/${u.id}/edit`}>
                      <Button variant="ghost" size="sm" className="text-xs h-7">Modifier</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
