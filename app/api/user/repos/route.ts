import { NextResponse } from "next/server"

import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

type GitHubRepository = {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  fork: boolean
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  default_branch: string
  pushed_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const perPage = searchParams.get("per_page") ?? "30"

  const sessionUser = await getSessionUser()
  if (!sessionUser?.accessToken) {
    return NextResponse.json({ repositories: [] })
  }

  try {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&sort=updated&affiliation=owner`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${sessionUser.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ repositories: [] })
    }

    const repos = (await response.json()) as GitHubRepository[]

    return NextResponse.json({
      repositories: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        htmlUrl: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forksCount: repo.forks_count,
        defaultBranch: repo.default_branch,
        pushedAt: repo.pushed_at,
        updatedAt: repo.updated_at,
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url,
        },
      })),
    })
  } catch {
    return NextResponse.json({ repositories: [] })
  }
}
