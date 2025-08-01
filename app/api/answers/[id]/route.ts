import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    const { id: answerId } = await params

    // First, get the answer to check ownership and calculate points to deduct
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            points: true
          }
        },
        votes: true
      }
    })

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found', success: false },
        { status: 404 }
      )
    }

    // Check if user is the author
    const isAuthor = answer.author.email === session.user.email

    if (!isAuthor) {
      return NextResponse.json(
        { error: 'You can only delete your own answers', success: false },
        { status: 403 }
      )
    }

    // Calculate points to deduct
    // Base points for answering (10 points)
    // Plus points from upvotes (2 points per upvote)  
    // Minus points from downvotes (1 point per downvote)
    const upvotes = answer.votes.filter((vote: any) => vote.type === 'UPVOTE').length
    const downvotes = answer.votes.filter((vote: any) => vote.type === 'DOWNVOTE').length
    const pointsToDeduct = 10 + (upvotes * 2) - (downvotes * 1)

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx: any) => {
      // Deduct points from answer author (don't go below 0)
      if (pointsToDeduct > 0) {
        await tx.user.update({
          where: { id: answer.author.id },
          data: { 
            points: { 
              decrement: Math.min(pointsToDeduct, answer.author.points)
            }
          }
        })
      }

      // Delete the answer (this will cascade delete votes, etc.)
      await tx.answer.delete({
        where: { id: answerId }
      })
    })

    return NextResponse.json({
      message: 'Answer deleted successfully',
      success: true
    })
  } catch (error) {
    console.error('Error deleting answer:', error)
    return NextResponse.json(
      { error: 'Failed to delete answer', success: false },
      { status: 500 }
    )
  }
}
