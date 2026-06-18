import ProfileRepositories from "@/components/ProfileRepositories"
import type { GitHubRepository } from "@/lib/github"

type TrendingRepositoriesProps = {
  repositories: GitHubRepository[]
}

export default function TrendingRepositories({
  repositories,
}: TrendingRepositoriesProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Repositories
        </h1>
        <p className="text-sm text-muted-foreground">
          All repositories on the system.
        </p>
      </div>

      <ProfileRepositories
        repositories={repositories}
        showStarredToggle={false}
      />
    </div>
  )
}
