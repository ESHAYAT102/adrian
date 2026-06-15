import { describe, expect, it } from "vitest"

import { getRepositoryItemIcon } from "@/components/RepositoryFileTree"

describe("repository file icons", () => {
  it("uses the Go file icon for .go files", () => {
    const icon = getRepositoryItemIcon({ name: "main.go", type: "file" })

    expect(icon.props["aria-label"]).toBe("Go file")
  })
})
