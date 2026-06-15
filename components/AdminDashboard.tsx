"use client"

import { useState } from "react"
import { GitCommitHorizontal, GitFork, Timer, UserPlus } from "lucide-react"

import type {
  AdminDashboardFilterId,
  AdminDashboardStats,
} from "@/lib/admin-dashboard"

const STAT_META = [
  {
    key: "commits",
    label: "Commits",
    icon: GitCommitHorizontal,
    description: "Commits authored in the selected window",
  },
  {
    key: "newUsers",
    label: "New users",
    icon: UserPlus,
    description: "Normal accounts registered in the selected window",
  },
  {
    key: "newRepos",
    label: "New repos",
    icon: GitFork,
    description: "Repositories created in the selected window",
  },
  {
    key: "totalRepos",
    label: "Total repos",
    icon: Timer,
    description: "Repositories created in the selected window",
  },
] as const

type AdminDashboardProps = {
  stats: AdminDashboardStats
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<AdminDashboardFilterId>(
    stats.filters[0]?.id ?? "7d"
  )
  const activeStats = stats.byFilter[activeFilter] ?? stats.byFilter["7d"]

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Admin dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Site overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Track commits, users, and repository growth across Adrian.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Dashboard date range
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as AdminDashboardFilterId)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            {stats.filters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_META.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.key}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-xl border border-border bg-background p-2 text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="mt-5 text-3xl font-semibold tracking-tight">
                {activeStats[item.key].toLocaleString()}
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {item.label}
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
