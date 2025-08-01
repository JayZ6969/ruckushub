import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserLevel } from '@/lib/levels'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          reputation: true,
          points: true,
          level: true,
          badges: true,
          createdAt: true,
          _count: {
            select: {
              questions: true,
              answers: true
            }
          }
        },
        orderBy: { reputation: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    const formattedUsers = users.map((user: any) => {
      const levelInfo = getUserLevel(user.points, user.reputation)
      return {
        ...user,
        level: levelInfo.level, // Use named level instead of numeric
        questionCount: user._count.questions,
        answerCount: user._count.answers
      }
    })

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      success: true
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, avatar, bio } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required', success: false },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        avatar,
        bio
      }
    })

    const levelInfo = getUserLevel(user.points, user.reputation)
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
        points: user.points,
        level: levelInfo.level // Use named level instead of numeric
      },
      success: true
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user', success: false },
      { status: 500 }
    )
  }
}
