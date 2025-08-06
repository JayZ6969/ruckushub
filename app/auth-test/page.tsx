"use client"

import { useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthTestPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("admin@ruckushub.com")
  const [password, setPassword] = useState("admin123")
  const [result, setResult] = useState<any>(null)

  const testSignIn = async () => {
    console.log("Testing sign-in...")
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      console.log("Sign-in result:", result)
      setResult(result)
    } catch (error) {
      console.error("Sign-in error:", error)
      setResult({ error: String(error) })
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Session Status:</strong> {status}
          </div>
          
          {session ? (
            <div>
              <p><strong>User:</strong> {session.user?.email}</p>
              <p><strong>Name:</strong> {session.user?.name}</p>
              <Button onClick={() => signOut()}>Sign Out</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={testSignIn}>Test Sign In</Button>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 border rounded">
              <strong>Result:</strong>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
