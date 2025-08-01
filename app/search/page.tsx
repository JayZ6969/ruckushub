"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, Tag, X } from "lucide-react"
import { QuestionCard } from "@/components/question-card"

interface SearchResult {
  id: string
  title: string
  content: string
  author: {
    name: string
    email: string
    avatar?: string
  }
  category: {
    name: string
    slug: string
    color: string
  }
  voteCount: number
  answerCount: number
  views: number
  createdAt: string
  isResolved: boolean
}

const popularTags = [
  "javascript",
  "react",
  "nodejs",
  "python",
  "aws",
  "docker",
  "database",
  "api",
  "authentication",
  "deployment",
  "testing",
  "performance",
]

const categories = ["Software", "DevOps", "Product", "HR", "General"]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [sortBy, setSortBy] = useState("relevance")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const searchData = async () => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=questions&limit=20`)
        
        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        
        if (data.success && data.results.questions) {
          setResults(data.results.questions)
        } else {
          setResults([])
        }
      } catch (err) {
        console.error('Search error:', err)
        setError('Search failed. Please try again.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchData, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category])
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    }
  }

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedTags([])
    setDateFilter("all")
    setSortBy("relevance")
  }

  // Transform results for QuestionCard component
  const transformedResults = results.map(r => ({
    id: r.id, // Keep as string - don't parse to int since we're using cuid IDs
    title: r.title,
    content: r.content,
    author: r.author.name,
    authorAvatar: r.author.avatar || "/placeholder.svg?height=32&width=32",
    category: r.category.name,
    tags: [], // Tags would need to be fetched separately or included in search response
    votes: r.voteCount,
    answers: r.answerCount,
    views: r.views,
    createdAt: r.createdAt,
    hasAcceptedAnswer: r.isResolved
  }))

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Find answers to your questions across all categories</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions, answers, and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Searching...</span>
        </div>
      )}

      {/* Active Filters */}
      {(selectedCategories.length > 0 || selectedTags.length > 0 || dateFilter !== "all") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1">
              {category}
              <button onClick={() => handleCategoryChange(category, false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              {tag}
              <button onClick={() => removeTag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {dateFilter !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {dateFilter}
              <button onClick={() => setDateFilter("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {/* Sort and Results */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading ? "Searching..." : `${transformedResults.length} results found`}
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="votes">Most Votes</SelectItem>
                <SelectItem value="answers">Most Answers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            {!loading && transformedResults.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms or filters</p>
              </div>
            )}
            
            {!loading && transformedResults.length === 0 && !searchQuery && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Enter a search term to find questions and answers</p>
              </div>
            )}

            {transformedResults.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Filters */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Categories */}
                <div>
                  <h4 className="font-medium mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked: boolean | "indeterminate") => 
                            handleCategoryChange(category, checked === true)
                          }
                        />
                        <label htmlFor={category} className="text-sm">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Filter */}
                <div>
                  <h4 className="font-medium mb-3">Date</h4>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="year">This year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Popular Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Search Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <p className="font-medium">Use quotes for exact phrases:</p>
                <code className="text-xs bg-muted px-1 rounded">"error handling"</code>
              </div>
              <div className="text-sm">
                <p className="font-medium">Search by tag:</p>
                <code className="text-xs bg-muted px-1 rounded">[javascript]</code>
              </div>
              <div className="text-sm">
                <p className="font-medium">Search by user:</p>
                <code className="text-xs bg-muted px-1 rounded">user:john.doe</code>
              </div>
              <div className="text-sm">
                <p className="font-medium">Exclude terms:</p>
                <code className="text-xs bg-muted px-1 rounded">-deprecated</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
