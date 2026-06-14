"use client"

import { useState } from "react"

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
  const [mode, setMode] = useState<"login" | "register">("login")
  const action = mode === "login" ? "/api/auth/login" : "/api/auth/register"

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
          <form action={action} method="post">
            <input type="hidden" name="callbackUrl" value="/" />
            <FieldGroup>
              <Field>
                <Input required name="username" placeholder="username" />
              </Field>
              {mode === "register" ? (
                <>
                  <Field>
                    <Input name="displayName" placeholder="display name" />
                  </Field>
                  <Field>
                    <Input name="email" placeholder="email optional" type="email" />
                  </Field>
                </>
              ) : null}
              <Field>
                <Input required minLength={8} name="password" placeholder="password" type="password" />
              </Field>
              <Field>
                <Button type="submit">
                  {mode === "login" ? "Login" : "Create account"}
                </Button>
              </Field>
              <button
                className="text-left text-xs text-muted-foreground underline-offset-4 hover:underline"
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
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
