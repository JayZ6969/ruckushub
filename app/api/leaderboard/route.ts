import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserLevel } from '@/lib/levels'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly' // weekly, monthly, all-time
    const limit = parseInt(searchParams.get('limit') || '20')

    // Calculate date range for the period
    const now = new Date()
    let startDate: Date | undefined

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
        break
      case 'monthly':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
        break
      case 'all-time':
      default:
        startDate = undefined // No date filter for all-time
        break
    }

    // Build the where clause for the period
    const periodFilter = startDate ? { 
      createdAt: { gte: startDate } 
    } : {}

    // Get users with their activity counts and points
    const users = await prisma.user.findMany({
      include: {
        questions: {
          where: periodFilter,
          select: { id: true }
        },
        answers: {
          where: {
            ...periodFilter,
            isAccepted: true
          },
          select: { id: true }
        },
        _count: {
          select: {
            questions: {
              where: periodFilter
            },
            answers: {
              where: periodFilter
            }
          }
        }
      }
    })

    // Calculate scores and format leaderboard data
    const leaderboardData = users.map((user: any, index: number) => {
      const questionsAsked = user._count.questions
      const answersGiven = user._count.answers
      const acceptedAnswers = user.answers.length
      
      // Calculate score: base points + questions asked * 5 + answers given * 10 + accepted answers * 15
      const periodScore = user.points + 
                         (questionsAsked * 5) + 
                         (answersGiven * 10) + 
                         (acceptedAnswers * 15)

      // Calculate change (for now, we'll set it to 0 since we don't have historical data)
      const change = 0

      // Get user level information
      const levelInfo = getUserLevel(user.points, user.reputation)

      return {
        id: user.id,
        name: user.name || 'Anonymous User',
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        points: user.points,
        periodScore,
        change: change,
        badges: user.badges ? user.badges.split(',').map((b: string) => b.trim()).filter((b: string) => b) : [],
        questionsAsked,
        answersGiven,
        acceptedAnswers,
        reputation: user.reputation,
        level: levelInfo.levelNumber, // Keep numeric for compatibility
        levelName: levelInfo.level, // Add named level
      }
    })

    // Sort by period score (descending) and add ranks
    const sortedLeaderboard = leaderboardData
      .sort((a: any, b: any) => b.periodScore - a.periodScore)
      .slice(0, limit)
      .map((user: any, index: number) => ({
        ...user,
        rank: index + 1
      }))

    // Get some summary stats
    const totalUsers = users.length
    const activeUsers = users.filter((u: any) => u._count.questions > 0 || u._count.answers > 0).length

    return NextResponse.json({
      success: true,
      leaderboard: sortedLeaderboard,
      period,
      stats: {
        totalUsers,
        activeUsers,
        totalQuestions: users.reduce((sum: number, u: any) => sum + u._count.questions, 0),
        totalAnswers: users.reduce((sum: number, u: any) => sum + u._count.answers, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
