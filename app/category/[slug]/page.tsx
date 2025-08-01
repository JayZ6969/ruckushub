"use client"
import { useState, useEffect } from "react"
import { notFound, useParams } from "next/navigation"
import { QuestionCard } from "@/components/question-card"
import { StatsCard } from "@/components/stats-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Server, Package, Users, HelpCircle, BarChart3, CheckCircle, UserCheck, Star, TrendingUp, Clock, MessageSquare, ThumbsUp } from "lucide-react"

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

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  questionCount: number
}

interface CategoryStats {
  totalQuestions: { value: string; change: string }
  answeredQuestions: { value: string; change: string }
  contributors: { value: string; change: string }
  helpScore: { value: string; change: string }
}

const iconMap = {
  'Code': Code,
  'Server': Server,
  'Package': Package,
  'Users': Users,
  'HelpCircle': HelpCircle,
  'Headphones': Users, // Fallback for headphones icon
}

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [category, setCategory] = useState<Category | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<CategoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch category info, questions for this category, and category stats
        const [categoryRes, questionsRes, statsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/questions?category=${slug}&limit=50`),
          fetch(`/api/categories/${slug}/stats`)
        ])
        
        if (!categoryRes.ok || !questionsRes.ok) {
          throw new Error('Failed to fetch category data')
        }
        
        const [categoriesData, questionsData, statsData] = await Promise.all([
          categoryRes.json(),
          questionsRes.json(),
          statsRes.ok ? statsRes.json() : null
        ])
        
        // Find the specific category
        const categoryData = categoriesData.categories?.find(
          (cat: Category) => cat.slug === slug
        )
        
        if (!categoryData) {
          notFound()
          return
        }
        
        setCategory(categoryData)
        
        if (questionsData.success) {
          setQuestions(questionsData.questions || [])
        }
        
        // Use API stats if available, otherwise fallback to calculated stats
        if (statsData && statsData.success) {
          setStats(statsData.stats)
        } else {
          // Fallback to calculated stats
          const categoryQuestions = questionsData.questions || []
          const answeredQuestions = categoryQuestions.filter((q: Question) => q.answerCount > 0)
          const resolvedQuestions = categoryQuestions.filter((q: Question) => q.isResolved)
          const totalViews = categoryQuestions.reduce((sum: number, q: Question) => sum + q.views, 0)
          
          setStats({
            totalQuestions: {
              value: categoryQuestions.length.toString(),
              change: "0%"
            },
            answeredQuestions: {
              value: answeredQuestions.length.toString(),
              change: "0%"
            },
            contributors: {
              value: new Set(categoryQuestions.map((q: Question) => q.author.id)).size.toString(),
              change: "0%"
            },
            helpScore: {
              value: (resolvedQuestions.length + Math.floor(totalViews / 10)).toString(),
              change: "0%"
            }
          })
        }
        
      } catch (err) {
        console.error('Error fetching category data:', err)
        setError('Failed to load category data.')
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) {
      fetchCategoryData()
    }
  }, [slug])
  
  // Transform questions for QuestionCard component
  const transformedQuestions = questions.map(q => ({
    id: q.id,
    title: q.title,
    content: q.content,
    author: q.author.name,
    authorAvatar: q.author.avatar || "/placeholder-user.jpg",
    category: q.category.name,
    tags: Array.isArray(q.tags) ? q.tags : [],
    votes: q.voteCount,
    answers: q.answerCount,
    views: q.views,
    createdAt: q.createdAt,
    hasAcceptedAnswer: q.isResolved
  }))
  
  // Sort questions by different criteria
  const sortedQuestions = {
    trending: [...transformedQuestions].sort((a, b) => (b.votes + b.views/10) - (a.votes + a.views/10)),
    recent: [...transformedQuestions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    unanswered: transformedQuestions.filter(q => q.answers === 0),
    mostVoted: [...transformedQuestions].sort((a, b) => b.votes - a.votes)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading category...</p>
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">{error || 'Category not found'}</p>
        </div>
      </div>
    )
  }

  const IconComponent = iconMap[category.icon as keyof typeof iconMap] || HelpCircle

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <IconComponent className="h-5 w-5" style={{ color: category.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Questions"
          value={stats?.totalQuestions.value || "0"}
          change={stats?.totalQuestions.change || "0%"}
          icon={BarChart3}
        />
        <StatsCard
          title="Answered Questions"
          value={stats?.answeredQuestions.value || "0"}
          change={stats?.answeredQuestions.change || "0%"}
          icon={CheckCircle}
        />
        <StatsCard
          title="Contributors"
          value={stats?.contributors.value || "0"}
          change={stats?.contributors.change || "0%"}
          icon={UserCheck}
        />
        <StatsCard
          title="Help Score"
          value={stats?.helpScore.value || "0"}
          change={stats?.helpScore.change || "0%"}
          icon={Star}
        />
      </div>

      {/* Questions with tabs */}
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
          <TabsTrigger value="unanswered" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Unanswered ({sortedQuestions.unanswered.length})
          </TabsTrigger>
          <TabsTrigger value="mostVoted" className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" />
            Most Voted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          {sortedQuestions.trending.length > 0 ? (
            sortedQuestions.trending.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions found in this category yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {sortedQuestions.recent.length > 0 ? (
            sortedQuestions.recent.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions found in this category yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unanswered" className="space-y-4">
          {sortedQuestions.unanswered.length > 0 ? (
            sortedQuestions.unanswered.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">All questions in this category have been answered!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mostVoted" className="space-y-4">
          {sortedQuestions.mostVoted.length > 0 ? (
            sortedQuestions.mostVoted.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions found in this category yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
