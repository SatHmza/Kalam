import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.schoolId = (user as any).schoolId
        token.fullName = (user as any).fullName
        token.langPref = (user as any).langPref
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.schoolId = token.schoolId as string
      session.user.fullName = token.fullName as string
      session.user.langPref = token.langPref as string
      return session
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findFirst({
          where: { email: credentials.email, isActive: true },
        })

        if (!user?.password) return null

        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email ?? '',
          name: user.fullName,
          role: user.role,
          schoolId: user.schoolId,
          fullName: user.fullName,
          langPref: user.langPref,
        } as any
      },
    }),
  ],
}
