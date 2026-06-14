import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { NextRequest, NextResponse } from "next/server"

import { getDataDir, normalizeOwner } from "@/lib/local-git"

type AvatarMetadata = {
  contentType: string
  extension: string
}

export const runtime = "nodejs"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params
  const normalized = normalizeOwner(username)
  const avatarsDir = join(getDataDir(), "avatars")
  const metadataPath = join(avatarsDir, `${normalized}.json`)

  if (!existsSync(metadataPath)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as AvatarMetadata
  const avatarPath = join(avatarsDir, `${normalized}.${metadata.extension}`)

  if (!existsSync(avatarPath)) {
    return new NextResponse("Not found", { status: 404 })
  }

  return new NextResponse(readFileSync(avatarPath), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": metadata.contentType,
    },
  })
}
