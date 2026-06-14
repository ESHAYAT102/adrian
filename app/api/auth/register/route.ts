import { NextRequest, NextResponse } from "next/server"

import { createLocalUser, toSessionUser } from "@/lib/local-users"
import { encodeSessionCookie, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session"

export const runtime = "nodejs"

function redirectWithAuthError(request: NextRequest, callbackUrl: string, message: string) {
  const url = new URL(callbackUrl || "/", request.nextUrl.origin)
  url.searchParams.set("authError", message)
  return NextResponse.redirect(url, 303)
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || ""
  const wantsJson = contentType.includes("application/json")
  const body = wantsJson
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
    const response = wantsJson
      ? NextResponse.json({ user: sessionUser }, { status: 201 })
      : NextResponse.redirect(new URL(callbackUrl, request.nextUrl.origin), 303)

    response.cookies.set(SESSION_COOKIE_NAME, encodeSessionCookie(sessionUser), sessionCookieOptions)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "registration_failed"
    return wantsJson
      ? NextResponse.json({ error: message }, { status: 400 })
      : redirectWithAuthError(request, callbackUrl, message)
  }
}
