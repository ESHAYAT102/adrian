"use client"

import * as React from "react"
import Link from "next/link"
import { Copy, SquareArrowOutUpRight } from "lucide-react"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import { ContextMenuGroup, ContextMenuItem } from "@/components/ui/context-menu"

type AProps = React.ComponentProps<"a"> & {
  href: string
  prefetch?: React.ComponentProps<typeof Link>["prefetch"]
}

export default function A({
  href,
  children,
  className,
  prefetch = true,
  ...props
}: AProps) {
  const isInternalHref = href.startsWith("/")

  const openInNewTab = () => {
    window.open(href, "_blank", "noopener,noreferrer")
  }

  const copyUrl = async () => {
    const url = href.startsWith("http") ? href : window.location.origin + href
    await navigator.clipboard.writeText(url)
  }

  return (
    <BrowserContextMenu
      triggerClassName="inline"
      menuChildren={
        <>
          <ContextMenuGroup>
            <ContextMenuItem onClick={openInNewTab}>
              <SquareArrowOutUpRight />
              Open in new tab
            </ContextMenuItem>
            <ContextMenuItem onClick={copyUrl}>
              <Copy />
              Copy URL
            </ContextMenuItem>
          </ContextMenuGroup>
        </>
      }
    >
      {isInternalHref ? (
        <Link href={href} className={className} prefetch={prefetch} {...props}>
          {children}
        </Link>
      ) : (
        <a href={href} className={className} {...props}>
          {children}
        </a>
      )}
    </BrowserContextMenu>
  )
}
