import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (category) {
      where.category = {
        slug: category
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ]
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
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
        skip,
        take: limit
      }),
      prisma.question.count({ where })
    ])

    const formattedQuestions = questions.map((question: any) => ({
      ...question,
      answerCount: question._count.answers,
      voteCount: question._count.votes,
      tags: question.tags ? question.tags.split(',').map((tag: string) => tag.trim()) : []
    }))

    return NextResponse.json({
      questions: formattedQuestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      success: true
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, categoryId, tags } = body

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Title, content, and category are required', success: false },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      )
    }

    const slug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now()

    // Use transaction to create question and award points
    const question = await prisma.$transaction(async (tx: any) => {
      // Create the question
      const newQuestion = await tx.question.create({
        data: {
          title,
          content,
          slug,
          authorId: user.id,
          categoryId,
          tags: {
            connectOrCreate: Array.isArray(tags) ? tags.map((tagName: string) => ({
              where: { name: tagName },
              create: { 
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
              }
            })) : []
          }
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
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
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Award 5 points for asking a question
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: 5 } }
      })

      return newQuestion
    })

    return NextResponse.json({
      question,
      success: true
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to create question', success: false },
      { status: 500 }
    )
  }
}
