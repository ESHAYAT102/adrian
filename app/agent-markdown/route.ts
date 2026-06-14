import {
  buildHomeMarkdown,
  buildProfileMarkdown,
  buildRepositoryMarkdown,
  getBaseUrl,
  markdownResponse,
} from "@/lib/agent-discovery"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const pathname = url.searchParams.get("xenon_path") ?? "/"
  const pathParts = pathname.split("/").filter(Boolean)

  if (pathParts.length === 0) {
    return markdownResponse(buildHomeMarkdown(getBaseUrl(request)))
  }

  if (pathParts.length === 1) {
    return markdownResponse(await buildProfileMarkdown(pathParts[0]))
  }

  const markdown = await buildRepositoryMarkdown({
    branch: url.searchParams.get("branch") ?? undefined,
    commit: url.searchParams.get("commit") ?? undefined,
    owner: pathParts[0],
    path: url.searchParams.get("path") ?? undefined,
    repo: pathParts[1],
  })

  if (!markdown) {
    return markdownResponse(
      `# Not Found\n\nNo matching Xenon page was found.`,
      {
        status: 404,
      }
    )
  }

  return markdownResponse(markdown)
}
