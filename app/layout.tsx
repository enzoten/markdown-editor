import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'Markdown Editor',
  description: 'WYSIWYG Markdown editor with zero syntax reveal',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
