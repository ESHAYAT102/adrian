import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import { dirname, join, normalize } from "node:path"
import { NextResponse } from "next/server"

import { getLocalRepository, syncLocalRepositoryWorkTree } from "@/lib/local-git"

export const runtime = "nodejs"

const SMART_GIT_SERVICES = new Set(["git-upload-pack", "git-receive-pack"])

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

function parseRoute(params: { path: string[]; repo: string; username: string }) {
  const { path, repo, username } = params
  if (!repo.endsWith(".git")) return null

  const repositoryName = repo.replace(/\.git$/, "")
  const repository = getLocalRepository(username, repositoryName)
  if (!repository) return null

  const relativePath = normalize(path.join("/"))
  if (relativePath.startsWith("..") || relativePath.includes("/.")) return null

  return { relativePath, repository, repositoryName, repo, username }
}

function parseGitHttpResponse(output: Buffer) {
  const headerEnd = output.indexOf("\r\n\r\n")
  const separatorLength = headerEnd === -1 ? 2 : 4
  const fallbackHeaderEnd = headerEnd === -1 ? output.indexOf("\n\n") : headerEnd

  if (fallbackHeaderEnd === -1) {
    return {
      body: output,
      headers: new Headers({ "Content-Type": "application/octet-stream" }),
      status: 200,
    }
  }

  const rawHeaders = output.subarray(0, fallbackHeaderEnd).toString("utf8")
  const body = output.subarray(fallbackHeaderEnd + separatorLength)
  const headers = new Headers()
  let status = 200

  for (const line of rawHeaders.split(/\r?\n/)) {
    const index = line.indexOf(":")
    if (index === -1) continue
    const name = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    if (!name) continue
    if (name.toLowerCase() === "status") {
      status = Number(value.split(" ")[0]) || status
      continue
    }
    headers.append(name, value)
  }

  headers.set("Cache-Control", "no-store")
  return { body, headers, status }
}

function runGitHttpBackend({
  body,
  contentType,
  method,
  query,
  relativePath,
  repo,
  repository,
  username,
}: {
  body?: Buffer
  contentType?: string
  method: string
  query: string
  relativePath: string
  repo: string
  repository: NonNullable<ReturnType<typeof getLocalRepository>>
  username: string
}) {
  const projectRoot = dirname(dirname(repository.barePath))
  const output = execFileSync("git", ["http-backend"], {
    env: {
      ...process.env,
      CONTENT_LENGTH: String(body?.byteLength ?? 0),
      CONTENT_TYPE: method === "POST" ? (contentType ?? "") : "",
      GIT_HTTP_EXPORT_ALL: "1",
      GIT_PROJECT_ROOT: projectRoot,
      PATH_INFO: `/${username}/${repo}/${relativePath}`,
      QUERY_STRING: query,
      REMOTE_USER: username,
      REQUEST_METHOD: method,
    },
    input: body,
    maxBuffer: 1024 * 1024 * 128,
  })

  return parseGitHttpResponse(output)
}

function isSmartInfoRefsRequest(request: Request, relativePath: string) {
  if (relativePath !== "info/refs") return false
  const service = new URL(request.url).searchParams.get("service")
  return Boolean(service && SMART_GIT_SERVICES.has(service))
}

function isSmartRpcPath(relativePath: string) {
  return SMART_GIT_SERVICES.has(relativePath)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[]; repo: string; username: string }> }
) {
  const parsed = parseRoute(await params)
  if (!parsed) return new NextResponse("Not found", { status: 404 })

  const { relativePath, repository, repo, username } = parsed

  if (isSmartInfoRefsRequest(request, relativePath)) {
    const result = runGitHttpBackend({
      method: "GET",
      query: new URL(request.url).searchParams.toString(),
      relativePath,
      repo,
      repository,
      username,
    })
    return new NextResponse(new Uint8Array(result.body), { headers: result.headers, status: result.status })
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[]; repo: string; username: string }> }
) {
  const parsed = parseRoute(await params)
  if (!parsed) return new NextResponse("Not found", { status: 404 })

  const { relativePath, repo, repository, repositoryName, username } = parsed
  if (!isSmartRpcPath(relativePath)) return new NextResponse("Not found", { status: 404 })

  const body = Buffer.from(await request.arrayBuffer())
  const result = runGitHttpBackend({
    body,
    contentType: request.headers.get("content-type") ?? undefined,
    method: "POST",
    query: new URL(request.url).searchParams.toString(),
    relativePath,
    repo,
    repository,
    username,
  })

  if (relativePath === "git-receive-pack" && result.status < 400) {
    syncLocalRepositoryWorkTree(username, repositoryName)
  }

  return new NextResponse(new Uint8Array(result.body), { headers: result.headers, status: result.status })
}
