"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const action = mode === "login" ? "/api/auth/login" : "/api/auth/register"

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const username = String(formData.get("username") || "").trim()
    const password = String(formData.get("password") || "")

    if (!username || !password) {
      const message = "Username and password are required."
      setError(message)
      toast.error(message)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(action, {
        body: JSON.stringify({
          callbackUrl: String(formData.get("callbackUrl") || "/"),
          displayName: String(formData.get("displayName") || ""),
          email: String(formData.get("email") || ""),
          password,
          username,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
      }

      if (!response.ok) {
        const message = data.error ||
          (mode === "login"
            ? "Invalid username or password."
            : "Could not create account.")
        setError(message)
        toast.error(message)
        return
      }

      toast.success(mode === "login" ? "Logged in" : "Account created")
      router.push(String(formData.get("callbackUrl") || "/"))
      router.refresh()
    } catch {
      const message = "Could not reach Adrian. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "login" ? "Login to Adrian" : "Create an Adrian account"}</CardTitle>
          <CardDescription>
            Adrian uses local accounts and its own Git server — no GitHub required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="callbackUrl" value="/" />
            <FieldGroup>
              <Field>
                <Input
                  required
                  disabled={isSubmitting}
                  name="username"
                  placeholder="username"
                />
              </Field>
              {mode === "register" ? (
                <>
                  <Field>
                    <Input
                      disabled={isSubmitting}
                      name="displayName"
                      placeholder="display name"
                    />
                  </Field>
                  <Field>
                    <Input
                      disabled={isSubmitting}
                      name="email"
                      placeholder="email optional"
                      type="email"
                    />
                  </Field>
                </>
              ) : null}
              <Field>
                <Input
                  required
                  disabled={isSubmitting}
                  minLength={8}
                  name="password"
                  placeholder="password"
                  type="password"
                />
              </Field>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Field>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting
                    ? mode === "login"
                      ? "Logging in..."
                      : "Creating account..."
                    : mode === "login"
                      ? "Login"
                      : "Create account"}
                </Button>
              </Field>
              <button
                className="text-left text-xs text-muted-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setError(null)
                  setMode(mode === "login" ? "register" : "login")
                }}
              >
                {mode === "login"
                  ? "Need an account? Create one"
                  : "Already have an account? Login"}
              </button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
