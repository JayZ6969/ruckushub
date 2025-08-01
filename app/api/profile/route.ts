import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserLevel } from '@/lib/levels'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user's profile data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        questions: {
          include: {
            category: {
              select: {
                name: true,
                slug: true
              }
            },
            tags: {
              select: {
                name: true
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
          take: 10
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true
              }
            },
            _count: {
              select: {
                votes: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            questions: true,
            answers: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate stats and level information
    const acceptedAnswers = user.answers.filter((answer: any) => answer.isAccepted).length
    const totalVotes = user.answers.reduce((sum: number, answer: any) => sum + answer._count.votes, 0)
    const levelInfo = getUserLevel(user.points || 0, user.reputation || 0)

    // Format badges (assuming badges are stored as comma-separated string)
    const badges = user.badges ? user.badges.split(',').map((badge: string) => {
      const trimmedBadge = badge.trim()
      return {
        name: trimmedBadge,
        description: getBadgeDescription(trimmedBadge),
        earned: true,
        date: user.createdAt.toLocaleDateString()
      }
    }) : []

    // Format questions
    const formattedQuestions = user.questions.map((question: any) => ({
      id: question.id,
      title: question.title,
      content: question.content.substring(0, 200) + '...',
      author: user.name || 'Anonymous',
      authorAvatar: user.avatar || '/placeholder.svg?height=32&width=32',
      category: question.category.name,
      tags: question.tags.map((tag: any) => tag.name),
      votes: question._count.votes,
      answers: question._count.answers,
      views: question.views,
      createdAt: formatDate(question.createdAt),
      hasAcceptedAnswer: question.isResolved
    }))

    // Format answers
    const formattedAnswers = user.answers.map((answer: any) => ({
      id: answer.id,
      questionTitle: answer.question.title,
      questionId: answer.question.id,
      votes: answer._count.votes,
      isAccepted: answer.isAccepted,
      createdAt: formatDate(answer.createdAt)
    }))

    const profile = {
      id: user.id,
      name: user.name || 'Anonymous User',
      title: user.title || 'Team Member',
      department: user.department || 'Unknown',
      location: user.location || 'Unknown',
      website: user.website || '',
      email: user.email,
      joinDate: formatDate(user.createdAt),
      avatar: user.avatar || '/placeholder.svg?height=80&width=80',
      bio: user.bio || 'No bio provided.',
      stats: {
        totalPoints: user.points || 0,
        questionsAsked: user._count.questions,
        answersGiven: user._count.answers,
        acceptedAnswers,
        helpfulVotes: totalVotes,
        currentStreak: 0, // Would need additional logic to calculate
        reputation: user.reputation || 0,
        level: levelInfo.level
      },
      badges,
      questions: formattedQuestions,
      answers: formattedAnswers
    }

    return NextResponse.json({
      success: true,
      profile,
      user: {
        id: user.id,
        name: user.name || 'Anonymous User',
        email: user.email,
        avatar: user.avatar || '/placeholder-user.jpg',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        points: user.points || 0,
        reputation: user.reputation || 0,
        level: levelInfo.level,
        badges: user.badges ? user.badges.split(',') : [],
        joinedAt: user.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, title, bio, location, department, website } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        title,
        bio,
        location,
        department,
        website
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        title: updatedUser.title,
        bio: updatedUser.bio,
        location: updatedUser.location,
        department: updatedUser.department,
        website: updatedUser.website,
        avatar: updatedUser.avatar,
        points: updatedUser.points,
        reputation: updatedUser.reputation,
        level: getUserLevel(updatedUser.points || 0, updatedUser.reputation || 0).level,
        badges: updatedUser.badges ? updatedUser.badges.split(',') : [],
        joinedAt: updatedUser.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

function getBadgeDescription(badgeName: string): string {
  const badgeDescriptions: { [key: string]: string } = {
    'First Answer': 'Posted your first answer',
    'Quick Responder': 'Answered within 1 hour',
    'Problem Solver': 'Solved 10 complex problems',
    'Top Helper': 'Top contributor this month',
    'Mentor': 'Helped 25+ colleagues',
    'Expert': 'Reached 2000 points',
    'Contributor': 'Made valuable contributions',
    'Helper': 'Provided helpful answers'
  }
  return badgeDescriptions[badgeName] || 'Achievement earned'
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    }
    return `${diffInHours} hours ago`
  } else if (diffInDays === 1) {
    return '1 day ago'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}
