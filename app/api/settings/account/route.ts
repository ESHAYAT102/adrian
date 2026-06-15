import { NextResponse } from "next/server"

import { deleteLocalUser, verifyLocalUserPassword } from "@/lib/local-users"
import { getSessionUser, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session"

export const runtime = "nodejs"

export async function DELETE(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    password?: string
    username?: string
  }

  if (!body.username || !body.password) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  if (body.username.trim().toLowerCase() !== sessionUser.login.toLowerCase()) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 403 })
  }

  const verifiedUser = verifyLocalUserPassword(sessionUser.login, body.password)
  if (!verifiedUser) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 403 })
  }

  const deleted = deleteLocalUser(sessionUser.login)
  const response = NextResponse.json({ ok: deleted })
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  })
  return response
}
