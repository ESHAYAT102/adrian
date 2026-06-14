"use client"

import A from "@/components/A"
import BrowserContextMenu from "@/components/BrowserContextMenu"
import { ContextMenuItem } from "@/components/ui/context-menu"
import { Copy, SquareArrowOutUpRight } from "lucide-react"

type RepositoryRowProps = {
  description: string | null
  htmlUrl: string
  isPrivate: boolean
  language: string | null
  name: string
  stars: number
  updatedAt: string
}

export default function RepositoryRow({
  description,
  htmlUrl,
  isPrivate,
  language,
  name,
  stars,
  updatedAt,
}: RepositoryRowProps) {
  return (
    <BrowserContextMenu
      triggerClassName="block"
      menuChildren={
        <>
          <ContextMenuItem
            onClick={() => {
              window.open(htmlUrl, "_blank", "noopener,noreferrer")
            }}
          >
            <SquareArrowOutUpRight />
            Open in Adrian
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              window.open(htmlUrl, "_blank", "noopener,noreferrer")
            }}
          >
            <SquareArrowOutUpRight />
            Open in new tab
          </ContextMenuItem>
          <ContextMenuItem
            onClick={async () => {
              await navigator.clipboard.writeText(htmlUrl)
            }}
          >
            <Copy />
            Copy URL
          </ContextMenuItem>
        </>
      }
    >
      <A
        href={htmlUrl}
        target="_blank"
        rel="noreferrer"
        className="grid gap-3 px-5 py-4 transition hover:bg-accent/40 md:grid-cols-[minmax(0,1fr)_140px_140px_120px]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="truncate font-medium">{name}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {isPrivate ? "Private" : "Public"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {description || "No description"}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {language || "Unknown"}
        </div>
        <div className="text-sm text-muted-foreground">{stars} stars</div>
        <div className="text-sm text-muted-foreground">{updatedAt}</div>
      </A>
    </BrowserContextMenu>
  )
}
