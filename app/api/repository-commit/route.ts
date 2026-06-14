import { NextRequest, NextResponse } from "next/server"

import {
  getGitHubRepositoryCommitDiff,
  type GitHubRepositoryCommitDiff,
} from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const owner = searchParams.get("owner")
  const repo = searchParams.get("repo")
  const sha = searchParams.get("sha")

  if (!owner || !repo || !sha) {
    return NextResponse.json(
      { error: "Missing required parameters: owner, repo, sha" },
      { status: 400 }
    )
  }

  const sessionUser = await getSessionUser()

  const diff = await getGitHubRepositoryCommitDiff(
    owner,
    repo,
    sha,
    sessionUser
  )

  return NextResponse.json({ diff } as { diff: GitHubRepositoryCommitDiff })
}