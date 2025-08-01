"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Star, MessageSquare, TrendingUp, Award, Calendar, MapPin, Mail, Building, Globe } from "lucide-react"
import { QuestionCard } from "@/components/question-card"
import { getAvatarFallback } from "@/lib/avatar-utils"

interface UserProfile {
  id: string
  name: string
  title: string
  department: string
  location: string
  website: string
  email: string
  joinDate: string
  avatar: string
  bio: string
  stats: {
    totalPoints: number
    questionsAsked: number
    answersGiven: number
    acceptedAnswers: number
    helpfulVotes: number
    currentStreak: number
    reputation: number
    level: string
  }
  badges: {
    name: string
    description: string
    earned: boolean
    date: string
  }[]
  questions: {
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
  }[]
  answers: {
    id: string
    questionTitle: string
    questionId: string
    votes: number
    isAccepted: boolean
    createdAt: string
  }[]
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    title: '',
    bio: '',
    location: '',
    department: '',
    website: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      const data = await response.json()

      if (data.success) {
        setProfile(data.profile)
        setEditedProfile({
          name: data.profile.name,
          title: data.profile.title,
          bio: data.profile.bio,
          location: data.profile.location,
          department: data.profile.department,
          website: data.profile.website || ''
        })
      } else {
        setError(data.error || 'Failed to load profile')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      })

      const data = await response.json()

      if (data.success) {
        setProfile(prev => prev ? {
          ...prev,
          name: editedProfile.name,
          title: editedProfile.title,
          bio: editedProfile.bio,
          location: editedProfile.location,
          department: editedProfile.department
        } : null)
        setIsEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert(data.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditedProfile({
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        department: profile.department,
        website: profile.website || ''
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
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

  if (!profile) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          <p className="text-sm">Profile not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar && !profile.avatar.includes('placeholder') ? profile.avatar : undefined} />
                  <AvatarFallback className={getAvatarFallback(profile.name, profile.email).className + " text-2xl"}>
                    {getAvatarFallback(profile.name, profile.email).initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editedProfile.name}
                          onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={editedProfile.title}
                          onChange={(e) => setEditedProfile({ ...editedProfile, title: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold">{profile.name}</h2>
                      <p className="text-muted-foreground">{profile.title}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editedProfile.bio}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={editedProfile.department}
                        onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedProfile.location}
                        onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={editedProfile.website}
                      onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button onClick={handleCancel} variant="outline">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined {profile.joinDate}</span>
                    </div>
                    {profile.website && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="activity" className="mt-6">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="questions">Questions ({profile.questions.length})</TabsTrigger>
              <TabsTrigger value="answers">Answers ({profile.answers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.questions.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <MessageSquare className="h-5 w-5 text-blue-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Asked a question</p>
                          <p className="text-sm text-muted-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.createdAt}</p>
                        </div>
                      </div>
                    ))}
                    {profile.answers.slice(0, 2).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <TrendingUp className="h-5 w-5 text-green-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Answered a question</p>
                          <p className="text-sm text-muted-foreground">{activity.questionTitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.createdAt}</p>
                        </div>
                        {activity.isAccepted && (
                          <Badge variant="outline" className="text-green-600">Accepted</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              {profile.questions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                    <p className="text-muted-foreground">Start asking questions to help your colleagues!</p>
                  </CardContent>
                </Card>
              ) : (
                profile.questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))
              )}
            </TabsContent>

            <TabsContent value="answers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.answers.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No answers yet</h3>
                      <p className="text-muted-foreground">Start helping others by answering questions!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.answers.map((answer) => (
                        <div key={answer.id} className="p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{answer.questionTitle}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{answer.createdAt}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{answer.votes}</span>
                              </div>
                              {answer.isAccepted && (
                                <Badge variant="outline" className="text-green-600">Accepted</Badge>
                              )}
                            </div>
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
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{profile.stats.totalPoints}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{profile.stats.reputation}</div>
                  <div className="text-xs text-muted-foreground">Reputation</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Questions Asked</span>
                  <span className="font-medium">{profile.stats.questionsAsked}</span>
                </div>
                <div className="flex justify-between">
                  <span>Answers Given</span>
                  <span className="font-medium">{profile.stats.answersGiven}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accepted Answers</span>
                  <span className="font-medium">{profile.stats.acceptedAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Helpful Votes</span>
                  <span className="font-medium">{profile.stats.helpfulVotes}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Level */}
          <Card>
            <CardHeader>
              <CardTitle>Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{profile.stats.level}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep contributing to level up!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.badges.length === 0 ? (
                <div className="text-center py-4">
                  <Award className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No badges earned yet. Keep contributing!</p>
                </div>
              ) : (
                profile.badges.map((badge) => (
                  <div key={badge.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{badge.name}</span>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
