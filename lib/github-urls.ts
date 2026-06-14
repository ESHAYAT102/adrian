export function encodeGitHubPath(path: string) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/")
}

export function buildRequestedGitHubUrl({
  branch,
  commit,
  discussion,
  issue,
  path,
  pr,
  repo,
  tab,
  username,
}: {
  branch?: string
  commit?: string
  discussion?: string
  issue?: string
  path?: string
  pr?: string
  repo: string
  tab?: string
  username: string
}) {
  const base = `https://github.com/${encodeURIComponent(username)}/${encodeURIComponent(repo)}`
  const ref = commit?.trim() || branch?.trim()

  if (issue) return `${base}/issues/${encodeURIComponent(issue)}`
  if (pr) return `${base}/pull/${encodeURIComponent(pr)}`
  if (discussion) return `${base}/discussions/${encodeURIComponent(discussion)}`

  if (path?.trim()) {
    const encodedRef = encodeURIComponent(ref || "HEAD")
    return `${base}/blob/${encodedRef}/${encodeGitHubPath(path)}`
  }

  if (tab === "commits") {
    return ref
      ? `${base}/commits/${encodeURIComponent(ref)}`
      : `${base}/commits`
  }
  if (tab === "issues") return `${base}/issues`
  if (tab === "pulls") return `${base}/pulls`
  if (tab === "discussions") return `${base}/discussions`
  if (tab === "releases") return `${base}/releases`
  if (ref) return `${base}/tree/${encodeURIComponent(ref)}`

  return base
}
