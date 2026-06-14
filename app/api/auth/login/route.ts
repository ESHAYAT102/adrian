import { NextRequest, NextResponse } from "next/server"

import { toSessionUser, verifyLocalUserPassword } from "@/lib/local-users"
import { encodeSessionCookie, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || ""
  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries())
  const callbackUrl = String(body.callbackUrl || request.nextUrl.searchParams.get("callbackUrl") || "/")

  const user = verifyLocalUserPassword(String(body.username || ""), String(body.password || ""))
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
  }

  const response = contentType.includes("application/json")
    ? NextResponse.json({ user: toSessionUser(user) })
    : NextResponse.redirect(new URL(callbackUrl, request.nextUrl.origin), 303)

  response.cookies.set(SESSION_COOKIE_NAME, encodeSessionCookie(toSessionUser(user)), sessionCookieOptions)
  return response
}
