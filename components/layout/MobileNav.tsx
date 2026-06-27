'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, BookOpen, ClipboardList, FileText,
  MessageSquare, Users, GraduationCap, Newspaper,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavByRole: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: '/admin', label: 'Accueil', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/classes', label: 'Classes', icon: GraduationCap },
    { href: '/admin/news', label: 'Actualités', icon: Newspaper },
  ],
  teacher: [
    { href: '/teacher', label: 'Accueil', icon: LayoutDashboard },
    { href: '/teacher/grades', label: 'Notes', icon: ClipboardList },
    { href: '/teacher/absences', label: 'Absences', icon: ClipboardList },
    { href: '/teacher/materials', label: 'Cours', icon: BookOpen },
    { href: '/teacher/messages', label: 'Messages', icon: MessageSquare },
  ],
  student: [
    { href: '/student', label: 'Accueil', icon: LayoutDashboard },
    { href: '/student/grades', label: 'Notes', icon: ClipboardList },
    { href: '/student/materials', label: 'Cours', icon: BookOpen },
    { href: '/student/messages', label: 'Messages', icon: MessageSquare },
  ],
  parent: [
    { href: '/parent', label: 'Accueil', icon: LayoutDashboard },
    { href: '/parent/progress', label: 'Suivi', icon: FileText },
    { href: '/parent/messages', label: 'Messages', icon: MessageSquare },
  ],
}

export function MobileNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role ?? 'student'
  const items = mobileNavByRole[role] ?? []

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t flex">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== `/${role}` && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
