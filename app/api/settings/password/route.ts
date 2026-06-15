import { NextResponse } from "next/server"

import { updateLocalUserPassword } from "@/lib/local-users"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    currentPassword?: string
    newPassword?: string
  }

  if (!body.currentPassword || !body.newPassword) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  const result = updateLocalUserPassword(
    sessionUser.login,
    body.currentPassword,
    body.newPassword
  )

  if (!result.ok) {
    const status = result.error === "invalid_credentials" ? 403 : 422
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ ok: true })
}
