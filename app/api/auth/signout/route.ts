import { NextRequest, NextResponse } from "next/server"

import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url))

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  })

  return response
}
