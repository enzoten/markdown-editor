'use client'

import { signIn } from 'next-auth/react'

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-card">
        <h1 className="landing-title">Markdown Editor</h1>
        <p className="landing-subtitle">
          A WYSIWYG editor with zero syntax reveal. Write clean GitHub Flavored Markdown without ever seeing raw syntax.
        </p>
        <button className="landing-signin" onClick={() => signIn('google')}>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
