'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-8">
        <h1 className="text-3xl font-bold text-foreground mb-3">Markdown Editor</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          A WYSIWYG editor with zero syntax reveal. Write clean GitHub Flavored Markdown without ever seeing raw syntax.
        </p>
        <Button size="lg" onClick={() => signIn('google')}>
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
