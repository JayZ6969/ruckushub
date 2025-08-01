// Centralized badge system utilities
import { prisma } from '@/lib/db'

export interface Badge {
  name: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: string
}

export interface BadgeRequirement {
  name: string
  description: string
  icon: string
  condition: (user: {
    points: number
    reputation: number
    questionsCount: number
    answersCount: number
    acceptedAnswersCount: number
    createdAt: Date
  }) => boolean
}

// Define all available badges and their requirements
export const BADGE_DEFINITIONS: BadgeRequirement[] = [
  {
    name: "First Answer",
    description: "Posted your first answer",
    icon: "Star",
    condition: (user) => user.answersCount >= 1
  },
  {
    name: "Quick Responder", 
    description: "Answered 5 questions",
    icon: "Zap",
    condition: (user) => user.answersCount >= 5
  },
  {
    name: "Problem Solver",
    description: "Earned 100+ reputation", 
    icon: "Award",
    condition: (user) => user.reputation >= 100
  },
  {
    name: "Top Helper",
    description: "Answered 20+ questions",
    icon: "Crown", 
    condition: (user) => user.answersCount >= 20
  },
  {
    name: "Mentor",
    description: "Earned 500+ reputation",
    icon: "Heart",
    condition: (user) => user.reputation >= 500
  },
  {
    name: "Expert",
    description: "Earned 1000+ reputation",
    icon: "Trophy",
    condition: (user) => user.reputation >= 1000
  },
  {
    name: "First Question",
    description: "Asked your first question",
    icon: "HelpCircle",
    condition: (user) => user.questionsCount >= 1
  },
  {
    name: "Curious Mind",
    description: "Asked 10 questions",
    icon: "BookOpen",
    condition: (user) => user.questionsCount >= 10
  },
  {
    name: "Answer Master",
    description: "Had 5 answers accepted",
    icon: "CheckCircle",
    condition: (user) => user.acceptedAnswersCount >= 5
  },
  {
    name: "Veteran",
    description: "Active member for 30+ days",
    icon: "Calendar",
    condition: (user) => {
      const daysSinceJoined = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceJoined >= 30
    }
  }
]

export function calculateUserBadges(user: {
  points: number
  reputation: number
  questionsCount: number
  answersCount: number
  acceptedAnswersCount: number
  createdAt: Date
}): Badge[] {
  return BADGE_DEFINITIONS.map(badge => ({
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    earned: badge.condition(user),
    earnedDate: badge.condition(user) ? new Date().toISOString() : undefined
  }))
}

export function getEarnedBadges(user: {
  points: number
  reputation: number
  questionsCount: number
  answersCount: number
  acceptedAnswersCount: number
  createdAt: Date
}): Badge[] {
  return calculateUserBadges(user).filter(badge => badge.earned)
}

export function getBadgeByName(name: string): BadgeRequirement | undefined {
  return BADGE_DEFINITIONS.find(badge => badge.name === name)
}

// Convert comma-separated badge string to badge array
export function parseBadgeString(badgeString: string): string[] {
  if (!badgeString) return []
  return badgeString.split(',').map(b => b.trim()).filter(b => b)
}

// Convert badge array to comma-separated string
export function stringifyBadges(badges: string[]): string {
  return badges.join(',')
}

// Award badges to a user when they perform an action
export async function awardBadges(userId: string): Promise<void> {
  try {
    // Get user data with counts for badge calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            questions: true,
            answers: true
          }
        },
        answers: {
          where: { isAccepted: true },
          select: { id: true }
        }
      }
    })

    if (!user) return

    // Calculate which badges should be earned
    const earnedBadges = getEarnedBadges({
      points: user.points,
      reputation: user.reputation,
      questionsCount: user._count.questions,
      answersCount: user._count.answers,
      acceptedAnswersCount: user.answers.length,
      createdAt: user.createdAt
    })

    // Get currently stored badges
    const currentBadges = parseBadgeString(user.badges || '')
    
    // Find new badges to award
    const newBadges = earnedBadges
      .filter(badge => badge.earned)
      .map(badge => badge.name)
      .filter(badgeName => !currentBadges.includes(badgeName))

    // If there are new badges to award, update the user
    if (newBadges.length > 0) {
      const allBadges = [...currentBadges, ...newBadges]
      await prisma.user.update({
        where: { id: userId },
        data: {
          badges: stringifyBadges(allBadges)
        }
      })
      
      console.log(`Awarded badges to user ${userId}:`, newBadges)
    }
  } catch (error) {
    console.error('Error awarding badges:', error)
  }
}
