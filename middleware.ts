import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    const role = token.role as string

    if (pathname.startsWith('/admin') && role !== 'admin')
      return NextResponse.redirect(new URL(`/${role}`, req.url))
    if (pathname.startsWith('/teacher') && role !== 'teacher')
      return NextResponse.redirect(new URL(`/${role}`, req.url))
    if (pathname.startsWith('/student') && role !== 'student')
      return NextResponse.redirect(new URL(`/${role}`, req.url))
    if (pathname.startsWith('/parent') && role !== 'parent')
      return NextResponse.redirect(new URL(`/${role}`, req.url))

    return NextResponse.next()
  },
  { callbacks: { authorized: ({ token }) => !!token } }
)

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/parent/:path*'],
}
