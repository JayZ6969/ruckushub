import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, itemType, itemId } = await request.json()

    // Validate input
    if (!type || !itemType || !itemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['UPVOTE', 'DOWNVOTE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
    }

    if (!['question', 'answer'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if item exists and get author info
    let authorId: string | null = null
    if (itemType === 'question') {
      const question = await prisma.question.findUnique({
        where: { id: itemId },
        select: { authorId: true }
      })
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }
      authorId = question.authorId
    } else {
      const answer = await prisma.answer.findUnique({
        where: { id: itemId },
        select: { authorId: true }
      })
      if (!answer) {
        return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
      }
      authorId = answer.authorId
    }

    // Check if user has already voted on this item
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        ...(itemType === 'question' ? { questionId: itemId } : { answerId: itemId })
      }
    })

    let voteCount = 0
    let pointsChange = 0

    // Use transaction to handle vote and points atomically
    await prisma.$transaction(async (tx: any) => {
      if (existingVote) {
        if (existingVote.type === type) {
          // Same vote type - remove the vote (toggle off)
          await tx.vote.delete({
            where: { id: existingVote.id }
          })
          
          // Reverse the points given for this vote
          pointsChange = existingVote.type === 'UPVOTE' ? -2 : 1 // Remove upvote bonus or downvote penalty
        } else {
          // Different vote type - update the vote
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { type: type as 'UPVOTE' | 'DOWNVOTE' }
          })
          
          // Calculate points change: remove old vote effect, add new vote effect
          const oldEffect = existingVote.type === 'UPVOTE' ? 2 : -1
          const newEffect = type === 'UPVOTE' ? 2 : -1
          pointsChange = newEffect - oldEffect
        }
      } else {
        // No existing vote - create new vote
        await tx.vote.create({
          data: {
            type: type as 'UPVOTE' | 'DOWNVOTE',
            userId: user.id,
            ...(itemType === 'question' ? { questionId: itemId } : { answerId: itemId })
          }
        })
        
        // Add points for new vote
        pointsChange = type === 'UPVOTE' ? 2 : -1
      }

      // Update author's points (don't let points go below 0)
      if (pointsChange !== 0 && authorId && authorId !== user.id) { // Don't award points for voting on own content
        const author = await tx.user.findUnique({
          where: { id: authorId },
          select: { points: true }
        })
        
        if (author) {
          const newPoints = Math.max(0, author.points + pointsChange)
          await tx.user.update({
            where: { id: authorId },
            data: { points: newPoints }
          })
        }
      }

      // Calculate new vote count
      const votes = await tx.vote.findMany({
        where: {
          ...(itemType === 'question' ? { questionId: itemId } : { answerId: itemId })
        }
      })

      voteCount = votes.reduce((count: number, vote: any) => {
        return count + (vote.type === 'UPVOTE' ? 1 : -1)
      }, 0)
    })

    return NextResponse.json({ 
      success: true, 
      voteCount,
      userVote: existingVote?.type === type ? null : type
    })

  } catch (error) {
    console.error('Error processing vote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to fetch vote information for an item
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const itemType = searchParams.get('itemType')
    const itemId = searchParams.get('itemId')

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get vote count
    const votes = await prisma.vote.findMany({
      where: {
        ...(itemType === 'question' ? { questionId: itemId } : { answerId: itemId })
      }
    })

    const voteCount = votes.reduce((count: number, vote: any) => {
      return count + (vote.type === 'UPVOTE' ? 1 : -1)
    }, 0)

    let userVote = null
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      
      if (user) {
        const existingVote = await prisma.vote.findFirst({
          where: {
            userId: user.id,
            ...(itemType === 'question' ? { questionId: itemId } : { answerId: itemId })
          }
        })
        userVote = existingVote?.type || null
      }
    }

    return NextResponse.json({ 
      success: true, 
      voteCount,
      userVote
    })

  } catch (error) {
    console.error('Error fetching vote information:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
