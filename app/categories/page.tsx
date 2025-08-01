"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  questionCount: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        
        if (data.success) {
          setCategories(data.categories || [])
          setFilteredCategories(data.categories || [])
        } else {
          throw new Error(data.error || 'Failed to fetch categories')
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories. Please refresh the page.')
        setCategories([])
        setFilteredCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCategories(categories)
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCategories(filtered)
    }
  }, [searchQuery, categories])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading categories...</p>
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

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Browse questions by category</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => (
          <Link key={category.id} href={`/category/${category.slug}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name[0]}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {category.questionCount} questions
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredCategories.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchQuery.trim() === "" ? "No categories found." : "No categories match your search."}
          </div>
        </div>
      )}
    </div>
  )
}
