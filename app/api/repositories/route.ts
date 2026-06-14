import { NextResponse } from "next/server"

import { createGitHubRepository } from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    auto_init?: boolean
    description?: string | null
    homepage?: string | null
    name?: string
    private?: boolean
  }

  const result = await createGitHubRepository(sessionUser, {
    auto_init: body.auto_init ?? false,
    description: body.description ?? null,
    homepage: body.homepage ?? null,
    name: body.name?.trim() ?? "",
    private: body.private ?? false,
  })

  if (!result.repository) {
    return NextResponse.json(
      { error: result.error ?? "request_failed" },
      { status: result.status }
    )
  }

  return NextResponse.json({ repository: result.repository }, { status: 201 })
}
