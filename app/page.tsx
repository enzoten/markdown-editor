import { auth } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return <LandingPage />
  }

  return <AppShell user={session.user} />
}
