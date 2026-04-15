import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/documents — list user's documents
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json(documents)
}

// POST /api/documents — create a new document
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, content } = body as { title?: string; content?: string }

  const document = await prisma.document.create({
    data: {
      title: title || 'Untitled',
      content: content || '',
      userId: session.user.id,
    },
  })

  return NextResponse.json(document, { status: 201 })
}
