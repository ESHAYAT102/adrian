"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Check, GitBranch, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { GitHubBranch } from "@/lib/github"
import { cn } from "@/lib/utils"

type RepositoryBranchSelectorProps = {
  branches: GitHubBranch[]
  commitRef?: string
  currentBranch: string
  owner: string
  repo: string
  selectedPath?: string
}

export default function RepositoryBranchSelector({
  branches,
  commitRef,
  currentBranch,
  owner,
  repo,
  selectedPath,
}: RepositoryBranchSelectorProps) {
  const [query, setQuery] = useState("")

  const filteredBranches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return branches
    }

    return branches.filter((branch) =>
      branch.name.toLowerCase().includes(normalizedQuery)
    )
  }, [branches, query])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-center rounded-xl sm:w-auto"
        >
          <GitBranch />
          <span className="truncate">{currentBranch}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[min(92vw,24rem)] rounded-2xl border border-border/70 bg-card p-3 shadow-2xl"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Switch branches
            </p>
            <p className="text-xs text-muted-foreground">
              Search available branches for this repository.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a branch..."
              className="pl-9"
            />
          </div>

          <ScrollArea className="max-h-72">
            <div className="space-y-1 pr-1">
              {filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => {
                  const baseParams = new URLSearchParams()
                  baseParams.set("branch", branch.name)
                  if (commitRef) baseParams.set("commit", commitRef)
                  if (selectedPath) baseParams.set("path", selectedPath)
                  const href = `/${owner}/${repo}?${baseParams.toString()}`

                  return (
                    <Link
                      key={branch.name}
                      href={href}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl py-2 pr-2 pl-3 text-sm transition hover:bg-accent/30",
                        branch.name === currentBranch
                          ? "bg-accent/20"
                          : undefined
                      )}
                    >
                      <GitBranch className="size-4 text-muted-foreground" />
                      <span className="truncate">{branch.name}</span>
                      {branch.name === currentBranch ? (
                        <Check className="ml-auto size-4 text-foreground" />
                      ) : null}
                    </Link>
                  )
                })
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-8 text-center text-sm text-muted-foreground">
                  No branches match that search.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
