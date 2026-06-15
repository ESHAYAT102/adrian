import { NextResponse } from "next/server"

import { deleteLocalUser } from "@/lib/local-users"
import { getSessionUser, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session"

export const runtime = "nodejs"

export async function DELETE() {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const deleted = deleteLocalUser(sessionUser.login)
  const response = NextResponse.json({ ok: deleted })
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  })
  return response
}
