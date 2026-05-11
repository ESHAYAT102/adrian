"use client"

import { useMemo, useState } from "react"
import {
  CircleDot,
  FilePlus2,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquare,
  Star,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ProfileActivityItem } from "@/lib/github"
import A from "./A"

type HomeActivityProps = {
  activity: ProfileActivityItem[]
}

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function getCategoryIcon(category: ProfileActivityItem["category"]) {
  switch (category) {
    case "Commits":
      return GitCommitHorizontal
    case "Discussions":
      return MessageSquare
    case "Issues":
      return CircleDot
    case "Pull Requests":
      return GitPullRequest
    case "Repositories Created":
      return FilePlus2
    case "Stars":
      return Star
  }
}

export default function HomeActivity({ activity }: HomeActivityProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "commits" | "discussions" | "issues" | "prs"
  >("all")

  const filteredActivity = useMemo(() => {
    if (activeTab === "all") return activity.slice(0, 20)
    if (activeTab === "commits")
      return activity.filter((a) => a.category === "Commits").slice(0, 20)
    if (activeTab === "discussions")
      return activity.filter((a) => a.category === "Discussions").slice(0, 20)
    if (activeTab === "issues")
      return activity.filter((a) => a.category === "Issues").slice(0, 20)
    if (activeTab === "prs")
      return activity.filter((a) => a.category === "Pull Requests").slice(0, 20)
    return activity.slice(0, 20)
  }, [activity, activeTab])

  const commits = activity.filter((a) => a.category === "Commits")
  const discussions = activity.filter((a) => a.category === "Discussions")
  const issues = activity.filter((a) => a.category === "Issues")
  const prs = activity.filter((a) => a.category === "Pull Requests")

  if (activity.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="px-6 py-16 text-center text-muted-foreground">
          No recent activity found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === "all" ? "secondary" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setActiveTab("all")}
        >
          All
        </Button>
        <Button
          variant={activeTab === "commits" ? "secondary" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("commits")}
        >
          <GitCommitHorizontal className="size-4" />
          Commits
          <span className="text-xs text-muted-foreground">
            {commits.length}
          </span>
        </Button>
        <Button
          variant={activeTab === "discussions" ? "secondary" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("discussions")}
        >
          <MessageSquare className="size-4" />
          Discussions
          <span className="text-xs text-muted-foreground">
            {discussions.length}
          </span>
        </Button>
        <Button
          variant={activeTab === "issues" ? "secondary" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("issues")}
        >
          <CircleDot className="size-4" />
          Issues
          <span className="text-xs text-muted-foreground">{issues.length}</span>
        </Button>
        <Button
          variant={activeTab === "prs" ? "secondary" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("prs")}
        >
          <GitPullRequest className="size-4" />
          PRs
          <span className="text-xs text-muted-foreground">{prs.length}</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredActivity.map((item) => {
          const Icon = getCategoryIcon(item.category)
          return (
            <A
              key={item.id}
              href={item.internalUrl ?? item.url}
              className="block"
            >
              <Card className="transition hover:bg-accent/20">
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {item.category}
                    </span>
                  </div>
                  {item.status === "open" && (
                    <Badge variant="outline" className="text-xs">
                      Open
                    </Badge>
                  )}
                  {item.status === "closed" && (
                    <Badge variant="secondary" className="text-xs">
                      Closed
                    </Badge>
                  )}
                  {item.status === "merged" && (
                    <Badge className="bg-purple-500/20 text-xs text-purple-400">
                      Merged
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="truncate text-sm">{item.title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.repoName} · {formatRelativeDate(item.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </A>
          )
        })}
      </div>
    </div>
  )
}
