import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Tiptap and ProseMirror use some Node.js APIs that need transpilation
  transpilePackages: ['@tiptap/pm'],
}

export default nextConfig
