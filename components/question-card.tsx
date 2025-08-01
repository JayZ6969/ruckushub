import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowUp, MessageSquare, Eye, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { getAvatarFallback } from "@/lib/avatar-utils"

interface Question {
  id: string
  title: string
  content: string
  author: string
  authorAvatar: string
  category: string
  tags: string[]
  votes: number
  answers: number
  views: number
  createdAt: string
  hasAcceptedAnswer: boolean
}

interface QuestionCardProps {
  question: Question
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link
              href={`/question/${question.id}`}
              className="text-lg font-semibold hover:text-primary transition-colors"
            >
              {question.title}
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{question.content}</p>
          </div>
          {question.hasAcceptedAnswer && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{question.category}</Badge>
          {question.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowUp className="h-4 w-4" />
              {question.votes}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {question.answers}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {question.views}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {question.createdAt}
            </div>
            <Avatar className="h-6 w-6">
              <AvatarImage src={question.authorAvatar && !question.authorAvatar.includes('placeholder') ? question.authorAvatar : undefined} />
              <AvatarFallback className={getAvatarFallback(question.author).className + " text-xs"}>
                {getAvatarFallback(question.author).initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{question.author}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
