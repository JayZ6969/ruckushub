"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, X, Plus, Lightbulb, Upload, Image, Paperclip } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Category {
  id: string
  name: string
  slug: string
  description: string
}

// Fallback categories
const fallbackCategories = [
  { id: "1", name: "Software", slug: "software", description: "Software development questions" },
  { id: "2", name: "DevOps", slug: "devops", description: "DevOps and infrastructure questions" },
  { id: "3", name: "Product", slug: "product", description: "Product management questions" },
  { id: "4", name: "HR", slug: "hr", description: "Human resources questions" },
  { id: "5", name: "General", slug: "general", description: "General questions" },
]

const suggestedQuestions = [
  "How to implement OAuth 2.0 with internal SSO?",
  "Best practices for Docker container orchestration?",
  "Database migration strategies for legacy systems?",
]

// Popular tag suggestions
const popularTags = [
  // Programming Languages
  "javascript", "typescript", "python", "java", "c#", "php", "go", "rust", "kotlin", "swift",
  // Frontend
  "react", "vue", "angular", "nextjs", "tailwindcss", "bootstrap", "html", "css", "sass",
  // Backend
  "nodejs", "express", "django", "flask", "spring", "laravel", "fastapi", "nestjs",
  // Databases
  "mysql", "postgresql", "mongodb", "redis", "sqlite", "elasticsearch", "firebase",
  // DevOps & Cloud
  "docker", "kubernetes", "aws", "azure", "jenkins", "terraform", "ansible", "nginx",
  // Mobile
  "react-native", "flutter", "ionic", "android", "ios", "xamarin",
  // Tools
  "git", "github", "vscode", "webpack", "babel", "eslint", "jest", "cypress",
  // Concepts
  "api", "rest", "graphql", "microservices", "authentication", "authorization", "testing", "deployment",
  "performance", "security", "debugging", "architecture", "database-design", "ui-ux"
]

export default function AskQuestionPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCategories(data.categories)
          }
        } else {
          // Fallback to mock data
          setCategories(fallbackCategories)
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
        setCategories(fallbackCategories)
      }
    }

    fetchCategories()
    loadDraft() // Load existing draft if any
  }, [])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (title.trim() || content.trim() || category || tags.length > 0) {
        saveDraft()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [title, content, category, tags, attachments]) // Include all form fields

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('question-draft')
      if (draft) {
        const parsedDraft = JSON.parse(draft)
        setTitle(parsedDraft.title || '')
        setContent(parsedDraft.content || '')
        setCategory(parsedDraft.category || '')
        setTags(parsedDraft.tags || [])
        setCurrentTag('')
        setDraftLoaded(true)
        
        // Show info about attachments if they existed
        if (parsedDraft.attachmentCount > 0) {
          console.log(`Draft had ${parsedDraft.attachmentCount} attachments:`, parsedDraft.attachmentNames)
        }
        
        // Hide the "loaded" message after 3 seconds
        setTimeout(() => setDraftLoaded(false), 3000)
        
        console.log('Draft loaded successfully', parsedDraft)
      }
    } catch (err) {
      console.error('Error loading draft:', err)
    }
  }

  const saveDraft = () => {
    try {
      const draft = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        attachmentCount: attachments.length, // Save count, not actual files
        attachmentNames: attachments.map(f => f.name), // Save file names for reference
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('question-draft', JSON.stringify(draft))
      setDraftSaved(true)
      
      // Hide the "saved" message after 2 seconds
      setTimeout(() => setDraftSaved(false), 2000)
      
      console.log('Draft saved successfully', draft)
    } catch (err) {
      console.error('Error saving draft:', err)
      setError('Failed to save draft')
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem('question-draft')
      // Also clear the form
      setTitle('')
      setContent('')
      setCategory('')
      setTags([])
      setCurrentTag('')
      setAttachments([])
      console.log('Draft cleared')
    } catch (err) {
      console.error('Error clearing draft:', err)
    }
  }

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim().toLowerCase()])
      setCurrentTag("")
      setShowTagSuggestions(false)
    }
  }

  const handleTagInputChange = (value: string) => {
    setCurrentTag(value)
    
    if (value.trim().length > 0) {
      // Filter suggestions based on input
      const filtered = popularTags
        .filter(tag => 
          tag.toLowerCase().includes(value.toLowerCase()) && 
          !tags.includes(tag)
        )
        .slice(0, 8) // Show max 8 suggestions
      
      setTagSuggestions(filtered)
      setShowTagSuggestions(filtered.length > 0)
    } else {
      // Show popular tags when input is empty
      const popular = popularTags
        .filter(tag => !tags.includes(tag))
        .slice(0, 6) // Show fewer when showing all popular tags
      
      setTagSuggestions(popular)
      setShowTagSuggestions(false) // Don't show immediately, only on focus
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion) && tags.length < 5) {
      setTags([...tags, suggestion])
      setCurrentTag("")
      setShowTagSuggestions(false)
      setTagSuggestions([])
    }
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === "Escape") {
      setShowTagSuggestions(false)
    } else if (e.key === "ArrowDown" && tagSuggestions.length > 0) {
      e.preventDefault()
      // Focus first suggestion (could be enhanced with keyboard navigation)
      setShowTagSuggestions(true)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      const maxSize = 10 * 1024 * 1024 // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })
    
    if (validFiles.length !== files.length) {
      setError('Some files were not added. Only images, PDFs, text files, and Office documents under 10MB are allowed.')
    }
    
    setAttachments(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 files
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />
    return <Paperclip className="h-4 w-4" />
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      const maxSize = 10 * 1024 * 1024 // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })
    
    if (validFiles.length !== files.length) {
      setError('Some files were not added. Only images, PDFs, text files, and Office documents under 10MB are allowed.')
    }
    
    setAttachments(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 files
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    setShowSuggestions(value.length > 10)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Please enter a title for your question')
      return
    }
    
    if (!content.trim()) {
      setError('Please provide a description for your question')
      return
    }
    
    if (!category) {
      setError('Please select a category for your question')
      return
    }
    
    if (tags.length === 0) {
      setError('Please add at least one tag to help others find your question')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // For now, we'll just send the question data without file uploads
      // File upload functionality would require additional backend setup
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId: category,
          tags: tags,
          // Note: File attachments would be handled separately
          // attachmentCount: attachments.length
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Clear the draft after successful submission
          clearDraft()
          
          // Trigger sidebar refresh to update category question counts
          window.dispatchEvent(new CustomEvent('refreshCategories'))
          
          // TODO: Upload attachments if any exist
          // Redirect to the new question
          window.location.href = `/question/${data.question.id}`
        } else {
          setError(data.error || 'Failed to create question')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create question')
      }
    } catch (err) {
      console.error('Error creating question:', err)
      setError('Failed to create question. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ask a Question</h1>
        <p className="text-muted-foreground">Get help from your colleagues by asking a detailed question</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {draftLoaded && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
          <p className="text-sm">📝 Draft loaded! Your previous work has been restored. Note: File attachments need to be re-uploaded.</p>
        </div>
      )}

      {draftSaved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          <p className="text-sm">✓ Draft saved successfully!</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    placeholder="What's your question? Be specific and clear..."
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific and imagine you're asking a question to another person
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="content"
                    placeholder="Provide more details about your question. Include what you've tried, what you expected, and what actually happened..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    The more details you provide, the better answers you'll get
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tags <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={currentTag}
                        onChange={(e) => handleTagInputChange(e.target.value)}
                        onKeyPress={handleTagKeyPress}
                        onFocus={() => {
                          if (currentTag.trim().length > 0 && tagSuggestions.length > 0) {
                            setShowTagSuggestions(true)
                          } else if (currentTag.trim().length === 0) {
                            // Show popular tags when focused with empty input
                            const popular = popularTags
                              .filter(tag => !tags.includes(tag))
                              .slice(0, 6)
                            setTagSuggestions(popular)
                            setShowTagSuggestions(popular.length > 0)
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding suggestions to allow clicking on them
                          setTimeout(() => setShowTagSuggestions(false), 200)
                        }}
                        disabled={tags.length >= 5}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddTag} 
                        size="icon" 
                        variant="outline"
                        disabled={tags.length >= 5 || !currentTag.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Tag Suggestions Dropdown */}
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                        <div className="px-3 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                          {currentTag.trim() ? 'Matching tags' : 'Popular tags'}
                        </div>
                        {tagSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none text-sm border-b border-border/50 last:border-b-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault() // Prevent input blur
                              handleSelectSuggestion(suggestion)
                            }}
                          >
                            <span className="font-medium">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add at least 1 tag (up to 5) to help others find your question. 
                    {tags.length >= 5 ? (
                      <span className="text-orange-600 font-medium"> Maximum tags reached.</span>
                    ) : (
                      <span className="text-blue-600"> Start typing for suggestions.</span>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Attachments (Optional)</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragOver 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Upload className="h-8 w-8" />
                      <div className="text-sm">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </div>
                      <div className="text-xs">
                        Images, PDFs, text files, Office documents (Max 10MB each, up to 5 files)
                      </div>
                    </label>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Attached Files:</p>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAttachment(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Posting..." : "Post Question"}
              </Button>
              <Button type="button" variant="outline" disabled={loading} onClick={saveDraft}>
                {draftSaved ? "Saved!" : "Save Draft"}
              </Button>
              <Button type="button" variant="ghost" disabled={loading} onClick={clearDraft} className="text-muted-foreground hover:text-destructive">
                Clear
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {showSuggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Similar Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedQuestions.map((question, index) => (
                  <div key={index} className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <p className="text-sm">{question}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Make sure your question hasn't been asked before</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Writing Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">How to ask a good question:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Be specific and clear in your title</li>
                  <li>• Provide context and background</li>
                  <li>• Include what you've already tried</li>
                  <li>• Use proper formatting and code blocks</li>
                  <li>• Add relevant tags</li>
                  <li>• Attach screenshots or files if helpful</li>
                </ul>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Earn points by:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Asking well-formatted questions (+5 pts)</li>
                  <li>• Getting upvotes on your question (+2 pts)</li>
                  <li>• Accepting helpful answers (+2 pts)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Remember to follow our community guidelines and be respectful to all colleagues.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
