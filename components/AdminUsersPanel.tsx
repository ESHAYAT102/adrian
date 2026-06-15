import Link from "next/link"

import type { LocalRepositoryMetadata } from "@/lib/local-git"
import type { LocalUser } from "@/lib/local-users"

type AdminUsersPanelProps = {
  repositories: LocalRepositoryMetadata[]
  users: LocalUser[]
}

export default function AdminUsersPanel({
  repositories,
  users,
}: AdminUsersPanelProps) {
  const repositoryCountByOwner = new Map<string, number>()
  for (const repository of repositories) {
    repositoryCountByOwner.set(
      repository.owner,
      (repositoryCountByOwner.get(repository.owner) ?? 0) + 1
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">User accounts</h1>
        <p className="text-sm text-muted-foreground">
          Manage normal account owners and review their repositories.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {users.length > 0 ? (
          <div className="divide-y divide-border">
            {users.map((user) => {
              const repositoryCount =
                repositoryCountByOwner.get(user.username) ?? 0
              return (
                <Link
                  key={user.username}
                  href={`/${user.username}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {user.displayName || user.username}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  <div className="shrink-0 px-3 py-1 text-sm text-muted-foreground">
                    {repositoryCount}{" "}
                    {repositoryCount === 1 ? "repository" : "repositories"}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-muted-foreground">
            No normal user accounts yet.
          </div>
        )}
      </div>
    </div>
  )
}
