import { unstable_cache } from "next/cache"

import type { Activity } from "@/components/contribution-graph"

type GitHubContributionsResponse = {
  contributions?: Activity[]
}

function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== "object") {
    return false
  }

  const activity = value as Partial<Activity>
  return (
    typeof activity.date === "string" &&
    typeof activity.count === "number" &&
    typeof activity.level === "number"
  )
}

export const getCachedContributions = unstable_cache(
  async (username: string) => {
    try {
      const baseUrl =
        process.env.GITHUB_CONTRIBUTIONS_API_URL ||
        "https://github-contributions-api.jogruber.de"
      const year = new Date().getFullYear()
      const response = await fetch(`${baseUrl}/v4/${username}?y=${year}`)

      if (!response.ok) {
        return []
      }

      const data = (await response.json()) as GitHubContributionsResponse
      return (data.contributions ?? []).filter(isActivity)
    } catch {
      return []
    }
  },
  ["github-contributions"],
  { revalidate: 86_400 }
)
