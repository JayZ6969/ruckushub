"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Clock, MessageSquare, CheckCircle, Award } from "lucide-react"
import Link from "next/link"
import { QuestionCard } from "@/components/question-card"
import { StatsCard } from "@/components/stats-card"

interface Question {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  category: {
    name: string
    slug: string
    color: string
  }
  tags: string[]
  voteCount: number
  answerCount: number
  views: number
  createdAt: string
  isResolved: boolean
}

interface Stats {
  totalQuestions: { value: string; change: string }
  categories: { value: string; change: string }
  activeUsers: { value: string; change: string }
  helpScore: { value: string; change: string }
}

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before making API calls
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      // Only fetch if component is mounted and we're in the browser
      if (!isMounted || typeof window === 'undefined' || !mounted) return
      
      try {
        setLoading(true)
        setError(null)
        
        const questionsPromise = fetch('/api/questions?limit=10')
        const statsPromise = fetch('/api/stats')
        
        const [questionsRes, statsRes] = await Promise.all([
          questionsPromise,
          statsPromise
        ])

        // Check if component is still mounted before updating state
        if (!isMounted) return

        if (!questionsRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const [questionsData, statsData] = await Promise.all([
          questionsRes.json(),
          statsRes.json()
        ])

        // Check if component is still mounted before updating state
        if (!isMounted) return

        if (questionsData.success) {
          setQuestions(questionsData.questions || [])
        }
        if (statsData.success) {
          setStats(statsData.stats)
        }
      } catch (err) {
        if (!isMounted) return
        
        console.error('Error fetching data:', err)
        setError('Failed to load data. Please refresh the page.')
        // Set empty arrays since we don't want fallback dummy data
        setQuestions([])
        setStats(null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [mounted])

  // Transform questions for QuestionCard component
  const transformedQuestions = questions.map(q => ({
    id: q.id, // Keep as string - don't parse to int since we're using cuid IDs
    title: q.title,
    content: q.content,
    author: q.author.name,
    authorAvatar: q.author.avatar || "/placeholder.svg?height=32&width=32",
    category: q.category.name,
    tags: Array.isArray(q.tags) ? q.tags : [],
    votes: q.voteCount,
    answers: q.answerCount,
    views: q.views,
    createdAt: q.createdAt,
    hasAcceptedAnswer: q.isResolved
  }))

  if (!mounted || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Q&A Platform</h1>
          <p className="text-muted-foreground">Share knowledge, get answers, and help your colleagues succeed</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Questions" 
          value={stats?.totalQuestions.value || "0"} 
          change={stats?.totalQuestions.change || "0%"} 
          icon={MessageSquare} 
        />
        <StatsCard 
          title="Categories" 
          value={stats?.categories.value || "0"} 
          change={stats?.categories.change || "0%"} 
          icon={CheckCircle} 
        />
        <StatsCard 
          title="Active Users" 
          value={stats?.activeUsers.value || "0"} 
          change={stats?.activeUsers.change || "0%"} 
          icon={TrendingUp} 
        />
        <StatsCard 
          title="Help Score" 
          value={stats?.helpScore.value || "0"} 
          change={stats?.helpScore.change || "0%"} 
          icon={Award} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="trending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="space-y-4">
              {transformedQuestions.slice(0, 5).map((question, index) => (
                <QuestionCard key={`trending-${question.id}-${index}`} question={question} />
              ))}
              {transformedQuestions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No questions found.</p>
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              {transformedQuestions.slice(-5).map((question, index) => (
                <QuestionCard key={`recent-${question.id}-${index}`} question={question} />
              ))}
              {transformedQuestions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No questions found.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" asChild>
                <Link href="/ask">Ask a Question</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/rewards">View Rewards</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
