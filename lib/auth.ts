import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from './prisma'

async function ensureUser(email: string, name?: string | null, image?: string | null) {
  try {
    return await prisma.user.upsert({
      where: { email },
      update: { name, image },
      create: { email, name, image },
    })
  } catch {
    return null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      await ensureUser(user.email, user.name, user.image)
      return true
    },
    async session({ session }) {
      if (session.user?.email) {
        // Ensure user exists in DB (handles case where DB was unavailable at sign-in)
        const dbUser = await ensureUser(
          session.user.email,
          session.user.name,
          session.user.image,
        )
        if (dbUser) {
          session.user.id = dbUser.id
        }
      }
      return session
    },
  },
})
