"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.user.role)
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.user.role)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 p-6">
            <h2 className="text-2xl font-bold text-center">Welcome Back</h2>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
            <form action={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 p-6">
            <h2 className="text-2xl font-bold text-center">Create Account</h2>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
            <form action={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="reg-password">Password</Label>
                <Input id="reg-password" name="password" type="password" required />
              </div>
              <div>
                <Label htmlFor="reg-confirm">Confirm Password</Label>
                <Input id="reg-confirm" name="confirmPassword" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Register"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
