import { NextRequest, NextResponse } from "next/server"

import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:8390"
  const proto = request.headers.get("x-forwarded-proto") ?? "http"
  const response = NextResponse.redirect(new URL("/", `${proto}://${host}`))

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  })

  return response
}
