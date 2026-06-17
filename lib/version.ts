import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export { GITHUB_REPO } from "@/lib/version-shared"
import { UPSTREAM_API } from "@/lib/version-shared"

export function getDeployedSha(): string | null {
  if (process.env.SOURCE_VERSION) return process.env.SOURCE_VERSION
  try {
    const gitHead = join(process.cwd(), ".git", "HEAD")
    if (!existsSync(gitHead)) return null
    const ref = readFileSync(gitHead, "utf8").trim()
    if (ref.startsWith("ref: ")) {
      const refPath = join(process.cwd(), ".git", ref.slice(5))
      if (!existsSync(refPath)) return null
      return readFileSync(refPath, "utf8").trim()
    }
    return ref
  } catch {
    return null
  }
}

type VersionCheckResult = {
  updateAvailable: boolean
  currentSha: string | null
  latestSha: string | null
  behindBy: number | null
  error?: string
}

let cachedResult: { data: VersionCheckResult; expiresAt: number } | null = null

export async function checkForUpdates(): Promise<VersionCheckResult> {
  if (cachedResult && Date.now() < cachedResult.expiresAt) {
    return cachedResult.data
  }

  const currentSha = getDeployedSha()
  if (!currentSha) {
    const result: VersionCheckResult = {
      updateAvailable: false,
      currentSha: null,
      latestSha: null,
      behindBy: null,
      error: "Could not determine deployed version",
    }
    return cacheResult(result)
  }

  try {
    const res = await fetch(`${UPSTREAM_API}/commits/main`, {
      headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "adrian" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      const result: VersionCheckResult = {
        updateAvailable: false,
        currentSha,
        latestSha: null,
        behindBy: null,
        error: `GitHub API responded with ${res.status}`,
      }
      return cacheResult(result)
    }
    const data = await res.json()
    const latestSha = data.sha as string
    if (latestSha === currentSha) {
      const result: VersionCheckResult = {
        updateAvailable: false,
        currentSha,
        latestSha,
        behindBy: 0,
      }
      return cacheResult(result)
    }
    const compareRes = await fetch(`${UPSTREAM_API}/compare/${currentSha}...${latestSha}`, {
      headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "adrian" },
      signal: AbortSignal.timeout(5000),
    })
    const behindBy = compareRes.ok ? ((await compareRes.json()).behind_by as number) ?? null : null
    const result: VersionCheckResult = {
      updateAvailable: behindBy === null || behindBy > 0,
      currentSha,
      latestSha,
      behindBy,
    }
    return cacheResult(result)
  } catch (error) {
    const result: VersionCheckResult = {
      updateAvailable: false,
      currentSha,
      latestSha: null,
      behindBy: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
    return cacheResult(result)
  }
}

function cacheResult(data: VersionCheckResult): VersionCheckResult {
  cachedResult = { data, expiresAt: Date.now() + 3_600_000 }
  return data
}
