"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, Award, TrendingUp, Star, Crown } from "lucide-react"
import { getAvatarFallback } from "@/lib/avatar-utils"

interface LeaderboardUser {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  points: number
  periodScore: number
  change: number
  badges: string[]
  questionsAsked: number
  answersGiven: number
  acceptedAnswers: number
  reputation: number
  level: number
  levelName: string // Add named level
  rank: number
}

interface LeaderboardStats {
  totalUsers: number
  activeUsers: number
  totalQuestions: number
  totalAnswers: number
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("monthly")
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/leaderboard?period=${period}&limit=50`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setLeaderboard(data.leaderboard || [])
          setStats(data.stats)
        } else {
          throw new Error(data.error || 'Failed to fetch leaderboard')
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError('Failed to load leaderboard data.')
        setLeaderboard([])
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeaderboard()
  }, [period])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500" />
      case 2:
        return <Medal className="h-8 w-8 text-gray-400" />
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />
      default:
        return <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{rank}</div>
    }
  }

  const getPeriodTitle = () => {
    switch (period) {
      case 'weekly':
        return 'This Week'
      case 'monthly':
        return 'This Month'
      case 'all-time':
        return 'All Time'
      default:
        return 'This Month'
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">Top contributors to our knowledge base</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active Contributors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Questions Asked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{stats.totalAnswers}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Answers Given</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Contributors - {getPeriodTitle()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {leaderboard.slice(0, 3).map((user, index) => (
                    <div
                      key={user.id}
                      className={`text-center p-4 rounded-lg border-2 ${
                        index === 0
                          ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
                          : index === 1
                            ? "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20"
                            : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                      }`}
                    >
                      <div className="flex justify-center mb-2">{getRankIcon(user.rank)}</div>
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={user.avatar && !user.avatar.includes('placeholder') ? user.avatar : undefined} />
                        <AvatarFallback className={getAvatarFallback(user.name, user.email).className + " text-2xl"}>
                          {getAvatarFallback(user.name, user.email).initials}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{user.bio || 'Community Member'}</p>
                      <div className="text-2xl font-bold text-primary">{user.periodScore}</div>
                      <div className="text-sm text-muted-foreground">{user.periodScore} points</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Full Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className="flex items-center justify-center w-8 h-8">
                        {user.rank <= 3 ? getRankIcon(user.rank) : (
                          <div className="text-sm font-bold text-muted-foreground">#{user.rank}</div>
                        )}
                      </div>

                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar && !user.avatar.includes('placeholder') ? user.avatar : undefined} />
                        <AvatarFallback className={getAvatarFallback(user.name, user.email).className}>
                          {getAvatarFallback(user.name, user.email).initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          {user.badges.length > 0 && user.badges[0] && (
                            <Badge variant="secondary" className="text-xs">
                              {user.badges[0]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.bio || `${user.levelName} • ${user.reputation} reputation`}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold">{user.periodScore}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>

                      <div className="text-right text-xs text-muted-foreground min-w-[80px]">
                        <div>{user.questionsAsked} questions</div>
                        <div>{user.answersGiven} answers</div>
                        <div className="text-green-600">{user.acceptedAnswers} accepted</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No contributors found for this period.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Period Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Period Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Period:</span>
                <span className="text-sm font-medium">{getPeriodTitle()}</span>
              </div>
              {stats && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contributors:</span>
                    <span className="text-sm font-medium">{stats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Questions:</span>
                    <span className="text-sm font-medium">{stats.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Answers:</span>
                    <span className="text-sm font-medium">{stats.totalAnswers}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Achievement Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How Points Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>• Ask a question: +5 points</div>
              <div>• Answer a question: +10 points</div>
              <div>• Get answer accepted: +15 points</div>
              <div>• Get an upvote: +2 points</div>
              <div>• Get a downvote: -1 point</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
