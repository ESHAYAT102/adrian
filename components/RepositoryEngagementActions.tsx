"use client"

import { useState } from "react"
import { GitFork, Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type RepositoryEngagementActionsProps = {
  canFork?: boolean
  initialForkCount: number
  initialIsStarred: boolean
  initialStarCount: number
  owner: string
  repo: string
}

export default function RepositoryEngagementActions({
  canFork = true,
  initialForkCount,
  initialIsStarred,
  initialStarCount,
  owner,
  repo,
}: RepositoryEngagementActionsProps) {
  const [isStarred, setIsStarred] = useState(initialIsStarred)
  const [starCount, setStarCount] = useState(initialStarCount)
  const [forkCount, setForkCount] = useState(initialForkCount)
  const [isTogglingStar, setIsTogglingStar] = useState(false)
  const [isForking, setIsForking] = useState(false)
  const [forkDialogOpen, setForkDialogOpen] = useState(false)
  const [forkName, setForkName] = useState(repo)

  const handleStarToggle = async () => {
    if (isTogglingStar) return

    const nextStarred = !isStarred
    setIsTogglingStar(true)
    setIsStarred(nextStarred)
    setStarCount((current) => current + (nextStarred ? 1 : -1))

    const response = await fetch("/api/repository-actions", {
      body: JSON.stringify({
        action: nextStarred ? "star" : "unstar",
        owner,
        repo,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    if (!response.ok) {
      setIsStarred(!nextStarred)
      setStarCount((current) => current + (nextStarred ? -1 : 1))
      toast.error(
        nextStarred
          ? "Could not star repository"
          : "Could not unstar repository"
      )
    } else {
      toast.success(nextStarred ? "Repository starred" : "Repository unstarred")
    }

    setIsTogglingStar(false)
  }

  const handleForkDialogOpen = () => {
    setForkName(repo)
    setForkDialogOpen(true)
  }

  const handleFork = async () => {
    if (isForking) return

    setIsForking(true)

    const response = await fetch("/api/repository-actions", {
      body: JSON.stringify({
        action: "fork",
        forkName,
        owner,
        repo,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    if (response.ok) {
      setForkCount((current) => current + 1)
      setForkDialogOpen(false)
      toast.success("Repository forked successfully")
    } else {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Could not fork repository")
    }

    setIsForking(false)
  }

  return (
    <div className="grid w-full grid-cols-1 gap-2 min-[440px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap">
      <Button
        type="button"
        variant={isStarred ? "secondary" : "outline"}
        className="w-full rounded-xl sm:w-auto"
        onClick={handleStarToggle}
        data-repo-action-star
      >
        <Star className={isStarred ? "fill-current" : undefined} />
        Star
        <span className="text-muted-foreground">{starCount}</span>
      </Button>

      {canFork ? (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl sm:w-auto"
            onClick={handleForkDialogOpen}
            data-repo-action-fork
          >
            <GitFork />
            Fork
            <span className="text-muted-foreground">{forkCount}</span>
          </Button>

          <Dialog open={forkDialogOpen} onOpenChange={setForkDialogOpen}>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Fork repository</DialogTitle>
                <DialogDescription>
                  This will fork <span className="font-medium text-foreground">{owner}/{repo}</span> into your account.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="fork-name">
                  Repository name
                </label>
                <Input
                  id="fork-name"
                  value={forkName}
                  onChange={(e) => setForkName(e.target.value)}
                  placeholder="Enter repository name"
                  autoFocus
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setForkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFork}
                  disabled={isForking || !forkName.trim()}
                >
                  {isForking ? "Forking..." : "Fork"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
