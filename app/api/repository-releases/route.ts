import { NextResponse } from "next/server"

import { createGitHubRepositoryRelease } from "@/lib/github"
import { readLocalReleaseAsset } from "@/lib/local-git"
import { getSessionUser } from "@/lib/session"

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

export async function POST(request: Request) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const owner = String(formData.get("owner") ?? "")
  const repo = String(formData.get("repo") ?? "")
  const tagName = String(formData.get("tagName") ?? "")
  const title = String(formData.get("title") ?? "")
  const description = String(formData.get("description") ?? "")

  if (!owner || !repo || !tagName || !title) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  const assets = await Promise.all(
    formData
      .getAll("assets")
      .filter((value): value is File => value instanceof File && value.size > 0)
      .map(async (file) => ({
        content: Buffer.from(await file.arrayBuffer()),
        name: file.name,
        type: file.type || "application/octet-stream",
      }))
  )

  try {
    const result = await createGitHubRepositoryRelease(sessionUser, owner, repo, {
      assets,
      body: description.trim() || null,
      name: title,
      tagName,
    })

    if (!result.release) {
      return NextResponse.json(
        { error: result.error ?? "request_failed" },
        { status: result.status ?? 400 }
      )
    }

    return NextResponse.json({ release: result.release }, { status: result.status ?? 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "request_failed" },
      { status: 400 }
    )
  }
}
