import { NextResponse } from "next/server"

import { writeRepositoryFile } from "@/lib/local-git"

export const runtime = "nodejs"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ repo: string }> }
) {
  const { repo } = await params
  const contentType = request.headers.get("content-type") || ""
  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries())

  try {
    writeRepositoryFile({
      content: String(body.content || ""),
      message: body.message ? String(body.message) : undefined,
      name: repo,
      path: String(body.path || ""),
    })

    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.redirect(new URL(`/${repo}`, request.url), 303)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "request_failed" },
      { status: 400 }
    )
  }
}
