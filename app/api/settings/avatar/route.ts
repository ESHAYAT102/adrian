import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { NextResponse } from "next/server"

import { getDataDir } from "@/lib/local-git"
import { toSessionUser, updateLocalUserProfile } from "@/lib/local-users"
import {
  encodeSessionCookie,
  getSessionUser,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session"

export const runtime = "nodejs"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Map([
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
])

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: corsHeaders }
    )
  }

  const formData = await request.formData()
  const file = formData.get("avatar")

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "avatar_required" },
      { status: 400, headers: corsHeaders }
    )
  }

  const extension = ALLOWED_AVATAR_TYPES.get(file.type)
  if (!extension) {
    return NextResponse.json(
      { error: "unsupported_image_type" },
      { status: 400, headers: corsHeaders }
    )
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json(
      { error: "image_too_large" },
      { status: 400, headers: corsHeaders }
    )
  }

  const avatarsDir = join(getDataDir(), "avatars")
  mkdirSync(avatarsDir, { recursive: true })

  const bytes = Buffer.from(await file.arrayBuffer())
  writeFileSync(join(avatarsDir, `${sessionUser.login}.${extension}`), bytes)
  writeFileSync(
    join(avatarsDir, `${sessionUser.login}.json`),
    `${JSON.stringify({ contentType: file.type, extension }, null, 2)}\n`
  )

  const avatarUrl = `/api/users/${sessionUser.login}/avatar?v=${Date.now()}`
  const user = updateLocalUserProfile(sessionUser.login, { avatarUrl })

  if (!user) {
    return NextResponse.json(
      { error: "user_not_found" },
      { status: 404, headers: corsHeaders }
    )
  }

  const nextSessionUser = toSessionUser(user)
  const response = NextResponse.json({ avatarUrl, user: nextSessionUser }, { headers: corsHeaders })
  response.cookies.set(
    SESSION_COOKIE_NAME,
    encodeSessionCookie(nextSessionUser),
    sessionCookieOptions
  )
  return response
}
