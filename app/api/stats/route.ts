import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date and date 30 days ago for comparison
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))

    // Fetch all statistics in parallel
    const [
      totalQuestions,
      questionsLast30Days,
      questionsPrevious30Days,
      totalCategories, 
      categoriesLast30Days,
      categoriesPrevious30Days,
      totalUsers,
      usersLast30Days,
      usersPrevious30Days,
      totalAnswers,
      answersLast30Days,
      answersPrevious30Days,
      totalViews,
      resolvedQuestions
    ] = await Promise.all([
      // Total questions (all time)
      prisma.question.count(),
      
      // Questions from last 30 days
      prisma.question.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Questions from 30-60 days ago (previous month)
      prisma.question.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Total categories
      prisma.category.count(),
      
      // Categories from last 30 days
      prisma.category.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Categories from 30-60 days ago
      prisma.category.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Total users
      prisma.user.count(),
      
      // Users from last 30 days
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Users from 30-60 days ago
      prisma.user.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Total answers
      prisma.answer.count(),
      
      // Answers from last 30 days
      prisma.answer.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Answers from 30-60 days ago
      prisma.answer.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Total views (sum of all question views)
      prisma.question.aggregate({
        _sum: {
          views: true
        }
      }),
      
      // Resolved questions (questions with accepted answers)
      prisma.question.count({
        where: {
          answers: {
            some: {
              isAccepted: true
            }
          }
        }
      })
    ])

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%'
      const change = ((current - previous) / previous) * 100
      return change >= 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`
    }

    // Calculate help score based on resolved questions and total engagement
    const helpScore = totalAnswers + resolvedQuestions + Math.floor((totalViews._sum.views || 0) / 100)

    const stats = {
      totalQuestions: {
        value: totalQuestions.toString(),
        change: calculatePercentageChange(questionsLast30Days, questionsPrevious30Days)
      },
      categories: {
        value: totalCategories.toString(),
        change: calculatePercentageChange(categoriesLast30Days, categoriesPrevious30Days)
      },
      activeUsers: {
        value: totalUsers.toString(),
        change: calculatePercentageChange(usersLast30Days, usersPrevious30Days)
      },
      helpScore: {
        value: helpScore > 1000 ? `${Math.round(helpScore / 1000 * 10) / 10}k` : helpScore.toString(),
        change: calculatePercentageChange(answersLast30Days, answersPrevious30Days)
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
