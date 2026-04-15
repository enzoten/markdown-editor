import { auth } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  let session = null
  try {
    session = await auth()
  } catch {
    // Auth may fail if DB is unavailable — show landing page
  }

  if (!session?.user) {
    return <LandingPage />
  }

  return <AppShell user={session.user} />
}
