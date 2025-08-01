import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // 'all', 'questions', 'users', 'answers'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required', success: false },
        { status: 400 }
      )
    }

    const results: any = {}

    if (type === 'all' || type === 'questions') {
      const questions = await prisma.question.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } }
          ]
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              reputation: true
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
          _count: {
            select: {
              answers: true,
              votes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      results.questions = questions.map((question: any) => ({
        ...question,
        answerCount: question._count.answers,
        voteCount: question._count.votes
      }))
    }

    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { bio: { contains: query } }
          ]
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          bio: true,
          reputation: true,
          points: true,
          level: true,
          _count: {
            select: {
              questions: true,
              answers: true
            }
          }
        },
        orderBy: { reputation: 'desc' },
        take: limit
      })

      results.users = users.map((user: any) => ({
        ...user,
        questionCount: user._count.questions,
        answerCount: user._count.answers
      }))
    }

    if (type === 'all' || type === 'answers') {
      const answers = await prisma.answer.findMany({
        where: {
          content: { contains: query }
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              reputation: true
            }
          },
          question: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          _count: {
            select: {
              votes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      results.answers = answers.map((answer: any) => ({
        ...answer,
        voteCount: answer._count.votes
      }))
    }

    return NextResponse.json({
      results,
      query,
      success: true
    })
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Search failed', success: false },
      { status: 500 }
    )
  }
}
