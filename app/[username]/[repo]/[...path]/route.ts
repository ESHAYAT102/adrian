import { existsSync, readFileSync, statSync } from "node:fs"
import { join, normalize } from "node:path"
import { NextResponse } from "next/server"

import { getLocalRepository } from "@/lib/local-git"

export const runtime = "nodejs"

const CONTENT_TYPES: Record<string, string> = {
  HEAD: "text/plain; charset=utf-8",
  config: "text/plain; charset=utf-8",
  description: "text/plain; charset=utf-8",
  "info/refs": "text/plain; charset=utf-8",
}

function getContentType(path: string) {
  if (CONTENT_TYPES[path]) return CONTENT_TYPES[path]
  if (path.endsWith(".pack")) return "application/x-git-packed-objects"
  if (path.endsWith(".idx")) return "application/x-git-packed-objects-toc"
  return "application/octet-stream"
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[]; repo: string; username: string }> }
) {
  const { path, repo, username } = await params
  if (!repo.endsWith(".git")) return new NextResponse("Not found", { status: 404 })

  const repository = getLocalRepository(username, repo.replace(/\.git$/, ""))
  if (!repository) return new NextResponse("Not found", { status: 404 })

  const relativePath = normalize(path.join("/"))
  if (relativePath.startsWith("..") || relativePath.includes("/.")) {
    return new NextResponse("Invalid path", { status: 400 })
  }

  const absolutePath = join(repository.barePath, relativePath)
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return new NextResponse("Not found", { status: 404 })
  }

  return new NextResponse(readFileSync(absolutePath), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": getContentType(relativePath),
    },
  })
}
