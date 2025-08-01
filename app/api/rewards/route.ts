import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            redemptions: true
          }
        }
      },
      orderBy: {
        points: 'asc'
      }
    })

    const formattedRewards = rewards.map((reward: any) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      points: reward.points,
      category: reward.category,
      icon: reward.icon,
      available: reward.available,
      redeemed: reward._count.redemptions
    }))

    return NextResponse.json({
      rewards: formattedRewards,
      success: true
    })
  } catch (error) {
    console.error('Rewards API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rewards', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rewardId } = body

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required', success: false },
        { status: 400 }
      )
    }

    // Get user and reward info
    const [user, reward] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email }
      }),
      prisma.reward.findUnique({
        where: { id: rewardId }
      })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      )
    }

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found', success: false },
        { status: 404 }
      )
    }

    if (user.points < reward.points) {
      return NextResponse.json(
        { error: 'Insufficient points', success: false },
        { status: 400 }
      )
    }

    if (reward.available <= 0) {
      return NextResponse.json(
        { error: 'Reward not available', success: false },
        { status: 400 }
      )
    }

    // Create redemption and update user points in a transaction
    const redemption = await prisma.$transaction(async (tx: any) => {
      // Create redemption record
      const newRedemption = await tx.rewardRedemption.create({
        data: {
          userId: user.id,
          rewardId: reward.id,
          points: reward.points,
          status: 'PENDING'
        }
      })

      // Deduct points from user
      await tx.user.update({
        where: { id: user.id },
        data: {
          points: user.points - reward.points
        }
      })

      // Decrease available rewards
      await tx.reward.update({
        where: { id: reward.id },
        data: {
          available: reward.available - 1
        }
      })

      return newRedemption
    })

    return NextResponse.json({
      redemption,
      message: 'Reward redeemed successfully',
      success: true
    })

  } catch (error) {
    console.error('Reward redemption error:', error)
    return NextResponse.json(
      { error: 'Failed to redeem reward', success: false },
      { status: 500 }
    )
  }
}
