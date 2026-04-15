import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name, image: user.image },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
          },
        })
      } catch {
        // DB unavailable — still allow sign-in, session works without DB user
      }
      return true
    },
    async session({ session }) {
      if (session.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          })
          if (dbUser) {
            session.user.id = dbUser.id
          }
        } catch {
          // DB unavailable
        }
      }
      return session
    },
  },
})
