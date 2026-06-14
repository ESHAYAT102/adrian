import { NextRequest, NextResponse } from "next/server"

import { getGitHubRepositoryContents } from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const branch = request.nextUrl.searchParams.get("branch") || undefined
  const owner = request.nextUrl.searchParams.get("owner")
  const repo = request.nextUrl.searchParams.get("repo")
  const path = request.nextUrl.searchParams.get("path") || undefined

  if (!owner || !repo) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 })
  }

  const sessionUser = await getSessionUser()
  const contents = await getGitHubRepositoryContents(
    owner,
    repo,
    path,
    sessionUser,
    branch
  )

  return NextResponse.json({ contents })
}
