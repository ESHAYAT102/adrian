import { NextResponse } from "next/server"

import {
  deleteGitHubRepositoryFile,
  updateGitHubRepositoryFile,
} from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    branch?: string
    content?: string
    message?: string
    owner?: string
    path?: string
    repo?: string
    sha?: string
  }

  if (
    !body.owner ||
    !body.repo ||
    !body.path ||
    typeof body.content !== "string" ||
    !body.message ||
    !body.sha
  ) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  const result = await updateGitHubRepositoryFile(sessionUser, body.owner, body.repo, {
    branch: body.branch,
    content: body.content,
    message: body.message,
    path: body.path,
    sha: body.sha,
  })

  if (!result.commit) {
    return NextResponse.json(
      { error: result.error ?? "request_failed" },
      { status: result.status }
    )
  }

  return NextResponse.json({ commit: result.commit })
}

export async function DELETE(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    branch?: string
    message?: string
    owner?: string
    path?: string
    repo?: string
    sha?: string
  }

  if (!body.owner || !body.repo || !body.path || !body.message || !body.sha) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  const result = await deleteGitHubRepositoryFile(
    sessionUser,
    body.owner,
    body.repo,
    {
      branch: body.branch,
      message: body.message,
      path: body.path,
      sha: body.sha,
    }
  )

  if (!result.commit) {
    return NextResponse.json(
      { error: result.error ?? "request_failed" },
      { status: result.status }
    )
  }

  return NextResponse.json({ commit: result.commit })
}
