'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, BookOpen, ClipboardList, FileText,
  MessageSquare, Newspaper, Users, GraduationCap,
  CalendarDays, LogOut, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const navByRole: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/classes', label: 'Classes', icon: GraduationCap },
    { href: '/admin/news', label: 'Actualités', icon: Newspaper },
    { href: '/admin/events', label: 'Événements', icon: CalendarDays },
  ],
  teacher: [
    { href: '/teacher', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/teacher/grades', label: 'Notes', icon: ClipboardList },
    { href: '/teacher/absences', label: 'Absences', icon: CalendarDays },
    { href: '/teacher/materials', label: 'Cours & Exercices', icon: BookOpen },
    { href: '/teacher/messages', label: 'Messages', icon: MessageSquare },
  ],
  student: [
    { href: '/student', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/student/grades', label: 'Notes', icon: ClipboardList },
    { href: '/student/materials', label: 'Cours & Exercices', icon: BookOpen },
    { href: '/student/messages', label: 'Messages', icon: MessageSquare },
  ],
  parent: [
    { href: '/parent', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/parent/progress', label: 'Suivi scolaire', icon: FileText },
    { href: '/parent/messages', label: 'Messages', icon: MessageSquare },
  ],
}

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role ?? 'student'
  const items = navByRole[role] ?? []
  const initials = (session?.user?.fullName ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-white min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <span className="font-semibold text-lg text-foreground">Kalam</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== `/${role}` && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  )
}
