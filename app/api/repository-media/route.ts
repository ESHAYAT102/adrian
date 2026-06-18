import { existsSync, readFileSync, statSync } from "node:fs"
import { extname, join } from "node:path"
import { NextResponse } from "next/server"

import { getLocalRepository } from "@/lib/local-git"

export const runtime = "nodejs"

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".ogg": "video/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".webp": "image/webp",
}

function getContentType(path: string) {
  return CONTENT_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get("owner")?.trim()
  const repo = searchParams.get("repo")?.trim()
  const path = searchParams.get("path")?.trim()

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 })
  }

  const repository = getLocalRepository(owner, repo)
  if (!repository) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const safePath = path.split("/").filter(Boolean)
  if (safePath.length === 0 || safePath.some((part) => part === "..")) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 })
  }

  const absolutePath = join(repository.workTreePath, ...safePath)
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return new NextResponse(readFileSync(absolutePath), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": getContentType(path),
    },
  })
}
