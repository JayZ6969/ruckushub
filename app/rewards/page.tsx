"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, Star, Coffee, ShoppingCart, Award, Zap, Crown, Heart, Sparkles } from "lucide-react"

const iconMap = {
  Gift,
  Star,
  Coffee,
  ShoppingCart,
  Award,
  Zap,
  Crown,
  Heart,
  Sparkles
}

interface Reward {
  id: string
  name: string
  description: string
  points: number
  category: string
  icon: string
  available: number
  redeemed: number
}

interface UserStats {
  totalPoints: number
  availablePoints: number
  spentPoints: number
  reputation: number
  currentLevel: string
  nextLevel: string
  pointsToNextLevel: number
  badges: {
    name: string
    earned: boolean
    icon: string
    description: string
  }[]
  recentRedemptions: {
    id: string
    reward: string
    points: number
    date: string
    status: string
  }[]
  questionsAsked: number
  answersGiven: number
}

export default function RewardsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [rewards, setRewards] = useState<Reward[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRewardsData() {
      try {
        setLoading(true)
        const [rewardsRes, userStatsRes] = await Promise.all([
          fetch('/api/rewards'),
          fetch('/api/user/stats')
        ])

        if (rewardsRes.ok) {
          const rewardsData = await rewardsRes.json()
          if (rewardsData.success) {
            setRewards(rewardsData.rewards || [])
          }
        }

        if (userStatsRes.ok) {
          const userStatsData = await userStatsRes.json()
          if (userStatsData.success) {
            setUserStats(userStatsData.userStats)
          }
        }
      } catch (err) {
        console.error('Error fetching rewards data:', err)
        setError('Failed to load rewards data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchRewardsData()
  }, [])

  const handleRedeem = async (rewardId: string, points: number) => {
    if (!userStats || userStats.availablePoints < points) {
      alert('Insufficient points!')
      return
    }

    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId }),
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Reward redeemed successfully!')
        // Refresh the data
        window.location.reload()
      } else {
        alert(data.error || 'Failed to redeem reward')
      }
    } catch (err) {
      console.error('Error redeeming reward:', err)
      alert('Failed to redeem reward. Please try again.')
    }
  }

  const filteredRewards =
    selectedCategory === "all"
      ? rewards
      : rewards.filter((reward) => reward.category.toLowerCase().includes(selectedCategory))

  const progressPercentage = userStats 
    ? ((userStats.totalPoints - userStats.pointsToNextLevel) / userStats.totalPoints) * 100 
    : 0

  // Get unique categories from rewards for filter buttons
  const categories = Array.from(new Set(rewards.map(reward => reward.category.toLowerCase())))

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading rewards...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!userStats) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          <p className="text-sm">Please log in to view rewards and stats.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rewards Center</h1>
        <p className="text-muted-foreground">Redeem your help points for awesome rewards and perks</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Tabs defaultValue="available" className="space-y-4">
            <TabsList>
              <TabsTrigger value="available">Available Rewards</TabsTrigger>
              <TabsTrigger value="history">Redemption History</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4">
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>

              {filteredRewards.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No rewards available</h3>
                    <p className="text-muted-foreground">Check back later for new rewards to redeem with your points!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredRewards.map((reward) => {
                    const IconComponent = iconMap[reward.icon as keyof typeof iconMap] || Gift
                    return (
                      <Card key={reward.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{reward.name}</CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  {reward.category}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">{reward.points}</div>
                              <div className="text-xs text-muted-foreground">points</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-muted-foreground">{reward.available} available</span>
                            {reward.redeemed > 0 && (
                              <span className="text-xs text-muted-foreground">You've redeemed {reward.redeemed}</span>
                            )}
                          </div>
                          <Button
                            className="w-full"
                            disabled={userStats.availablePoints < reward.points || reward.available === 0}
                            onClick={() => handleRedeem(reward.id, reward.points)}
                          >
                            {userStats.availablePoints < reward.points
                              ? "Not enough points"
                              : reward.available === 0
                                ? "Out of stock"
                                : "Redeem"}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Redemptions</CardTitle>
                </CardHeader>
                <CardContent>
                  {userStats.recentRedemptions.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No redemptions yet</h3>
                      <p className="text-muted-foreground">Start redeeming rewards to see your history here!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userStats.recentRedemptions.map((redemption) => (
                        <div key={redemption.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <h4 className="font-medium">{redemption.reward}</h4>
                            <p className="text-sm text-muted-foreground">{redemption.date}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">-{redemption.points} pts</div>
                            <Badge variant="outline" className="text-xs">
                              {redemption.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Points Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Your Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{userStats.availablePoints}</div>
                <div className="text-sm text-muted-foreground">Available Points</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Earned</span>
                  <span>{userStats.totalPoints}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Spent</span>
                  <span>{userStats.spentPoints}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Level Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{userStats.currentLevel}</span>
                  <span>{userStats.nextLevel}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{userStats.pointsToNextLevel} points to next level</p>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Your Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userStats.badges.length === 0 ? (
                <div className="text-center py-4">
                  <Award className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No badges earned yet. Keep contributing to earn badges!</p>
                </div>
              ) : (
                userStats.badges.map((badge) => {
                  const BadgeIcon = iconMap[badge.icon as keyof typeof iconMap] || Award
                  return (
                    <div key={badge.name} className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          badge.earned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <BadgeIcon className="h-4 w-4" />
                      </div>
                      <span className={`text-sm ${badge.earned ? "font-medium" : "text-muted-foreground"}`}>
                        {badge.name}
                      </span>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* How to Earn */}
          <Card>
            <CardHeader>
              <CardTitle>How to Earn Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ask a question</span>
                <span className="font-medium">+5 pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Answer a question</span>
                <span className="font-medium">+10 pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Get an upvote</span>
                <span className="font-medium">+2 pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Accepted answer</span>
                <span className="font-medium">+15 pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Daily login</span>
                <span className="font-medium">+1 pt</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
