import { NextResponse } from "next/server"

import { deleteLocalUser } from "@/lib/local-users"
import { getSessionUser, isAdminSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const sessionUser = await getSessionUser()
  if (!sessionUser || !isAdminSessionUser(sessionUser)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { username } = await params

  if (username === sessionUser.login) {
    return NextResponse.json({ error: "self_delete_forbidden" }, { status: 403 })
  }

  const deleted = deleteLocalUser(username)

  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
