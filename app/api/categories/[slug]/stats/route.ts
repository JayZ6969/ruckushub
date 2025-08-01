import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    // Find the category first
    const category = await prisma.category.findUnique({
      where: { slug }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Get current date and date ranges for comparison
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))

    // Fetch category-specific statistics in parallel
    const [
      totalQuestions,
      questionsLast30Days,
      questionsPrevious30Days,
      answeredQuestions,
      answeredQuestionsLast30Days,
      answeredQuestionsPrevious30Days,
      uniqueAuthors,
      uniqueAuthorsLast30Days,
      uniqueAuthorsPrevious30Days,
      resolvedQuestions,
      resolvedQuestionsLast30Days,
      resolvedQuestionsPrevious30Days,
      totalViews,
      totalAnswers
    ] = await Promise.all([
      // Total questions in this category
      prisma.question.count({
        where: { categoryId: category.id }
      }),
      
      // Questions from last 30 days
      prisma.question.count({
        where: {
          categoryId: category.id,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Questions from 30-60 days ago
      prisma.question.count({
        where: {
          categoryId: category.id,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      }),
      
      // Questions with answers in this category
      prisma.question.count({
        where: {
          categoryId: category.id,
          answers: { some: {} }
        }
      }),
      
      // Questions with answers from last 30 days
      prisma.question.count({
        where: {
          categoryId: category.id,
          answers: { some: {} },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Questions with answers from 30-60 days ago
      prisma.question.count({
        where: {
          categoryId: category.id,
          answers: { some: {} },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      }),
      
      // Unique authors in this category (all time)
      prisma.question.findMany({
        where: { categoryId: category.id },
        select: { authorId: true },
        distinct: ['authorId']
      }),
      
      // Unique authors from last 30 days
      prisma.question.findMany({
        where: {
          categoryId: category.id,
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { authorId: true },
        distinct: ['authorId']
      }),
      
      // Unique authors from 30-60 days ago
      prisma.question.findMany({
        where: {
          categoryId: category.id,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        },
        select: { authorId: true },
        distinct: ['authorId']
      }),
      
      // Resolved questions (with accepted answers)
      prisma.question.count({
        where: {
          categoryId: category.id,
          answers: { some: { isAccepted: true } }
        }
      }),
      
      // Resolved questions from last 30 days
      prisma.question.count({
        where: {
          categoryId: category.id,
          answers: { some: { isAccepted: true } },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Resolved questions from 30-60 days ago
      prisma.question.count({
        where: {
          categoryId: category.id,
          answers: { some: { isAccepted: true } },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      }),
      
      // Total views in this category
      prisma.question.aggregate({
        where: { categoryId: category.id },
        _sum: { views: true }
      }),
      
      // Total answers in this category
      prisma.answer.count({
        where: {
          question: { categoryId: category.id }
        }
      })
    ])

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%'
      const change = ((current - previous) / previous) * 100
      return change >= 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`
    }

    // Calculate help score based on resolved questions and engagement
    const helpScore = totalAnswers + resolvedQuestions + Math.floor((totalViews._sum.views || 0) / 100)

    const stats = {
      totalQuestions: {
        value: totalQuestions.toString(),
        change: calculatePercentageChange(questionsLast30Days, questionsPrevious30Days)
      },
      answeredQuestions: {
        value: answeredQuestions.toString(),
        change: calculatePercentageChange(answeredQuestionsLast30Days, answeredQuestionsPrevious30Days)
      },
      contributors: {
        value: uniqueAuthors.length.toString(),
        change: calculatePercentageChange(uniqueAuthorsLast30Days.length, uniqueAuthorsPrevious30Days.length)
      },
      helpScore: {
        value: helpScore > 1000 ? `${Math.round(helpScore / 1000 * 10) / 10}k` : helpScore.toString(),
        change: calculatePercentageChange(resolvedQuestionsLast30Days, resolvedQuestionsPrevious30Days)
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching category stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category statistics' },
      { status: 500 }
    )
  }
}
