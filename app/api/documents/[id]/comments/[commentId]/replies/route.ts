import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/documents/:id/comments/:commentId/replies — add a reply
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { commentId } = await params
  const body = await req.json()
  const { content } = body as { content: string }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const reply = await prisma.commentReply.create({
    data: {
      content: content.trim(),
      commentId,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  return NextResponse.json(reply, { status: 201 })
}
