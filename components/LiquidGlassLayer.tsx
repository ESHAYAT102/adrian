"use client"

import type { CSSProperties } from "react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { LIQUID_GLASS_CONFIG } from "@/lib/liquid-glass-config"
import { getDisplacementFilter } from "@/lib/liquid-glass"

type LiquidGlassLayerProps = {
  radius?: number
  depth?: number
  blur?: number
  strength?: number
  chromaticAberration?: number
  className?: string
  liquidClassName?: string
  fallbackClassName?: string
}

type Size = {
  height: number
  width: number
}

const liquidGlassSupportValue =
  "blur(1px) url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E#x')"

const canUseLiquidGlass = () => {
  if (typeof navigator === "undefined" || typeof CSS === "undefined") {
    return false
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const isFirefox = userAgent.includes("firefox")

  return (
    !isFirefox &&
    (CSS.supports("backdrop-filter", liquidGlassSupportValue) ||
      CSS.supports("-webkit-backdrop-filter", liquidGlassSupportValue))
  )
}

export default function LiquidGlassLayer({
  radius = LIQUID_GLASS_CONFIG.radius,
  depth = LIQUID_GLASS_CONFIG.depth,
  blur = LIQUID_GLASS_CONFIG.blur,
  strength = LIQUID_GLASS_CONFIG.strength,
  chromaticAberration = LIQUID_GLASS_CONFIG.chromaticAberration,
  className,
  liquidClassName = "bg-background/40",
  fallbackClassName = "bg-background/75 backdrop-blur-md",
}: LiquidGlassLayerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size>({ height: 1, width: 1 })
  const [supportsLiquidGlass, setSupportsLiquidGlass] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect()

      setSize({
        height: Math.max(1, Math.round(rect.height)),
        width: Math.max(1, Math.round(rect.width)),
      })
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSupportsLiquidGlass(canUseLiquidGlass())
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  const boundedDepth = Math.min(
    depth,
    Math.floor(Math.min(size.height, size.width) / 3)
  )

  const filter = getDisplacementFilter({
    height: size.height,
    width: size.width,
    radius,
    depth: boundedDepth,
    strength,
    chromaticAberration,
  })

  const style: CSSProperties = supportsLiquidGlass
    ? {
        backdropFilter: `blur(${blur / 2}px) url('${filter}') blur(${blur}px) brightness(1.12) saturate(1.45)`,
        WebkitBackdropFilter: `blur(${blur / 2}px) url('${filter}') blur(${blur}px) brightness(1.12) saturate(1.45)`,
      }
    : {}

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        supportsLiquidGlass ? liquidClassName : fallbackClassName,
        className
      )}
      ref={ref}
      style={style}
    />
  )
}
