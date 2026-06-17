"use client"

import { ArrowUp, ExternalLink, X } from "lucide-react"
import { useEffect, useState } from "react"

import A from "@/components/A"
import { Button } from "@/components/ui/button"
import { GITHUB_REPO } from "@/lib/version"

type VersionCheckState = {
  updateAvailable: boolean
  currentSha: string | null
  latestSha: string | null
  behindBy: number | null
  loading: boolean
}

export default function VersionCheckBanner() {
  const [state, setState] = useState<VersionCheckState>({
    updateAvailable: false,
    currentSha: null,
    latestSha: null,
    behindBy: null,
    loading: true,
  })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/version-check")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setState({
          updateAvailable: data.updateAvailable,
          currentSha: data.currentSha,
          latestSha: data.latestSha,
          behindBy: data.behindBy,
          loading: false,
        })
      })
      .catch(() => {
        if (cancelled) return
        setState((prev) => ({ ...prev, loading: false }))
      })
    return () => { cancelled = true }
  }, [])

  if (state.loading || dismissed || !state.updateAvailable) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
      <div className="flex items-center gap-2">
        <ArrowUp className="size-4 shrink-0" />
        <span>
          A new version of Adrian is available
          {state.behindBy !== null ? ` (${state.behindBy} commit${state.behindBy === 1 ? "" : "s"} behind)` : ""}.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <A
          href={`https://github.com/${GITHUB_REPO}/commits/main`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:no-underline"
        >
          View changes
          <ExternalLink className="size-3" />
        </A>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="size-6 rounded-md"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
