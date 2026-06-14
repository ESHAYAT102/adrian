import { NextRequest, NextResponse } from "next/server"

import { toSessionUser, verifyLocalUserPassword } from "@/lib/local-users"
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

  const user = verifyLocalUserPassword(String(body.username || ""), String(body.password || ""))
  if (!user) {
    const message = "Invalid username or password"
    return wantsJson
      ? NextResponse.json({ error: message }, { status: 401 })
      : redirectWithAuthError(request, callbackUrl, message)
  }

  const response = wantsJson
    ? NextResponse.json({ user: toSessionUser(user) })
    : NextResponse.redirect(new URL(callbackUrl, request.nextUrl.origin), 303)

  response.cookies.set(SESSION_COOKIE_NAME, encodeSessionCookie(toSessionUser(user)), sessionCookieOptions)
  return response
}
