import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/documents/:id/comments/:commentId — update (resolve/unresolve)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { commentId } = await params
  const body = await req.json()
  const { resolved } = body as { resolved?: boolean }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      ...(resolved !== undefined && { resolved }),
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

  return NextResponse.json(comment)
}

// DELETE /api/documents/:id/comments/:commentId — delete a comment
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { commentId } = await params

  await prisma.comment.delete({ where: { id: commentId } })

  return NextResponse.json({ ok: true })
}
