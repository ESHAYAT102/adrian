import { createHash } from "node:crypto"

import {
  getGitHubProfilePageData,
  getGitHubRepositoryPageData,
  type GitHubRepositoryContent,
} from "@/lib/github"

export const SITE_NAME = "Xenon"
export const SITE_DESCRIPTION =
  "Adrian is the Xenon experience rebuilt on its own self-hosted Git server: a keyboard-first workspace for browsing local profiles, repositories, files, README content, and commits."

const MARKDOWN_HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=300",
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
}

const JSON_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
}

export const XENON_AGENT_SKILL = `---
name: xenon-discovery
description: Use Xenon to inspect public GitHub profiles, repositories, README files, and repository metadata in concise Markdown.
---

# Xenon Discovery

Use this skill when you need to inspect public GitHub content through Xenon.

## Available URLs

- \`/\` describes Xenon and its machine-readable entry points.
- \`/{username}\` returns a GitHub profile summary and public repositories.
- \`/{username}/{repo}\` returns repository metadata, root files, and README content.
- \`/{username}/{repo}?path=docs/guide.md\` returns a selected file when available.

## Markdown Negotiation

- Send \`Accept: text/markdown\` to any public content route.
- Xenon responds with \`Content-Type: text/markdown; charset=utf-8\`.
- Xenon varies cache entries with \`Vary: Accept\`.
`

export function getBaseUrl(request?: Request) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.PORTLESS_URL

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "")
  }

  if (request) {
    return new URL(request.url).origin
  }

  return "http://localhost:8390"
}

export function jsonResponse(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...init?.headers,
    },
  })
}

export function markdownResponse(markdown: string, init?: ResponseInit) {
  return new Response(markdown.trimStart(), {
    ...init,
    headers: {
      ...MARKDOWN_HEADERS,
      ...init?.headers,
    },
  })
}

export function textResponse(text: string, init?: ResponseInit) {
  return new Response(text, {
    ...init,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Type": "text/plain; charset=utf-8",
      ...init?.headers,
    },
  })
}

export function sha256Digest(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`
}

function escapeMarkdown(value: string | null | undefined) {
  return (value ?? "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|")
}

function formatRepositoryContents(contents: GitHubRepositoryContent[]) {
  if (contents.length === 0) {
    return "- No root files are available."
  }

  return contents
    .slice(0, 100)
    .map((item) => `- ${item.type}: \`${item.path}\` (${item.size} bytes)`)
    .join("\n")
}

export function buildHomeMarkdown(baseUrl: string) {
  return `# ${SITE_NAME}

${SITE_DESCRIPTION}

## Agent Entry Points

- Markdown negotiation: send \`Accept: text/markdown\` to public pages.
- LLM index: ${baseUrl}/llms.txt
- Full LLM context: ${baseUrl}/llms-full.txt
- Sitemap: ${baseUrl}/sitemap.xml
- Robots policy: ${baseUrl}/robots.txt
- Agent skills index: ${baseUrl}/.well-known/agent-skills/index.json
- OpenAPI description: ${baseUrl}/openapi.json

## Public Routes

- \`/{username}\`: GitHub profile summary and public repositories.
- \`/{username}/{repo}\`: repository summary, file tree, and README.
- \`/{username}/{repo}?path={file}\`: selected repository file preview.
`
}

export async function buildProfileMarkdown(username: string) {
  const profileData = await getGitHubProfilePageData(username, null)

  if (profileData.rateLimited) {
    return `# ${username}

Adrian could not load local profile data.
`
  }

  const { profile, repositories } = profileData
  if (!profile) return `# ${username}\n\nUser not found.\n`
  const rows = repositories
    .slice(0, 100)
    .map(
      (repo) =>
        `| [${escapeMarkdown(repo.name)}](/${profile.login}/${repo.name}) | ${escapeMarkdown(repo.description) || "-"} | ${repo.language ?? "-"} | ${repo.stargazers_count} | ${repo.forks_count} |`
    )
    .join("\n")

  return `# ${profile.name ? `${profile.name} (${profile.login})` : profile.login}

${profile.bio ?? "No bio is available."}

## Profile

- GitHub: ${profile.html_url}
- Type: ${profile.type ?? "User"}
- Public repositories: ${profile.public_repos}
- Followers: ${profile.followers ?? 0}
- Following: ${profile.following ?? 0}
- Location: ${profile.location ?? "Not listed"}
- Website: ${profile.blog || "Not listed"}

## Repositories

| Repository | Description | Language | Stars | Forks |
| --- | --- | --- | ---: | ---: |
${rows || "| - | - | - | 0 | 0 |"}
`
}

export async function buildRepositoryMarkdown({
  branch,
  commit,
  owner,
  path,
  repo,
}: {
  branch?: string
  commit?: string
  owner: string
  path?: string
  repo: string
}) {
  const ref = commit?.trim() || branch
  const data = await getGitHubRepositoryPageData(owner, repo, null, path, ref)

  if (!data) {
    return null
  }

  if (data.rateLimited && !data.repository) {
    return `# ${owner}/${repo}

Adrian could not load local repository data.
`
  }

  const repository = data.repository
  if (!repository) {
    return null
  }

  const selected = data.selectedItem
  const readme = data.readme

  return `# ${repository.full_name ?? `${owner}/${repo}`}

${repository.description ?? "No repository description is available."}

## Repository

- GitHub: ${repository.html_url}
- Visibility: ${repository.private ? "private" : "public"}
- Default branch: ${repository.default_branch ?? "main"}
- Primary language: ${repository.language ?? "Not listed"}
- Stars: ${repository.stargazers_count}
- Forks: ${repository.forks_count}
- Archived: ${repository.archived ? "yes" : "no"}
- Homepage: ${repository.homepage || "Not listed"}
- Updated: ${repository.updated_at}

## Root Contents

${formatRepositoryContents(data.contents)}

${
  selected
    ? `## Selected File: ${selected.path}

- GitHub: ${selected.htmlUrl ?? "Not available"}
- Download: ${selected.downloadUrl ?? "Not available"}
- Size: ${selected.text.length} characters

\`\`\`${selected.isMarkdown ? "markdown" : ""}
${selected.text}
\`\`\`
`
    : readme
      ? `## README: ${readme.path}

- GitHub: ${readme.htmlUrl}

${readme.markdown}
`
      : "## README\n\nNo README content is available."
}
`
}
