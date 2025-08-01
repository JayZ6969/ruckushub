"use client"
import { useState, useEffect } from "react"
import { Home, Search, Trophy, Gift, User, Plus, Code, Server, Package, Users, HelpCircle, LogIn, LogOut, Wifi, Settings, Cloud, CheckCircle, Router } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { getAvatarFallback } from "@/lib/avatar-utils"

const mainNavItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Leaderboard",
    url: "/leaderboard",
    icon: Trophy,
  },
  {
    title: "Rewards",
    url: "/rewards",
    icon: Gift,
  },
]

const iconMap = {
  'Code': Code,
  'Server': Server,
  'Package': Package,
  'Users': Users,
  'HelpCircle': HelpCircle,
  'Wifi': Wifi,
  'Settings': Settings,
  'Cloud': Cloud,
  'CheckCircle': CheckCircle,
  'Router': Router,
  'Headphones': Users, // Fallback
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

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()

    // Listen for custom events to refresh categories
    const handleRefreshCategories = () => {
      fetchCategories()
    }

    window.addEventListener('refreshCategories', handleRefreshCategories)
    
    return () => {
      window.removeEventListener('refreshCategories', handleRefreshCategories)
    }
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="RuckusHub Logo" 
              width={32} 
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">RuckusHub</h2>
            <p className="text-xs text-muted-foreground">Q&A Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button asChild className="w-full justify-start">
                  <Link href="/ask">
                    <Plus className="mr-2 h-4 w-4" />
                    Ask Question
                  </Link>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <SidebarMenuItem>
                  <div className="flex items-center gap-2 p-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-r-primary" />
                    <span className="text-sm text-muted-foreground">Loading categories...</span>
                  </div>
                </SidebarMenuItem>
              ) : categories.map((category) => {
                const IconComponent = iconMap[category.icon as keyof typeof iconMap] || HelpCircle
                const categoryUrl = `/category/${category.slug}`
                return (
                  <SidebarMenuItem key={category.id}>
                    <SidebarMenuButton asChild isActive={pathname === categoryUrl}>
                      <Link href={categoryUrl} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <IconComponent className="mr-2 h-4 w-4" />
                          {category.name}
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {category.questionCount}
                        </Badge>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="p-4">
          {status === "loading" ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex flex-col gap-1">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ) : session?.user ? (
            <div className="space-y-3">
              <Link href="/profile" className="flex items-center gap-3 hover:bg-accent rounded-lg p-2 -m-2 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image && !session.user.image.includes('placeholder') ? session.user.image : undefined} alt={session.user.name || "User"} />
                  <AvatarFallback className={getAvatarFallback(session.user.name, session.user.email).className}>
                    {getAvatarFallback(session.user.name, session.user.email).initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{session.user.name || session.user.email}</p>
                  <p className="text-xs text-muted-foreground">Active user</p>
                </div>
              </Link>
              <div className="flex items-center justify-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  title="Settings"
                  className="h-8 w-8 p-0"
                >
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <ThemeToggle />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  title="Sign out"
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Link href="/auth/signin" className="flex items-center gap-3 hover:bg-accent rounded-lg p-2 -m-2 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-500 text-white">
                    <LogIn className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">Sign In</p>
                  <p className="text-xs text-muted-foreground">Access your account</p>
                </div>
              </Link>
              <div className="flex items-center justify-center">
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
