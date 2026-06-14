import { NextRequest, NextResponse } from "next/server"

import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/"
  const response = NextResponse.redirect(new URL(callbackUrl, request.nextUrl.origin))

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  })

  return response
}
