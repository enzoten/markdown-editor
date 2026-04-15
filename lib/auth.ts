import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      // Upsert user in database on sign-in
      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name, image: user.image },
        create: {
          email: user.email,
          name: user.name,
          image: user.image,
        },
      })
      return true
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        })
        if (dbUser) {
          session.user.id = dbUser.id
        }
      }
      return session
    },
  },
})
