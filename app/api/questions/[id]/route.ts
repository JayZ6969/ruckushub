import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params

    const question = await prisma.question.findUnique({
      where: { id: questionId },
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        },
        votes: {
          select: {
            type: true
          }
        },
        _count: {
          select: {
            answers: true
          }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found', success: false },
        { status: 404 }
      )
    }

    // Calculate vote count
    const voteCount = question.votes.reduce((count: number, vote: any) => {
      return count + (vote.type === 'UPVOTE' ? 1 : -1)
    }, 0)

    const formattedQuestion = {
      ...question,
      author: {
        ...question.author,
        reputation: question.author.points
      },
      answerCount: question._count.answers,
      voteCount,
      tags: question.tags.map((tag: any) => tag.name)
    }

    return NextResponse.json({
      question: formattedQuestion,
      success: true
    })
  } catch (error) {
    console.error('Error fetching question:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question', success: false },
      { status: 500 }
    )
  }
}

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

    const { id: questionId } = await params

    // First, get the question to check ownership and calculate points to deduct
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            points: true
          }
        },
        answers: {
          include: {
            author: {
              select: {
                id: true,
                points: true
              }
            },
            votes: true
          }
        },
        votes: true
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found', success: false },
        { status: 404 }
      )
    }

    // Check if user is the author
    const isAuthor = question.author.email === session.user.email

    if (!isAuthor) {
      return NextResponse.json(
        { error: 'You can only delete your own questions', success: false },
        { status: 403 }
      )
    }

    // Calculate points to deduct from question author
    // Base points for asking a question (let's say 5 points)
    // Plus points from upvotes on the question (2 points per upvote)
    // Minus points from downvotes on the question (1 point per downvote)
    const questionUpvotes = question.votes.filter((vote: any) => vote.type === 'UPVOTE').length
    const questionDownvotes = question.votes.filter((vote: any) => vote.type === 'DOWNVOTE').length
    const questionPointsToDeduct = 5 + (questionUpvotes * 2) - (questionDownvotes * 1)

    // Calculate points to deduct from answer authors
    const answerPointsToDeduct: { authorId: string, points: number }[] = []
    
    for (const answer of question.answers) {
      const answerUpvotes = answer.votes.filter((vote: any) => vote.type === 'UPVOTE').length
      const answerDownvotes = answer.votes.filter((vote: any) => vote.type === 'DOWNVOTE').length
      const points = 10 + (answerUpvotes * 2) - (answerDownvotes * 1) // 10 base points for answering
      
      answerPointsToDeduct.push({
        authorId: answer.author.id,
        points: Math.max(0, points) // Don't deduct negative points
      })
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx: any) => {
      // Deduct points from question author
      if (questionPointsToDeduct > 0) {
        await tx.user.update({
          where: { id: question.author.id },
          data: { 
            points: { 
              decrement: Math.min(questionPointsToDeduct, question.author.points) // Don't go below 0
            }
          }
        })
      }

      // Deduct points from answer authors
      for (const deduction of answerPointsToDeduct) {
        if (deduction.points > 0) {
          const author = await tx.user.findUnique({
            where: { id: deduction.authorId },
            select: { points: true }
          })
          
          if (author) {
            await tx.user.update({
              where: { id: deduction.authorId },
              data: { 
                points: { 
                  decrement: Math.min(deduction.points, author.points) // Don't go below 0
                }
              }
            })
          }
        }
      }

      // Delete the question (this will cascade delete answers, votes, etc.)
      await tx.question.delete({
        where: { id: questionId }
      })
    })

    return NextResponse.json({
      message: 'Question deleted successfully',
      success: true
    })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Failed to delete question', success: false },
      { status: 500 }
    )
  }
}