import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/documents/:id/comments — list comments for a document
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const comments = await prisma.comment.findMany({
    where: { documentId: id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(comments)
}

// POST /api/documents/:id/comments — create a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { content } = body as { content: string }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      documentId: id,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  })

  return NextResponse.json(comment, { status: 201 })
}
