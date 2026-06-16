import { NextResponse } from "next/server"

import {
  adminUpdateLocalUserPassword,
} from "@/lib/local-users"
import {
  getSessionUser,
  isAdminSessionUser,
} from "@/lib/session"

export const runtime = "nodejs"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const sessionUser = await getSessionUser()
  if (!sessionUser || !isAdminSessionUser(sessionUser)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { username } = await params

  if (username === sessionUser.login) {
    return NextResponse.json({ error: "self_password_forbidden" }, { status: 403 })
  }

  const body = (await _request.json().catch(() => ({}))) as {
    newPassword?: string
  }

  if (!body.newPassword) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  const result = adminUpdateLocalUserPassword(username, body.newPassword)
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 422
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ ok: true })
}
