import { NextResponse } from "next/server"

import { getGitHubViewerSettings, updateGitHubViewerSettings } from "@/lib/github"
import {
  encodeSessionCookie,
  getSessionUser,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session"

export const runtime = "nodejs"

export async function GET() {
  const sessionUser = await getSessionUser()
  const settings = await getGitHubViewerSettings(sessionUser)

  if (!settings) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    bio?: string | null
    blog?: string | null
    company?: string | null
    hireable?: boolean | null
    location?: string | null
    name?: string | null
    twitter_username?: string | null
  }

  const result = await updateGitHubViewerSettings(sessionUser, {
    bio: body.bio ?? null,
    blog: body.blog ?? null,
    company: body.company ?? null,
    hireable: body.hireable ?? null,
    location: body.location ?? null,
    name: body.name ?? null,
    twitter_username: body.twitter_username ?? null,
  })

  if (!result.settings) {
    return NextResponse.json(
      { error: result.error ?? "request_failed" },
      { status: result.status }
    )
  }

  const response = NextResponse.json({ settings: result.settings })
  response.cookies.set(
    SESSION_COOKIE_NAME,
    encodeSessionCookie({
      ...sessionUser,
      email: result.settings.email,
      image: result.settings.avatarUrl,
      login: result.settings.login,
      name: result.settings.name,
    }),
    sessionCookieOptions
  )

  return response
}
