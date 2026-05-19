"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AppKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.altKey || event.shiftKey) return

      if (event.key === "," && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        router.push("/settings")
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [router])

  return null
}
