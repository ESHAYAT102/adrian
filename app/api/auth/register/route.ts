import { NextRequest, NextResponse } from "next/server"

import { createLocalUser, toSessionUser } from "@/lib/local-users"
import { encodeSessionCookie, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || ""
  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries())
  const callbackUrl = String(body.callbackUrl || request.nextUrl.searchParams.get("callbackUrl") || "/")

  try {
    const user = createLocalUser({
      displayName: body.displayName ? String(body.displayName) : null,
      email: body.email ? String(body.email) : null,
      password: String(body.password || ""),
      username: String(body.username || ""),
    })
    const sessionUser = toSessionUser(user)
    const response = contentType.includes("application/json")
      ? NextResponse.json({ user: sessionUser }, { status: 201 })
      : NextResponse.redirect(new URL(callbackUrl, request.nextUrl.origin), 303)

    response.cookies.set(SESSION_COOKIE_NAME, encodeSessionCookie(sessionUser), sessionCookieOptions)
    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "registration_failed" },
      { status: 400 }
    )
  }
}
