import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required', success: false },
        { status: 400 }
      )
    }

    const answers = await prisma.answer.findMany({
      where: { questionId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            points: true
          }
        },
        votes: {
          select: {
            type: true
          }
        }
      },
      orderBy: [
        { isAccepted: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    const formattedAnswers = answers.map((answer: any) => {
      // Calculate vote count
      const voteCount = answer.votes.reduce((count: number, vote: any) => {
        return count + (vote.type === 'UPVOTE' ? 1 : -1)
      }, 0)

      return {
        id: answer.id,
        content: answer.content,
        author: {
          name: answer.author.name,
          email: answer.author.email,
          avatar: answer.author.avatar,
          reputation: answer.author.points
        },
        voteCount,
        isAccepted: answer.isAccepted,
        createdAt: answer.createdAt.toISOString()
      }
    })

    return NextResponse.json({
      answers: formattedAnswers,
      success: true
    })
  } catch (error) {
    console.error('Error fetching answers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch answers', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, questionId } = body

    if (!content || !questionId) {
      return NextResponse.json(
        { error: 'Content and question ID are required', success: false },
        { status: 400 }
      )
    }

    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found', success: false },
        { status: 404 }
      )
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      )
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        questionId,
        authorId: user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            points: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      }
    })

    // Award points for answering
    await prisma.user.update({
      where: { id: user.id },
      data: {
        points: { increment: 10 }
      }
    })

    return NextResponse.json({
      answer: {
        id: answer.id,
        content: answer.content,
        author: {
          name: answer.author.name,
          email: answer.author.email,
          avatar: answer.author.avatar,
          reputation: answer.author.points + 10
        },
        voteCount: answer._count.votes,
        isAccepted: answer.isAccepted,
        createdAt: answer.createdAt.toISOString()
      },
      success: true
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating answer:', error)
    return NextResponse.json(
      { error: 'Failed to create answer', success: false },
      { status: 500 }
    )
  }
}
