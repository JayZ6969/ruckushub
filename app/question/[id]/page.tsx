"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowUp, ArrowDown, MessageSquare, Eye, CheckCircle, Clock, Flag, Share, Bookmark, Award, Trash2 } from "lucide-react"
import { getAvatarFallback } from "@/lib/avatar-utils"

interface Question {
  id: string
  title: string
  content: string
  author: {
    name: string
    email: string
    avatar?: string
    reputation: number
  }
  category: {
    name: string
    slug: string
    color: string
  }
  tags: string[]
  voteCount: number
  views: number
  createdAt: string
  isResolved: boolean
}

interface Answer {
  id: string
  content: string
  author: {
    name: string
    email: string
    avatar?: string
    reputation: number
  }
  voteCount: number
  isAccepted: boolean
  createdAt: string
}

// Mock data for fallback
const questionData = {
  id: 1,
  title: "How to implement OAuth 2.0 with our internal SSO system?",
  content: `I'm trying to integrate our new microservice with the company's SSO system but running into CORS issues. Here's what I've tried so far:

1. Configured the OAuth client in our SSO dashboard
2. Set up the redirect URIs correctly
3. Added the necessary CORS headers

However, I'm still getting this error:
\`\`\`
Access to XMLHttpRequest at 'https://sso.company.com/oauth/token' from origin 'https://myapp.company.com' has been blocked by CORS policy
\`\`\`

Has anyone successfully integrated with our SSO system recently? Any guidance would be appreciated!`,
  author: "Sarah Chen",
  authorAvatar: "/placeholder.svg?height=40&width=40",
  authorTitle: "Senior Software Engineer",
  category: "Software",
  tags: ["oauth", "sso", "authentication", "cors"],
  votes: 15,
  views: 127,
  createdAt: "2 hours ago",
  hasAcceptedAnswer: true,
}

const answers = [
  {
    id: 1,
    content: `I ran into the same issue last month! The problem is that our SSO system requires a specific header for CORS requests from internal applications.

You need to add this header to your requests:
\`\`\`javascript
headers: {
  'X-Internal-App': 'true',
  'Content-Type': 'application/json'
}
\`\`\`

Also, make sure you're using the internal SSO endpoint: \`https://internal-sso.company.com/oauth/token\` instead of the public one.

This should resolve the CORS issue. Let me know if you need help with the implementation!`,
    author: "Mike Johnson",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    authorTitle: "DevOps Engineer",
    votes: 12,
    createdAt: "1 hour ago",
    isAccepted: true,
    comments: [
      {
        id: 1,
        content: "This worked perfectly! Thanks for the quick solution.",
        author: "Sarah Chen",
        createdAt: "45 minutes ago",
      },
    ],
  },
  {
    id: 2,
    content: `Another approach is to use our internal OAuth library that handles all the CORS configuration automatically:

\`\`\`bash
npm install @company/oauth-client
\`\`\`

Then in your code:
\`\`\`javascript
import { OAuthClient } from '@company/oauth-client';

const client = new OAuthClient({
  clientId: 'your-client-id',
  environment: 'internal'
});
\`\`\`

This library is maintained by our Platform team and includes all the necessary configurations.`,
    author: "Alex Thompson",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    authorTitle: "Platform Engineer",
    votes: 8,
    createdAt: "30 minutes ago",
    isAccepted: false,
    comments: [],
  },
]

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const questionId = params.id as string
  
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newAnswer, setNewAnswer] = useState("")
  const [newComment, setNewComment] = useState("")
  const [showCommentForm, setShowCommentForm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userVotes, setUserVotes] = useState<{[key: string]: 'UPVOTE' | 'DOWNVOTE' | null}>({})
  const [votingInProgress, setVotingInProgress] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        setLoading(true)
        const [questionRes, answersRes] = await Promise.all([
          fetch(`/api/questions/${questionId}`),
          fetch(`/api/answers?questionId=${questionId}`)
        ])

        if (!questionRes.ok) {
          throw new Error('Failed to fetch question')
        }

        const questionData = await questionRes.json()
        let currentQuestion = null
        let currentAnswers = []

        if (questionData.success) {
          currentQuestion = questionData.question
          setQuestion(currentQuestion)
        }

        if (answersRes.ok) {
          const answersData = await answersRes.json()
          if (answersData.success) {
            currentAnswers = answersData.answers || []
            setAnswers(currentAnswers)
          }
        }

        // Fetch user votes if authenticated, after we have the data
        if (session?.user && currentQuestion) {
          await fetchUserVotesForItems(currentQuestion, currentAnswers)
        }
      } catch (err) {
        console.error('Error fetching question:', err)
        setError('Failed to load question. Using fallback data.')
        // Fallback to mock data
        setQuestion({
          id: questionId,
          title: questionData.title,
          content: questionData.content,
          author: {
            name: questionData.author,
            email: questionData.author.toLowerCase().replace(' ', '') + '@company.com',
            avatar: questionData.authorAvatar,
            reputation: 1500
          },
          category: {
            name: questionData.category,
            slug: questionData.category.toLowerCase(),
            color: '#3b82f6'
          },
          tags: questionData.tags,
          voteCount: questionData.votes,
          views: questionData.views,
          createdAt: questionData.createdAt,
          isResolved: questionData.hasAcceptedAnswer
        })
        setAnswers([
          {
            id: "1",
            content: "For OAuth 2.0 with SSO, make sure you're handling the redirect URIs correctly in production. The CORS issue is likely due to different domains. Check your OAuth provider settings.",
            author: {
              name: "Alex Thompson",
              email: "alexthompson@company.com",
              avatar: "/placeholder.svg?height=32&width=32",
              reputation: 1200
            },
            voteCount: 15,
            isAccepted: true,
            createdAt: "2 hours ago"
          },
          {
            id: "2",
            content: "Another approach is to use our internal OAuth library that handles all the CORS configuration automatically.",
            author: {
              name: "Mike Johnson",
              email: "mikejohnson@company.com",
              avatar: "/placeholder.svg?height=32&width=32",
              reputation: 800
            },
            voteCount: 8,
            isAccepted: false,
            createdAt: "30 minutes ago"
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    if (questionId) {
      fetchQuestionData()
    }
  }, [questionId, session])

  const fetchUserVotesForItems = async (question: Question, answers: Answer[]) => {
    if (!session?.user) return

    try {
      // Fetch vote for question
      const questionVoteRes = await fetch(`/api/vote?itemType=question&itemId=${question.id}`)
      if (questionVoteRes.ok) {
        const questionVoteData = await questionVoteRes.json()
        if (questionVoteData.success) {
          setUserVotes(prev => ({
            ...prev,
            [`question-${question.id}`]: questionVoteData.userVote
          }))
        }
      }

      // Fetch votes for answers
      if (answers.length > 0) {
        const answerVotePromises = answers.map(async (answer) => {
          const answerVoteRes = await fetch(`/api/vote?itemType=answer&itemId=${answer.id}`)
          if (answerVoteRes.ok) {
            const answerVoteData = await answerVoteRes.json()
            if (answerVoteData.success) {
              return { answerId: answer.id, vote: answerVoteData.userVote }
            }
          }
          return null
        })

        const answerVotes = await Promise.all(answerVotePromises)
        const answerVotesMap = answerVotes.reduce((acc, vote) => {
          if (vote) {
            acc[`answer-${vote.answerId}`] = vote.vote
          }
          return acc
        }, {} as {[key: string]: 'UPVOTE' | 'DOWNVOTE' | null})

        setUserVotes(prev => ({ ...prev, ...answerVotesMap }))
      }
    } catch (error) {
      console.error('Error fetching user votes:', error)
    }
  }

  const handleVote = async (type: "up" | "down", targetType: "question" | "answer", targetId?: string) => {
    if (!session?.user) {
      alert('Please sign in to vote')
      return
    }

    const voteType = type === "up" ? "UPVOTE" : "DOWNVOTE"
    const itemId = targetType === "question" ? questionId : targetId
    
    if (!itemId) {
      console.error('Missing item ID for vote')
      return
    }

    const voteKey = `${targetType}-${itemId}`
    
    // Prevent multiple simultaneous votes on the same item
    if (votingInProgress[voteKey]) {
      return
    }

    setVotingInProgress(prev => ({ ...prev, [voteKey]: true }))

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: voteType,
          itemType: targetType,
          itemId: itemId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Update the vote count in the UI
        if (targetType === "question" && question) {
          setQuestion(prev => prev ? { ...prev, voteCount: data.voteCount } : null)
        } else if (targetType === "answer") {
          setAnswers(prev => prev.map(answer => 
            answer.id === itemId 
              ? { ...answer, voteCount: data.voteCount }
              : answer
          ))
        }

        // Update user vote state
        setUserVotes(prev => ({
          ...prev,
          [voteKey]: data.userVote
        }))
      } else {
        console.error('Failed to vote:', data.error)
        alert('Failed to vote: ' + data.error)
      }
    } catch (error) {
      console.error('Error voting:', error)
      alert('Error voting')
    } finally {
      setVotingInProgress(prev => ({ ...prev, [voteKey]: false }))
    }
  }

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) return
    
    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newAnswer,
          questionId: questionId
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Refresh answers
          const answersRes = await fetch(`/api/answers?questionId=${questionId}`)
          if (answersRes.ok) {
            const answersData = await answersRes.json()
            if (answersData.success) {
              setAnswers(answersData.answers || [])
            }
          }
          setNewAnswer("")
        }
      } else {
        console.error('Failed to submit answer')
      }
    } catch (err) {
      console.error('Error submitting answer:', err)
    }
  }

  const handleSubmitComment = (answerId: string) => {
    console.log('Submit comment for answer:', answerId, newComment)
    // TODO: Implement comment submission
    setNewComment("")
    setShowCommentForm(null)
  }

  const handleDeleteQuestion = async () => {
    if (!question) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Trigger sidebar refresh to update category question counts
          window.dispatchEvent(new CustomEvent('refreshCategories'))
          
          // Redirect to home page after successful deletion
          router.push('/')
        } else {
          console.error('Failed to delete question:', data.error)
          alert('Failed to delete question: ' + data.error)
        }
      } else {
        console.error('Failed to delete question')
        alert('Failed to delete question')
      }
    } catch (err) {
      console.error('Error deleting question:', err)
      alert('Error deleting question')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      const response = await fetch(`/api/answers/${answerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Remove the answer from the UI
          setAnswers(prev => prev.filter(answer => answer.id !== answerId))
        } else {
          console.error('Failed to delete answer:', data.error)
          alert('Failed to delete answer: ' + data.error)
        }
      } else {
        console.error('Failed to delete answer')
        alert('Failed to delete answer')
      }
    } catch (err) {
      console.error('Error deleting answer:', err)
      alert('Error deleting answer')
    }
  }

  // Check if current user can delete this question
  const canDeleteQuestion = question && session?.user?.email && 
    (question.author.email === session.user.email)

  // Check if current user can delete an answer
  const canDeleteAnswer = (answer: Answer) => {
    return session?.user?.email && answer.author.email === session.user.email
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading question...</p>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Question Not Found</h2>
          <p className="mt-2 text-muted-foreground">The question you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleVote("up", "question")}
                disabled={votingInProgress[`question-${questionId}`]}
                className={userVotes[`question-${questionId}`] === 'UPVOTE' ? 'text-green-600 bg-green-50 hover:bg-green-100' : ''}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
              <span className="text-lg font-bold">{question.voteCount}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleVote("down", "question")}
                disabled={votingInProgress[`question-${questionId}`]}
                className={userVotes[`question-${questionId}`] === 'DOWNVOTE' ? 'text-red-600 bg-red-50 hover:bg-red-100' : ''}
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{question.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Asked {new Date(question.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {question.views} views
                </div>
                {question.isResolved && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Resolved
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" style={{ backgroundColor: question.category.color + '20', color: question.category.color }}>
                  {question.category.name}
                </Badge>
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="prose prose-sm max-w-none mb-4">
                <div className="whitespace-pre-wrap">{question.content}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Flag className="h-4 w-4 mr-1" />
                    Flag
                  </Button>
                  {canDeleteQuestion && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Question</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone and will also delete all answers and comments.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteQuestion}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? "Deleting..." : "Delete Question"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={question.author.avatar && !question.author.avatar.includes('placeholder') ? question.author.avatar : undefined} />
                    <AvatarFallback className={getAvatarFallback(question.author.name, question.author.email).className}>
                      {getAvatarFallback(question.author.name, question.author.email).initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{question.author.name}</p>
                    <p className="text-xs text-muted-foreground">{question.author.reputation} reputation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Answers */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {answers.length} Answer{answers.length !== 1 ? "s" : ""}
        </h2>

        {answers.map((answer) => (
          <Card
            key={answer.id}
            className={
              answer.isAccepted ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" : ""
            }
          >          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleVote("up", "answer", answer.id)}
                  disabled={votingInProgress[`answer-${answer.id}`]}
                  className={userVotes[`answer-${answer.id}`] === 'UPVOTE' ? 'text-green-600 bg-green-50 hover:bg-green-100' : ''}
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
                <span className="text-lg font-bold">{answer.voteCount}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleVote("down", "answer", answer.id)}
                  disabled={votingInProgress[`answer-${answer.id}`]}
                  className={userVotes[`answer-${answer.id}`] === 'DOWNVOTE' ? 'text-red-600 bg-red-50 hover:bg-red-100' : ''}
                >
                  <ArrowDown className="h-5 w-5" />
                </Button>
                {answer.isAccepted && <CheckCircle className="h-6 w-6 text-green-500" />}
              </div>

              <div className="flex-1">
                {answer.isAccepted && (
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Accepted Answer</span>
                  </div>
                )}

                <div className="prose prose-sm max-w-none mb-4">
                  <div className="whitespace-pre-wrap">{answer.content}</div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCommentForm(showCommentForm === answer.id ? null : answer.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Add comment
                    </Button>
                    {canDeleteAnswer(answer) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Answer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this answer? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAnswer(answer.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Answer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">answered {answer.createdAt}</span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={answer.author.avatar && !answer.author.avatar.includes('placeholder') ? answer.author.avatar : undefined} />
                      <AvatarFallback className={getAvatarFallback(answer.author.name, answer.author.email).className + " text-xs"}>
                        {getAvatarFallback(answer.author.name, answer.author.email).initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{answer.author.name}</p>
                      <p className="text-xs text-muted-foreground">{answer.author.reputation} reputation</p>
                    </div>
                  </div>
                </div>

                {/* Comment Form */}
                {showCommentForm === answer.id && (
                    <div className="mt-4 space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSubmitComment(answer.id)}>
                          Add Comment
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowCommentForm(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Answer Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Your Answer</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write your answer here... Use markdown for formatting."
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            rows={8}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmitAnswer}>Post Your Answer</Button>
            <Button variant="outline">Preview</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            By posting your answer, you agree to our community guidelines.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
