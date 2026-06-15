import { NextResponse } from "next/server"

import { readLocalReleaseAsset } from "@/lib/local-git"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const owner = url.searchParams.get("owner") ?? ""
  const repo = url.searchParams.get("repo") ?? ""
  const tag = url.searchParams.get("tag") ?? ""
  const name = url.searchParams.get("name") ?? ""

  if (!owner || !repo || !tag || !name) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  const asset = readLocalReleaseAsset(owner, repo, tag, name)
  if (!asset) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return new NextResponse(asset.content, {
    headers: {
      "Content-Disposition": `attachment; filename="${asset.name.replace(/"/g, "")}"`,
      "Content-Length": String(asset.size),
      "Content-Type": asset.contentType,
    },
  })
}
