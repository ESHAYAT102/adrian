import { getRepositoryCommits, listLocalRepositories } from "@/lib/local-git"
import { listLocalUsers } from "@/lib/local-users"

export const ADMIN_DASHBOARD_FILTERS = [
  { days: 7, id: "7d", label: "Last 7 days" },
  { days: 30, id: "30d", label: "Last 30 days" },
  { days: 61, id: "2m", label: "Last 2 months" },
  { days: 92, id: "3m", label: "Last 3 months" },
  { days: 183, id: "6m", label: "Last 6 months" },
  { days: 365, id: "1y", label: "Last 1 year" },
] as const

export type AdminDashboardFilterId = typeof ADMIN_DASHBOARD_FILTERS[number]["id"]

export type AdminDashboardStats = {
  byFilter: Record<AdminDashboardFilterId, {
    commits: number
    newRepos: number
    newUsers: number
    totalRepos: number
  }>
  filters: typeof ADMIN_DASHBOARD_FILTERS
}

function isAfterOrEqual(dateValue: string, since: Date) {
  const date = new Date(dateValue)
  return Number.isFinite(date.getTime()) && date >= since
}

export function buildAdminDashboardStats({ now = new Date() }: { now?: Date } = {}): AdminDashboardStats {
  const users = listLocalUsers()
  const repositories = listLocalRepositories()
  const byFilter = Object.fromEntries(
    ADMIN_DASHBOARD_FILTERS.map((filter) => {
      const since = new Date(now)
      since.setDate(since.getDate() - filter.days)
      const commits = repositories.reduce(
        (total, repo) =>
          total + getRepositoryCommits(repo.owner, repo.name, 500).filter((commit) =>
            isAfterOrEqual(commit.date, since)
          ).length,
        0
      )

      return [
        filter.id,
        {
          commits,
          newRepos: repositories.filter((repo) => isAfterOrEqual(repo.createdAt, since)).length,
          newUsers: users.filter((user) => isAfterOrEqual(user.createdAt, since)).length,
          totalRepos: repositories.filter((repo) => isAfterOrEqual(repo.createdAt, since)).length,
        },
      ]
    })
  ) as AdminDashboardStats["byFilter"]

  return { byFilter, filters: ADMIN_DASHBOARD_FILTERS }
}
