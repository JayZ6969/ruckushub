import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { getUserLevel } from '@/lib/levels'
import { calculateUserBadges } from '@/lib/badges'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        redemptions: {
          include: {
            reward: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            questions: true,
            answers: true
          }
        },
        answers: {
          where: {
            isAccepted: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      )
    }

    // Calculate total points spent
    const totalSpent = await prisma.rewardRedemption.aggregate({
      where: { userId: user.id },
      _sum: { points: true }
    })

    // Calculate user level based on reputation/points
    const levelInfo = getUserLevel(user.points, user.reputation)

    // Calculate badges using centralized system
    const badges = calculateUserBadges({
      points: user.points,
      reputation: user.reputation,
      questionsCount: user._count.questions,
      answersCount: user._count.answers,
      acceptedAnswersCount: user.answers.length,
      createdAt: user.createdAt
    })

    // Format recent redemptions
    const recentRedemptions = user.redemptions.map((redemption: any) => ({
      id: redemption.id,
      reward: redemption.reward.name,
      points: redemption.points,
      date: redemption.createdAt,
      status: redemption.status
    }))

    const userStats = {
      totalPoints: user.points + (totalSpent._sum.points || 0),
      availablePoints: user.points,
      spentPoints: totalSpent._sum.points || 0,
      reputation: user.reputation,
      currentLevel: levelInfo.level,
      nextLevel: levelInfo.next,
      pointsToNextLevel: Math.max(0, levelInfo.pointsToNext),
      badges,
      recentRedemptions,
      questionsAsked: user._count.questions,
      answersGiven: user._count.answers
    }

    return NextResponse.json({
      userStats,
      success: true
    })

  } catch (error) {
    console.error('User stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats', success: false },
      { status: 500 }
    )
  }
}
