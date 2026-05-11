"use client"

import * as React from "react"
import { Copy, Download, SquareArrowOutUpRight } from "lucide-react"
import { toast } from "sonner"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import { ContextMenuGroup, ContextMenuItem } from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"

type ImageProps = React.ComponentProps<"img"> & {
  src: string
  alt: string
}

export default function Image({
  src,
  alt,
  className,
  style,
  ...props
}: ImageProps) {
  const openInNewTab = () => {
    window.open(src, "_blank", "noopener,noreferrer")
  }

  const copyImage = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const item = new ClipboardItem({
        [blob.type || "image/png"]: blob,
      })
      await navigator.clipboard.write([item])
      toast.success("Image copied")
    } catch {
      try {
        await navigator.clipboard.writeText(src)
        toast.success("Image URL copied")
      } catch {
        toast.error("Could not copy image")
      }
    }
  }

  const downloadImage = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = alt || "image"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      const a = document.createElement("a")
      a.href = src
      a.download = alt || "image"
      a.click()
    }
  }

  return (
    <BrowserContextMenu
      triggerClassName="inline-block max-w-full min-w-0 align-middle"
      menuChildren={
        <>
          <ContextMenuGroup>
            <ContextMenuItem onClick={openInNewTab}>
              <SquareArrowOutUpRight />
              Open image in new tab
            </ContextMenuItem>
            <ContextMenuItem onClick={copyImage}>
              <Copy />
              Copy image
            </ContextMenuItem>
            <ContextMenuItem onClick={downloadImage}>
              <Download />
              Download image
            </ContextMenuItem>
          </ContextMenuGroup>
        </>
      }
    >
      <img
        src={src}
        alt={alt}
        className={cn("h-auto max-w-full", className)}
        style={{ maxWidth: "100%", ...style }}
        {...props}
      />
    </BrowserContextMenu>
  )
}
